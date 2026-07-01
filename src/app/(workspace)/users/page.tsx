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
import { db, Profile } from '@/lib/supabase';
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

  useEffect(() => {
    setCurrentUser(db.getCurrentUser());
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
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
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role, password })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Trigger confetti
        confetti({
          particleCount: 50,
          spread: 45,
          colors: ['#CE1126', '#C5A880', '#0F172A']
        });
        
        setIsModalOpen(false);
        // Reset form
        setName('');
        setEmail('');
        setRole('staff');
        setPassword('ABTeam2026!');
        
        // Refresh users list
        await fetchUsers();
      } else {
        setFormError(data.error || 'فشل إنشاء الحساب');
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
        const response = await fetch(`/api/admin/users?id=${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          await fetchUsers();
        } else {
          const data = await response.json();
          alert(data.error || 'فشل حذف الحساب');
        }
      } catch (err) {
        console.error('Failed to delete user:', err);
      }
    }
  };

  // RBAC Access Restriction: Only Admin can access
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-lg mx-auto shadow-sm space-y-4" dir="rtl">
        <ShieldAlert className="w-16 h-16 text-red-650 mx-auto animate-bounce" />
        <h3 className="text-lg font-extrabold text-slate-800">قسم مغلق وصلاحيات غير كافية</h3>
        <p className="text-xs text-slate-550 leading-relaxed font-medium">
          عذراً، تقتصر صلاحية إنشاء المستخدمين وإدارة الصلاحيات (RBAC) بالكامل على المدير العام للنظام.
          يرجى التبديل لدور **(أ. سامح سمير)** من محاكي الصلاحيات أسفل القائمة الجانبية لتصفح هذا القسم.
        </p>
      </div>
    );
  }

  const getRoleBadge = (r: Profile['role']) => {
    switch (r) {
      case 'admin':
        return 'bg-slate-900 text-white border-slate-900';
      case 'consultant':
        return 'bg-brand-gold/15 text-brand-gold border-brand-gold/30';
      case 'staff':
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getRoleName = (r: Profile['role']) => {
    if (r === 'admin') return 'مدير عام';
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

      {/* Users table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-slate-100 border-t-brand-gold rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500 font-semibold">جاري جلب حسابات المستخدمين...</p>
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
                        title={u.id === currentUser?.id ? 'لا يمكنك حذف حسابك الحالي' : 'حذف هذا المستخدم'}
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
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: أ. محمد أحمد"
                    className="w-full border border-slate-200 pr-9 pl-3 py-2 rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">البريد الإلكتروني للعمل*</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@abteam.com"
                    className="w-full border border-slate-200 pr-9 pl-3 py-2 rounded-lg text-xs text-left font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">صلاحية المستخدم (الدور)*</label>
                <select 
                  value={role}
                  onChange={(e: any) => setRole(e.target.value)}
                  className="w-full border border-slate-200 p-2 rounded-lg text-xs font-bold"
                >
                  <option value="staff">موظف إداري (عرض التقويم والمهام)</option>
                  <option value="consultant">مستشار ضريبي (قراءة وتعديل الملفات وصياغة الطعون)</option>
                  <option value="admin">مدير عام للنظام (صلاحيات كاملة + إدارة المستخدمين)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">كلمة مرور افتراضية لحسابه*</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                    <Key className="w-4 h-4" />
                  </span>
                  <input 
                    type="text" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ABTeam2026!"
                    className="w-full border border-slate-200 pr-9 pl-3 py-2 rounded-lg text-xs text-left font-mono"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">يستطيع الموظف استخدام هذا البريد وكلمة المرور لتسجيل الدخول الفعلي.</span>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-bold text-slate-950 bg-brand-gold hover:bg-brand-gold-hover transition-all shadow-md disabled:opacity-50"
              >
                {formLoading ? 'جاري تسجيله سحابياً...' : 'تسجيل المستخدم وحفظ الصلاحية'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
