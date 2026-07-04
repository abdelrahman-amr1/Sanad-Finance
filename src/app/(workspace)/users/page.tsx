'use client';

import React, { useEffect, useState } from 'react';
import { 
  UserPlus, 
  Trash2, 
  ShieldAlert, 
  Mail, 
  User, 
  ShieldCheck, 
  Plus, 
  UserCheck, 
  Key,
  Users
} from 'lucide-react';
import { db, Profile, isSupabaseConfigured } from '@/lib/supabase';
import confetti from 'canvas-confetti';

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // New User Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'consultant' | 'staff'>('staff');
  const [password, setPassword] = useState('ABTeam2026!');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [orgMaxUsers, setOrgMaxUsers] = useState<number>(5);

  useEffect(() => {
    setCurrentUser(db.getCurrentUser());
    fetchUsers();
    fetchOrgLimit();
  }, []);

  const fetchOrgLimit = async () => {
    try {
      const activeOrgId = db.getActiveOrgId();
      const orgs = await db.getOrganizations();
      const match = orgs.find(o => o.id === activeOrgId);
      if (match) {
        setOrgMaxUsers(match.max_users || 5);
      }
    } catch (e) {
      console.error('Failed to load org limit:', e);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const response = await fetch('/api/admin/users');
        if (response.ok) {
          const data = await response.json();
          // Filter by active organization
          const activeOrgId = db.getActiveOrgId();
          const user = db.getCurrentUser();
          let list = data.users || [];
          if (user && user.role !== 'super_admin') {
            list = list.filter((u: any) => u.organization_id === user.organization_id);
          } else if (activeOrgId) {
            list = list.filter((u: any) => u.role === 'super_admin' || u.organization_id === activeOrgId);
          }
          setUsers(list);
        }
      } else {
        // Direct local mock db read (properly isolated by activeOrgId)
        setUsers(db.getProfiles());
      }
    } catch (e) {
      console.error('Failed to fetch users:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !role) {
      setFormError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      const activeOrgId = db.getActiveOrgId();
      const targetOrgId = currentUser?.role === 'super_admin' ? activeOrgId : currentUser?.organization_id;

      // Client-side user limit check (exclude super_admins from target limits)
      const currentOrgUsersCount = users.filter(u => u.organization_id === targetOrgId && u.role !== 'super_admin').length;
      if (currentOrgUsersCount >= orgMaxUsers) {
        setFormError(`عذراً، لقد تم الوصول للحد الأقصى للمستخدمين المسموح بهم لهذا المكتب (${orgMaxUsers} مستخدمين). يرجى الترقية لإضافة موظفين.`);
        setFormLoading(false);
        return;
      }

      if (isSupabaseConfigured) {
        const response = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email, 
            name, 
            role, 
            organizationId: targetOrgId, // Link to correct organization
            password 
          })
        });

        const data = await response.json();
        
        if (response.ok) {
          confetti({
            particleCount: 50,
            spread: 45,
            colors: ['#CE1126', '#C5A880', '#0F172A']
          });
          
          setIsModalOpen(false);
          setName('');
          setEmail('');
          setRole('staff');
          setPassword('ABTeam2026!');
          await fetchUsers();
        } else {
          setFormError(data.error || 'فشل إنشاء الحساب');
        }
      } else {
        // Direct local mock db creation
        let list: Profile[] = [];
        const stored = localStorage.getItem('ab_mock_profiles');
        if (stored) {
          list = JSON.parse(stored);
        } else {
          // Fallback to defaultProfiles from db
          list = [...db.getProfiles()];
        }
        
        const newProfile: Profile = {
          id: `usr-${Date.now()}`,
          name,
          email,
          role,
          organization_id: targetOrgId || undefined,
          avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces`
        };
        
        list.push(newProfile);
        localStorage.setItem('ab_mock_profiles', JSON.stringify(list));
        db.addAuditLog('إنشاء حساب مستخدم جديد (محاكاة)', `تم تسجيل الحساب: ${name} بدوره: ${role}`);
        
        confetti({
          particleCount: 50,
          spread: 45,
          colors: ['#CE1126', '#C5A880', '#0F172A']
        });
        
        setIsModalOpen(false);
        setName('');
        setEmail('');
        setRole('staff');
        setPassword('ABTeam2026!');
        await fetchUsers();
      }
    } catch (err: any) {
      setFormError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === currentUser?.id) {
      alert('لا يمكنك حذف حسابك الحالي النشط!');
      return;
    }

    if (confirm('هل أنت متأكد من رغبتك في حذف هذا الحساب نهائياً؟ سيتم إلغاء صلاحية دخوله وسجله في الحال.')) {
      try {
        if (isSupabaseConfigured) {
          const response = await fetch(`/api/admin/users?id=${id}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            await fetchUsers();
          } else {
            const data = await response.json();
            alert(data.error || 'فشل حذف الحساب');
          }
        } else {
          // Local mock deletion
          let rawList: Profile[] = [];
          const stored = localStorage.getItem('ab_mock_profiles');
          if (stored) {
            rawList = JSON.parse(stored);
          } else {
            rawList = db.getProfiles(); 
          }
          const filtered = rawList.filter(p => p.id !== id);
          localStorage.setItem('ab_mock_profiles', JSON.stringify(filtered));
          db.addAuditLog('حذف حساب مستخدم (محاكاة)', `حذف المعرف: ${id}`);
          await fetchUsers();
        }
      } catch (err) {
        console.error('Failed to delete user:', err);
      }
    }
  };

  // RBAC Access Restriction: Only Admin and Super Admin can access
  if (currentUser && currentUser.role !== 'admin' && currentUser.role !== 'super_admin') {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-lg mx-auto shadow-sm space-y-4" dir="rtl">
        <ShieldAlert className="w-16 h-16 text-red-650 mx-auto animate-bounce" />
        <h3 className="text-lg font-extrabold text-slate-800">قسم مغلق وصلاحيات غير كافية</h3>
        <p className="text-xs text-slate-550 leading-relaxed font-medium">
          عذراً، تقتصر صلاحية إنشاء المستخدمين وإدارة الصلاحيات (RBAC) بالكامل على المدير العام للمكتب أو مدير النظام.
          يرجى التبديل لدور **(أ. سامح سمير)** أو **(أ. عبد الرحمن عمرو)** من محاكي الصلاحيات أسفل القائمة الجانبية لتصفح هذا القسم.
        </p>
      </div>
    );
  }

  const getRoleBadge = (r: Profile['role']) => {
    switch (r) {
      case 'super_admin':
        return 'bg-brand-navy text-brand-gold border-brand-gold/30';
      case 'admin':
        return 'bg-slate-900 text-white border-slate-900';
      case 'consultant':
        return 'bg-brand-gold/15 text-brand-gold border-brand-gold/30';
      case 'staff':
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getRoleName = (r: Profile['role']) => {
    if (r === 'super_admin') return 'سوبر أدمن';
    if (r === 'admin') return 'مدير مكتب';
    if (r === 'consultant') return 'مستشار ضريبي';
    return 'موظف إداري';
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 no-print">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-gold" />
            إدارة المستخدمين وصلاحيات العمل
          </h2>
          <p className="text-slate-500 text-xs mt-1">التحكم في إضافة الموظفين وتعديل صلاحياتهم للوصول للجان الفحص والدفوع الاستشارية.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-navy text-white rounded-lg text-xs font-bold hover:bg-brand-navy-light transition-all shadow-md"
        >
          <UserPlus className="w-4 h-4 text-brand-gold" />
          إضافة موظف/مستخدم جديد
        </button>
      </div>

      {/* Quota Warning Banner */}
      {users.filter(u => u.role !== 'super_admin').length >= orgMaxUsers && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-800 font-bold mb-6 flex items-center justify-between no-print">
          <span>⚠️ تم الوصول للحد الأقصى للموظفين المتاحين في باقة المكتب الحالي ({orgMaxUsers} مستخدمين). يرجى التواصل مع الإدارة العامة لترقية باقتك.</span>
          <span className="px-2.5 py-1 bg-amber-100 border border-amber-300 text-amber-900 rounded text-[10px] font-extrabold uppercase">ممتلئ</span>
        </div>
      )}

      {/* Users table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-slate-100 border-t-brand-gold rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-550 font-semibold">جاري جلب حسابات المستخدمين...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150">
                <tr>
                  <th className="p-4">اسم الموظف</th>
                  <th className="p-4">البريد الإلكتروني</th>
                  <th className="p-4">الصلاحية (الترخيص)</th>
                  <th className="p-4">معرف الحساب</th>
                  <th className="p-4 text-left">العمليات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-slate-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-gold/10 border border-brand-gold/30 flex-shrink-0 flex items-center justify-center font-bold text-xs text-brand-gold">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          u.name[0]
                        )}
                      </div>
                      <span className="font-extrabold text-slate-900">{u.name}</span>
                    </td>
                    <td className="p-4 text-slate-500 font-medium">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRoleBadge(u.role)}`}>
                        {getRoleName(u.role)}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[10px] text-slate-400">{u.id}</td>
                    <td className="p-4 text-left">
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        disabled={u.id === currentUser?.id}
                        className="text-slate-400 hover:text-red-650 transition-colors disabled:opacity-30 disabled:hover:text-slate-450"
                        title={u.id === currentUser?.id ? 'لا يمكنك حذف حسابك الحالي النشط' : 'حذف هذا المستخدم'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for adding New User */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-150 flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-slate-900">تسجيل مستخدم جديد وصلاحية</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 text-xs font-bold"
              >
                إغلاق [X]
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded text-[11px]">
                  {formError}
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">اسم الموظف الكامل*</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: أ. محمد عبد الله"
                  className="w-full border border-slate-200 px-3 py-2 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">البريد الإلكتروني*</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@alnour.com"
                  className="w-full border border-slate-200 px-3 py-2 rounded-lg text-xs font-mono text-left"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">كلمة مرور الحساب الافتراضية*</label>
                <input 
                  type="text" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-200 px-3 py-2 rounded-lg text-xs font-mono text-left"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">يمكن للموظف تغييرها لاحقاً عند أول تسجيل دخول.</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">نوع الترخيص وصلاحية الدور*</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full border border-slate-200 px-3 py-2 rounded-lg text-xs"
                >
                  <option value="staff">موظف إداري (إدخال لجان ومهام ومتابعة)</option>
                  <option value="consultant">مستشار ضريبي (حضور جلسات وصياغة طعون ودفاع)</option>
                  <option value="admin">مدير مكتب (صلاحيات كاملة لإضافة مستخدمين وعملاء)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-bold text-slate-950 bg-brand-gold hover:bg-brand-gold-hover transition-all shadow-md disabled:opacity-50"
              >
                {formLoading ? 'جاري تسجيل المستخدم...' : 'إصدار الترخيص وتفعيل الحساب'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
