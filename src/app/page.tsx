'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { db, Profile, isSupabaseConfigured } from '@/lib/supabase';
import { getTenantFromHostname, getSlugFromHostname } from '@/lib/mockDb';
import { Shield, Lock, Mail, Users, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [resolvingTenant, setResolvingTenant] = useState(true);
  const [isTenantMode, setIsTenantMode] = useState(false);
  const [tenantName, setTenantName] = useState('سند (Sanad) | المنصة الذكية لإدارة مكاتب المحاسبة والاستشارات');

  useEffect(() => {
    const resolveTenant = async () => {
      const slug = getSlugFromHostname();
      if (slug) {
        try {
          const org = await db.getOrganizationBySlug(slug);
          if (org) {
            localStorage.setItem('ab_active_org_id', org.id);
            localStorage.setItem('ab_tenant_org', JSON.stringify(org));
            setTenantName(org.name);
          }
        } catch (e) {
          console.error('Failed to resolve login tenant:', e);
        }
      } else {
        localStorage.removeItem('ab_tenant_org');
      }
      setResolvingTenant(false);
    };
    resolveTenant();
  }, []);

  useEffect(() => {
    if (resolvingTenant) return;

    // Check if user already logged in, redirect to dashboard
    const user = db.getCurrentUser();
    if (user && typeof window !== 'undefined' && localStorage.getItem('ab_current_user')) {
      router.push('/dashboard');
    }
    
    // Check if we are on a specific tenant subdomain or have an active tenant session
    const tenant = getTenantFromHostname();
    const storedTenant = typeof window !== 'undefined' ? localStorage.getItem('ab_tenant_org') : null;
    
    let tenantOrgId: string | undefined = undefined;
    let isTenantContext = false;
    
    if (tenant.isSubdomain && tenant.orgId) {
      tenantOrgId = tenant.orgId;
      isTenantContext = true;
    } else if (storedTenant) {
      try {
        const parsed = JSON.parse(storedTenant);
        if (parsed && parsed.id) {
          tenantOrgId = parsed.id;
          isTenantContext = true;
          setTenantName(parsed.name);
        }
      } catch (e) {}
    }

    setIsTenantMode(isTenantContext);
    
    let allProfiles = db.getProfiles(); // Returns filtered or all based on active Org
    
    if (isTenantContext && tenantOrgId) {
      // Filter: Only show profiles belonging to this tenant organization, hiding super_admin
      allProfiles = allProfiles.filter(p => p.organization_id === tenantOrgId);
    }
    
    setProfiles(allProfiles);
  }, [resolvingTenant, router]);

  useEffect(() => {
    if (tenantName) {
      document.title = `سند | ${tenantName}`;
    }
  }, [tenantName]);

  const handleSimulateLogin = (profile: Profile) => {
    setLoading(true);
    db.setCurrentUser(profile);
    
    // Trigger celebratory confetti on login
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#CE1126', '#FFFFFF', '#000000', '#C5A880'] // Egyptian flag colors + Gold
    });

    setTimeout(() => {
      router.push('/dashboard');
    }, 800);
  };

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      if (isSupabaseConfigured) {
        const { data, error: authError } = await db.signIn(email, password);
        if (authError) {
          setError(authError.message || 'خطأ في البريد الإلكتروني أو كلمة المرور');
        } else if (data?.user) {
          const profile = await db.getProfileById(data.user.id);
          if (profile) {
            // Verify tenant scope if in tenant context
            const tenant = getTenantFromHostname();
            const storedTenant = localStorage.getItem('ab_tenant_org');
            let tenantOrgId = tenant.isSubdomain ? tenant.orgId : null;
            if (!tenantOrgId && storedTenant) {
              try {
                tenantOrgId = JSON.parse(storedTenant).id;
              } catch (err) {}
            }

            if (tenantOrgId && profile.role !== 'super_admin' && profile.organization_id !== tenantOrgId) {
              await db.signOut();
              setError('عذراً، هذا الحساب غير مصرح له بالدخول لمكتب الاستشارات هذا.');
              setLoading(false);
              return;
            }

            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.8 },
              colors: ['#CE1126', '#FFFFFF', '#000000', '#C5A880']
            });

            setTimeout(() => {
              router.push('/dashboard');
            }, 800);
          } else {
            setError('لم يتم العثور على ملف تعريف لهذا المستخدم. يرجى التواصل مع الدعم الفني.');
          }
        }
      } else {
        const match = profiles.find(p => p.email === email);
        if (match) {
          handleSimulateLogin(match);
        } else {
          setError('الحساب غير مسجل في النظام المحلي.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  if (resolvingTenant) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-brand-gold rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 font-semibold text-sm">جاري تحميل المنصة...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center relative overflow-hidden font-sans" dir="rtl">
      
      {/* Background Graphic elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-navy-light/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-gold/5 rounded-full blur-3xl -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/40 via-slate-950 to-slate-950 -z-10" />
      
      {/* Egyptian Flag Subtle Background Stripe */}
      <div className="absolute top-0 left-0 right-0 h-1.5 flex">
        <div className="w-1/3 bg-egypt-red" />
        <div className="w-1/3 bg-white" />
        <div className="w-1/3 bg-egypt-black" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md p-4">
        {/* Logo and Name */}
        <div className="flex flex-col items-center justify-center mb-6">
          <Logo showText={false} className="scale-125 mb-4" />
          <h2 className="text-xl font-extrabold text-white text-center">
            المنصة الذكية لإدارة مكاتب المحاسبة والاستشارات الضريبية
          </h2>
          <p className="mt-1.5 text-xs text-brand-gold font-semibold tracking-wide text-center">
            {tenantName}
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-gold/50 to-transparent" />

          <h3 className="text-lg font-extrabold text-white mb-6 flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-gold" />
            تسجيل الدخول للمنصة
          </h3>

          {error && (
            <div className="bg-red-900/20 border border-red-800 text-red-300 p-3 rounded-lg text-xs font-bold mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleFormLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-350 mb-1.5">
                البريد الإلكتروني للعمل
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full pr-10 pl-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 text-sm placeholder-slate-650 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-350 mb-1.5">
                كلمة المرور
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                  <Shield className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pr-10 pl-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 text-sm placeholder-slate-650 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-bold text-slate-950 bg-brand-gold hover:bg-brand-gold-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold transition-all shadow-lg hover:shadow-brand-gold/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'دخول آمن'
              )}
            </button>
          </form>

          {/* Quick Simulation logins (Only shown in Mock Mode) */}
          {!isSupabaseConfigured && (
            <>
              {/* Separation line */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-slate-900 text-slate-400 font-medium">أو الدخول السريع للمحاكاة</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="text-[11px] text-slate-400 text-center mb-1">
                  اختر أحد الموظفين لتجربة لوحة التحكم والصلاحيات (RBAC) فوراً:
                </p>
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => handleSimulateLogin(profile)}
                    disabled={loading}
                    className="w-full flex items-center justify-between p-2.5 bg-slate-950/50 hover:bg-slate-900 border border-slate-800 hover:border-brand-gold/30 rounded-lg text-slate-300 hover:text-white transition-all text-xs text-right group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-brand-gold/10 border border-brand-gold/20 flex-shrink-0 flex items-center justify-center font-bold text-[10px] text-brand-gold">
                        {profile.avatar_url ? (
                          <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                        ) : (
                          profile.name[0]
                        )}
                      </div>
                      <div>
                        <span className="font-bold block text-right">{profile.name}</span>
                        <span className="text-[10px] text-slate-400 block text-right">{profile.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border border-slate-800 group-hover:border-brand-gold/20 ${
                        profile.role === 'super_admin' ? 'bg-brand-navy text-brand-gold' : 
                        profile.role === 'admin' ? 'bg-slate-900 text-white' : 
                        profile.role === 'consultant' ? 'bg-brand-gold/15 text-brand-gold' : 'bg-blue-900/10 text-blue-400'
                      }`}>
                        {profile.role === 'super_admin' ? 'سوبر أدمن' : profile.role === 'admin' ? 'مدير مكتب' : profile.role === 'consultant' ? 'مستشار ضريبي' : 'موظف إداري'}
                      </span>
                      <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-[-2px] transition-transform" />
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Go back to main portal option */}
          {isTenantMode && (
            <div className="mt-5 pt-4 border-t border-slate-800 text-center">
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('ab_tenant_org');
                  localStorage.removeItem('ab_active_org_id');
                  window.location.reload();
                }}
                className="text-[11px] font-bold text-brand-gold hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                « العودة لمنصة سند الرئيسية
              </button>
            </div>
          )}

        </div>

        {/* Footer legal disclaimer */}
        <p className="mt-8 text-center text-[10px] text-slate-500 leading-relaxed">
          حقوق الطبع محفوظة &copy; {new Date().getFullYear()} {tenantName}.
          <br />
          جميع الاستشارات والبيانات المسجلة تخضع لاتفاقية السرية وحماية بيانات الممولين.
        </p>
      </div>
    </div>
  );
}
