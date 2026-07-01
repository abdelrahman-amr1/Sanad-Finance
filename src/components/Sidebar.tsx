'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Gavel, 
  Sparkles, 
  Calendar, 
  Printer, 
  Users, 
  Shield, 
  UserCheck, 
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { Logo } from './Logo';
import { db, Profile } from '@/lib/supabase';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    setCurrentUser(db.getCurrentUser());
    setProfiles(db.getProfiles());
  }, []);

  const handleRoleChange = (profile: Profile) => {
    db.setCurrentUser(profile);
    setCurrentUser(profile);
    setShowRoleSelector(false);
    // Reload page to refresh context and database query state
    window.location.reload();
  };

  const navItems = [
    {
      name: 'لوحة التحكم',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'consultant', 'staff']
    },
    {
      name: 'لجان الفحص والطعن',
      href: '/committees',
      icon: Gavel,
      roles: ['admin', 'consultant', 'staff']
    },
    {
      name: 'المساعد الضريبي الذكي',
      href: '/consultant',
      icon: Sparkles,
      roles: ['admin', 'consultant', 'staff']
    },
    {
      name: 'الأجندة والمهام',
      href: '/tasks',
      icon: Calendar,
      roles: ['admin', 'consultant', 'staff']
    },
    {
      name: 'التقارير والطباعة',
      href: '/reports',
      icon: Printer,
      roles: ['admin', 'consultant']
    },
    {
      name: 'إدارة المستخدمين',
      href: '/users',
      icon: Users,
      roles: ['admin']
    }
  ];

  if (!currentUser) return null;

  return (
    <aside className="w-64 bg-slate-900 text-white h-screen flex flex-col fixed right-0 top-0 border-l border-slate-800 z-30 no-print">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-850 flex items-center justify-between">
        <Logo />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
        <span className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          الأقسام الرئيسية
        </span>
        {navItems.map((item) => {
          // Check if user has permission to see this link
          if (!item.roles.includes(currentUser.role)) return null;

          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-brand-gold text-slate-950 shadow-md font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-white'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Simulation & Settings footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-semibold text-brand-gold uppercase tracking-wider flex items-center gap-1">
            <Shield className="w-3 h-3 text-brand-gold" />
            محاكاة صلاحية المستخدم
          </span>
          <button 
            onClick={() => db.resetMockDb()}
            title="إعادة تهيئة البيانات الافتراضية"
            className="text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Active User Card with Switcher Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowRoleSelector(!showRoleSelector)}
            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/80 text-right transition-all border border-slate-800 hover:border-brand-gold/40"
          >
            {/* Avatar Placeholder */}
            <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-gold/10 border border-brand-gold/30 flex-shrink-0 flex items-center justify-center font-bold text-xs text-brand-gold">
              {currentUser.avatar_url ? (
                <img src={currentUser.avatar_url} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                currentUser.name[0]
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400 truncate">
                {currentUser.role === 'admin' ? 'مدير النظام' : currentUser.role === 'consultant' ? 'مستشار ضريبي' : 'موظف إداري'}
              </p>
            </div>
            
            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </button>

          {/* Role Selection Dropdown Menu */}
          {showRoleSelector && (
            <div className="absolute bottom-full right-0 left-0 mb-2 bg-slate-850 border border-slate-750 rounded-lg shadow-2xl overflow-hidden z-40 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="p-2 text-[10px] font-medium text-slate-400 bg-slate-900 border-b border-slate-750">
                اختر الحساب لمحاكاة الأدوار:
              </div>
              <div className="p-1 space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar">
                {profiles.map((p) => {
                  const isSelected = p.id === currentUser.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleRoleChange(p)}
                      className={`w-full flex items-center gap-2 p-2 rounded text-right text-xs transition-colors ${
                        isSelected 
                          ? 'bg-brand-gold/10 text-brand-gold border-r-2 border-brand-gold' 
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <UserCheck className={`w-3.5 h-3.5 ${isSelected ? 'text-brand-gold' : 'text-slate-400'}`} />
                      <div className="flex-1">
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-[10px] opacity-70">
                          {p.role === 'admin' ? 'مدير' : p.role === 'consultant' ? 'مستشار' : 'موظف'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
