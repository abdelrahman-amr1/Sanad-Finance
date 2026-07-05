'use client';

import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  Plus, 
  ShieldAlert, 
  Calendar, 
  Globe, 
  MapPin, 
  Phone, 
  Edit3
} from 'lucide-react';
import { db, Profile, Organization } from '@/lib/supabase';
import confetti from 'canvas-confetti';

export default function OrganizationsPage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Mode (creation vs editing)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [maxUsers, setMaxUsers] = useState<number>(5);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setCurrentUser(db.getCurrentUser());
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const orgs = await db.getOrganizations();
      setOrganizations(orgs);
    } catch (e) {
      console.error('Failed to fetch organizations:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingOrg(null);
    setName('');
    setSlug('');
    setAddress('');
    setPhone('');
    setDescription('');
    setMaxUsers(5);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (org: Organization) => {
    setEditingOrg(org);
    setName(org.name);
    setSlug(org.slug);
    setAddress(org.address || '');
    setPhone(org.phone || '');
    setDescription(org.description || '');
    setMaxUsers(org.max_users || 5);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCreateOrUpdateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) {
      setFormError('يرجى إدخال اسم المكتب والعنوان الفرعي');
      return;
    }

    // Validate slug (letters, numbers, hyphens only)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setFormError('العنوان الفرعي يجب أن يحتوي على حروف صغيرة وأرقام وعلامة ناقص (-) فقط (بدون مسافات)');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      if (editingOrg) {
        // Edit Mode
        await db.updateOrganization(editingOrg.id, {
          name,
          slug,
          address: address || undefined,
          phone: phone || undefined,
          description: description || undefined,
          max_users: Number(maxUsers)
        });
      } else {
        // Create Mode
        await db.addOrganization({ 
          name, 
          slug, 
          address: address || undefined, 
          phone: phone || undefined, 
          description: description || undefined,
          max_users: Number(maxUsers)
        });
      }
      
      // Trigger confetti
      confetti({
        particleCount: 50,
        spread: 60,
        colors: ['#CE1126', '#C5A880', '#0F172A']
      });

      setIsModalOpen(false);
      setName('');
      setSlug('');
      setAddress('');
      setPhone('');
      setDescription('');
      setEditingOrg(null);
      
      // Refresh list
      await fetchOrganizations();
    } catch (err: any) {
      setFormError(err.message || 'فشل حفظ بيانات المنصة');
    } finally {
      setFormLoading(false);
    }
  };

  // RBAC Lock: Only Super Admin can access
  if (currentUser && currentUser.role !== 'super_admin') {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-lg mx-auto shadow-sm space-y-4" dir="rtl">
        <ShieldAlert className="w-16 h-16 text-red-650 mx-auto animate-bounce" />
        <h3 className="text-lg font-extrabold text-slate-800">صلاحيات غير كافية</h3>
        <p className="text-xs text-slate-550 leading-relaxed font-medium">
          عذراً، تقتصر صلاحية إضافة المكاتب الاستشارية وإدارة البنية التحتية بالكامل على **المدير العام لشركة سند للاستشارات والضرائب**.
          يرجى التبديل لدور **(أ. عبد الرحمن عمرو)** من محاكي الصلاحيات أسفل القائمة الجانبية لتصفح هذا القسم.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 no-print">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-brand-gold" />
            إدارة المكاتب والمنصات التابعة (Sanad Tax & Legal Consulting SaaS)
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            بوابة الإشراف العام لـ أ. عبد الرحمن عمرو لإضافة وتحديث بيانات المكاتب الاستشارية وتفاصيلها.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-brand-navy text-white rounded-lg text-xs font-bold hover:bg-brand-navy-light transition-all shadow-md animate-pulse hover:animate-none"
        >
          <Plus className="w-4 h-4 text-brand-gold" />
          تسجيل مكتب/منصة جديدة
        </button>
      </div>

      {/* Grid of Tenants */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-slate-100 border-t-brand-gold rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-semibold">جاري تحميل منصات المكاتب الاستشارية...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {organizations.map((org) => (
            <div 
              key={org.id}
              className="bg-white border border-slate-200 hover:border-brand-gold/45 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 relative overflow-hidden"
            >
              {/* Gold Top line */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-brand-gold" />

              {/* Title, Slug & Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900">{org.name}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(org)}
                      className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded"
                    >
                      <Edit3 className="w-3 h-3 text-slate-400" />
                      تعديل
                    </button>
                    <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold ${
                      org.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' : 'bg-red-50 text-red-700 border border-red-150'
                    }`}>
                      {org.status === 'active' ? 'نشط' : 'معطل'}
                    </span>
                  </div>
                </div>
                
                {/* Domain Link */}
                <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px]">
                  <Globe className="w-3.5 h-3.5 text-brand-gold" />
                  <span className="font-bold text-slate-700">رابط المنصة المباشر:</span>
                  <a 
                    href={`/lawyers/${org.slug}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-mono text-brand-navy hover:underline text-[10px]"
                  >
                    sanadfinance.vercel.app/lawyers/{org.slug}
                  </a>
                </div>

                {/* Description Box */}
                {org.description && (
                  <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 font-medium">
                    {org.description}
                  </p>
                )}

                {/* Address & Phone */}
                <div className="space-y-1.5 pt-1">
                  {org.address && (
                    <div className="flex items-start gap-1.5 text-[11px] text-slate-500 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-brand-gold shrink-0 mt-0.5" />
                      <span>{org.address}</span>
                    </div>
                  )}
                  {org.phone && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                      <Phone className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                      <span className="font-mono">{org.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100 my-2" />

              {/* Metadata */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  مسجل: {new Date(org.created_at).toLocaleDateString('ar-EG')}
                </span>
                <span className="font-extrabold text-slate-500">
                  الحد الأقصى: {org.max_users || 5} مستخدمين
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for adding/editing Organization */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-150 flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-slate-900">
                {editingOrg ? 'تعديل بيانات المكتب الاستشاري' : 'تسجيل مكتب/منصة جديدة'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 text-xs font-bold"
              >
                إغلاق [X]
              </button>
            </div>
            
            <form onSubmit={handleCreateOrUpdateOrg} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded text-[11px]">
                  {formError}
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">اسم المكتب الاستشاري*</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: مكتب الأمل للاستشارات والضرائب"
                  className="w-full border border-slate-200 px-3 py-2 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">العنوان الفرعي (Slug)*</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase())}
                    placeholder="e.g. alamal-tax"
                    className="w-full border border-slate-200 pl-3 pr-3 py-2 rounded-lg text-xs font-mono text-left"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block leading-relaxed">
                  رابط المنصة المباشر للمكتب:
                  <code className="bg-slate-50 px-1 py-0.5 border rounded text-brand-navy font-mono text-[9px] block mt-1">
                    sanadfinance.vercel.app/lawyers/{slug || 'alamal-tax'}
                  </code>
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">عنوان المقر الرئيسي</label>
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="مثال: 12 شارع التسعين، التجمع الخامس، القاهرة"
                  className="w-full border border-slate-200 px-3 py-2 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">الحد الأقصى للمستخدمين*</label>
                  <input 
                    type="number" 
                    value={maxUsers}
                    onChange={(e) => setMaxUsers(Number(e.target.value))}
                    min={1}
                    className="w-full border border-slate-200 px-3 py-2 rounded-lg text-xs font-mono text-center"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">هاتف التواصل للمكتب</label>
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="مثال: 02-33445566"
                    className="w-full border border-slate-200 px-3 py-2 rounded-lg text-xs font-mono text-left text-right"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">تفاصيل ونبذة عن المكتب</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب نبذة عن التخصص أو حجم القضايا ولجان الطعن التي يديرها المكتب..."
                  rows={3}
                  className="w-full border border-slate-200 px-3 py-2 rounded-lg text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-bold text-slate-950 bg-brand-gold hover:bg-brand-gold-hover transition-all shadow-md disabled:opacity-50"
              >
                {formLoading ? 'جاري الحفظ سحابياً...' : 'حفظ التغييرات'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
