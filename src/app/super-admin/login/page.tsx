'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
import { db, Profile, isSupabaseConfigured } from '@/lib/supabase';
import { ShieldAlert, Lock, Mail, ShieldCheck, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [superAdminProfile, setSuperAdminProfile] = useState<Profile | null>(null);

  useEffect(() => {
    // Find the super admin profile from profiles list for quick simulation
    const profiles = db.getProfiles();
    const superAdmin = profiles.find(p => p.role === 'super_admin') || null;
    setSuperAdminProfile(superAdmin);
    
    // Set Document Title
    document.title = 'سند | بوابة الإشراف العام والسوبر أدمن';

    // If already logged in as super_admin, redirect directly to super-admin dashboard
    const user = db.getCurrentUser();
    if (user && user.role === 'super_admin') {
      router.push('/super-admin/dashboard');
    }
  }, [router]);

  const handleSimulateLogin = () => {
    if (!superAdminProfile) return;
    setLoading(true);
    db.setCurrentUser(superAdminProfile);
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#CE1126', '#FFFFFF', '#000000', '#C5A880']
    });

    setTimeout(() => {
      router.push('/super-admin/dashboard');
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
    if (typeof window !== 'undefined') {
      (window as any).__isLoggingIn = true;
    }

    try {
      if (isSupabaseConfigured) {
        const { data, error: authError } = await db.signIn(email, password);
        if (authError) {
          setError(authError.message || 'خطأ في البريد الإلكتروني أو كلمة المرور');
        } else if (data?.user) {
          const profile = await db.getProfileById(data.user.id);
          if (profile) {
            if (profile.role !== 'super_admin') {
              await db.signOut();
              setError('عذراً، هذه البوابة مخصصة للإدارة العامة والسوبر أدمن فقط.');
              setLoading(false);
              if (typeof window !== 'undefined') {
                (window as any).__isLoggingIn = false;
              }
              return;
            }

            db.setCurrentUser(profile);

            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.8 },
              colors: ['#CE1126', '#FFFFFF', '#000000', '#C5A880']
            });

            setTimeout(() => {
              router.push('/super-admin/dashboard');
            }, 800);
          } else {
            setError('لم يتم العثور على ملف تعريف لهذا المستخدم.');
          }
        }
      } else {
        // Mock Mode check
        if (superAdminProfile && email === superAdminProfile.email) {
          handleSimulateLogin();
        } else {
          setError('الحساب غير مسجل كمدير عام في النظام المحلي.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
      if (typeof window !== 'undefined') {
        (window as any).__isLoggingIn = false;
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center relative overflow-hidden font-sans" dir="rtl">
      
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-gold/10 rounded-full blur-3xl -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/40 via-slate-950 to-slate-950 -z-10" />
      
      {/* Premium Top Egyptian Flag Stripe */}
      <div className="absolute top-0 left-0 right-0 h-1.5 flex">
        <div className="w-1/3 bg-egypt-red" />
        <div className="w-1/3 bg-white" />
        <div className="w-1/3 bg-egypt-black" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md p-4">
        {/* Header Branding */}
        <div className="flex flex-col items-center justify-center mb-8">
          <Logo showText={false} className="scale-125 mb-4" />
          <h2 className="text-xl font-extrabold text-white text-center">
            سند للاستشارات والضرائب | بوابة الإشراف العام
          </h2>
          <p className="mt-1.5 text-xs text-brand-gold font-bold tracking-wide text-center uppercase flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-gold" />
            منظومة إدارة المنصات متعددة المكاتب (SaaS Control)
          </p>
        </div>

        {/* Login Form Container */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-red-900/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          
          {/* Glowing Red-Gold Top Border */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-gold to-transparent" />

          <h3 className="text-base font-extrabold text-white mb-6 flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-gold" />
            الدخول الآمن للمشرف العام
          </h3>

          {error && (
            <div className="bg-red-950/40 border border-red-800 text-red-300 p-3 rounded-lg text-xs font-bold mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleFormLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                البريد الإلكتروني للـ Super Admin
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="super@sanad.ai"
                  className="block w-full pr-10 pl-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                كلمة المرور السرية
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pr-10 pl-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 text-sm placeholder-slate-650 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all"
                  required
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
                'تسجيل دخول المشرف'
              )}
            </button>
          </form>

          {/* Quick Simulation Login (Only shown in Local Mock Mode) */}
          {!isSupabaseConfigured && superAdminProfile && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-slate-900 text-slate-400 font-medium">أو الدخول السريع للمحاكاة</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSimulateLogin}
                disabled={loading}
                className="w-full flex items-center justify-between p-3 bg-slate-950/60 hover:bg-slate-900 border border-brand-gold/20 hover:border-brand-gold/60 rounded-xl text-slate-300 hover:text-white transition-all text-xs group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center font-bold text-xs text-brand-gold">
                    {superAdminProfile.avatar_url ? (
                      <img src={superAdminProfile.avatar_url} alt={superAdminProfile.name} className="w-full h-full object-cover" />
                    ) : (
                      'A'
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold block text-slate-200">{superAdminProfile.name}</span>
                    <span className="text-[10px] text-slate-400 block">{superAdminProfile.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-brand-gold">
                  <span>محاكاة دخول السوبر أدمن</span>
                  <ArrowLeft className="w-3.5 h-3.5 text-brand-gold group-hover:-translate-x-1 transition-transform" />
                </div>
              </button>
            </>
          )}

          {/* Go back to regular client portal */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-[11px] font-bold text-slate-400 hover:text-brand-gold hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              « الذهاب لبوابة المكاتب الاستشارية
            </button>
          </div>

        </div>

        <p className="mt-8 text-center text-[10px] text-slate-500 leading-relaxed">
          نظام سند لإدارة مكاتب المحاسبة والاستشارات الضريبية والقانونية متعدد المكاتب.
          <br />
          حقوق الطبع محفوظة &copy; {new Date().getFullYear()} شركة سند للاستشارات والضرائب.
        </p>
      </div>
    </div>
  );
}
