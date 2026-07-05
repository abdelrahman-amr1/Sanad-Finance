'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { db, isSupabaseConfigured, Profile, Organization } from '@/lib/supabase';
import { getTenantFromHostname, getSlugFromHostname } from '@/lib/mockDb';
import { isRealAiActive } from '@/lib/gemini';
import { Database, Sparkles, AlertTriangle, ShieldCheck, Building2, Menu } from 'lucide-react';

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [resolvingTenant, setResolvingTenant] = useState(true);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string>('');
  const [aiActive, setAiActive] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const resolveTenant = async () => {
      const slug = getSlugFromHostname();
      if (slug) {
        try {
          const org = await db.getOrganizationBySlug(slug);
          if (org) {
            localStorage.setItem('ab_active_org_id', org.id);
            localStorage.setItem('ab_tenant_org', JSON.stringify(org));
          }
        } catch (e) {
          console.error('Failed to resolve tenant organization:', e);
        }
      } else {
        localStorage.removeItem('ab_tenant_org');
      }
      setResolvingTenant(false);
    };

    resolveTenant();
    setAiActive(isRealAiActive());
  }, []);

  useEffect(() => {
    if (resolvingTenant) return;

    const user = db.getCurrentUser();
    if (!user) {
      router.push('/');
    } else {
      setCurrentUser(user);
      
      // Load organizations list for super-admin switcher
      if (user.role === 'super_admin') {
        db.getOrganizations().then(orgs => {
          setOrganizations(orgs);
          setActiveOrgId(db.getActiveOrgId());
        }).catch(err => console.error('Failed to get orgs:', err));
      }
    }
    setLoading(false);
  }, [resolvingTenant, router]);

  useEffect(() => {
    if (resolvingTenant) return;
    const activeId = db.getActiveOrgId();
    if (activeId) {
      db.getOrganizations().then(orgs => {
        const match = orgs.find(o => o.id === activeId);
        if (match) {
          document.title = `سند | ${match.name}`;
        }
      }).catch(err => console.error(err));
    }
  }, [resolvingTenant, activeOrgId]);

  const handleOrgChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const orgId = e.target.value;
    db.setActiveOrgId(orgId);
    setActiveOrgId(orgId);
    // Reload page to refresh all active database queries with the new tenant's data
    window.location.reload();
  };

  if (resolvingTenant || loading) return (
    <div className="h-screen bg-slate-50 flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-slate-900 border-t-brand-gold rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 font-semibold text-sm">جاري تحديد نطاق المكتب الاستشاري...</p>
      </div>
    </div>
  );

  if (!currentUser) return null;

  const isTenantSubdomain = getTenantFromHostname().isSubdomain;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans" dir="rtl">
      {/* 1. Backdrop overlay for mobile */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-25 transition-opacity"
        />
      )}

      {/* 2. Right Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* 3. Main Content Container (offset by sidebar width on desktop) */}
      <div className="flex-1 md:mr-64 mr-0 flex flex-col min-h-screen">
        
        {/* Top Header / Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20 no-print">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              title="فتح القائمة"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-800 flex items-center gap-1.5">
              أهلاً بك، {currentUser.name}
              <span className="hidden sm:inline text-xs font-normal text-slate-400">
                | دورك الحالي: {currentUser.role === 'super_admin' ? 'سوبر أدمن (سند)' : currentUser.role === 'admin' ? 'مدير المكتب' : currentUser.role === 'consultant' ? 'مستشار ضريبي' : 'موظف إداري'}
              </span>
            </h1>
          </div>

          {/* Tenant Selector & Cloud Status Indicators */}
          <div className="flex items-center gap-4">
            {/* Tenant switcher dropdown for super_admin (Only show if NOT locked to a subdomain) */}
            {currentUser.role === 'super_admin' && organizations.length > 0 && !isTenantSubdomain && (
              <div className="flex items-center gap-2 border border-brand-gold/30 bg-brand-gold/10 px-3 py-1.5 rounded-lg shadow-sm">
                <Building2 className="w-3.5 h-3.5 text-brand-gold" />
                <span className="text-xs font-extrabold text-slate-850">المنصة النشطة:</span>
                <select 
                  value={activeOrgId} 
                  onChange={handleOrgChange}
                  className="bg-transparent text-xs font-extrabold text-slate-900 border-none outline-none cursor-pointer focus:ring-0"
                >
                  {organizations.map(org => (
                    <option key={org.id} value={org.id} className="text-slate-900 font-bold bg-white">
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Cloud Status Indicators */}
            <div className="flex items-center gap-3">
            {/* Supabase Status */}
            <div 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                isSupabaseConfigured 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title={isSupabaseConfigured ? 'قاعدة بيانات Supabase متصلة ونشطة' : 'قاعدة بيانات محلية مؤقتة نشطة'}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isSupabaseConfigured ? 'Supabase متصل' : 'سحابة محلية'}</span>
            </div>

            {/* Gemini AI Status */}
            <div 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                aiActive 
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                  : 'bg-orange-50 text-orange-700 border-orange-200'
              }`}
              title={aiActive ? 'محرك Gemini الذكي نشط' : 'محاكي الذكاء الاصطناعي نشط'}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{aiActive ? 'Gemini نشط' : 'محاكي AI'}</span>
            </div>
          </div>
        </div>
      </header>

        {/* Content Body */}
        <main className="flex-1 p-6 bg-[#F8FAFC] overflow-y-auto">
          {/* Global warning banner if in Mock Mode */}
          {!isSupabaseConfigured && (
            <div className="mb-6 bg-amber-50 border-r-4 border-amber-500 p-4 rounded-l-lg shadow-sm flex items-center justify-between no-print animate-pulse">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900">وضع المحاكاة والتشغيل التجريبي نشط</h4>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    النظام يعمل بقاعدة بيانات محلية ومحاكاة AI. لربط Supabase و Gemini السحابي بالكامل، يرجى إدخال مفتاح الذكاء الاصطناعي في ملف `.env.local`
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-amber-950 font-bold border border-amber-300 rounded px-2.5 py-1 bg-white">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                آمن للتشغيل الفوري
              </div>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
