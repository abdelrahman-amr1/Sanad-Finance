'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { db, isSupabaseConfigured, Profile } from '@/lib/supabase';
import { isRealAiActive } from '@/lib/gemini';
import { Database, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = db.getCurrentUser();
    if (!user) {
      router.push('/');
    } else {
      setCurrentUser(user);
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-900 border-t-brand-gold rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold text-sm">جاري تحميل بيئة العمل...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans" dir="rtl">
      {/* 1. Right Sidebar */}
      <Sidebar />

      {/* 2. Main Content Container (offset by sidebar width, 256px / w-64) */}
      <div className="flex-1 mr-64 flex flex-col min-h-screen">
        
        {/* Top Header / Bar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 no-print">
          <div>
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              أهلاً بك، {currentUser.name}
              <span className="text-xs font-normal text-slate-400">
                | دورك الحالي: {currentUser.role === 'admin' ? 'مدير النظام' : currentUser.role === 'consultant' ? 'مستشار ضريبي' : 'موظف إداري'}
              </span>
            </h1>
          </div>

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
                isRealAiActive 
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                  : 'bg-orange-50 text-orange-700 border-orange-200'
              }`}
              title={isRealAiActive ? 'محرك Gemini الذكي نشط' : 'محاكي الذكاء الاصطناعي نشط'}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isRealAiActive ? 'Gemini نشط' : 'محاكي AI'}</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 bg-[#F8FAFC] overflow-y-auto">
          {/* Global warning banner if in Mock Mode */}
          {(!isSupabaseConfigured || !isRealAiActive) && (
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
