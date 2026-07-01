'use client';

import React, { useEffect, useState } from 'react';
import { db, Organization } from '@/lib/supabase';
import { Scale, Phone, MapPin, Loader2, Award, Clock, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

export default function LawyerOfficePage({ params }: PageProps) {
  const router = useRouter();
  const [subdomain, setSubdomain] = useState<string>('');
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(unwrapped => {
      setSubdomain(unwrapped.subdomain);
    }).catch(err => {
      console.error("Failed to unwrap page params:", err);
      setLoading(false);
    });
  }, [params]);

  useEffect(() => {
    if (!subdomain) return;
    fetchOfficeProfile();
  }, [subdomain]);

  const fetchOfficeProfile = async () => {
    try {
      const data = await db.getOrganizationBySlug(subdomain);
      if (data) {
        setOrg(data);
      }
    } catch (e) {
      console.error("Error fetching organization:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterWorkspace = () => {
    if (org) {
      localStorage.setItem('ab_active_org_id', org.id);
      localStorage.setItem('ab_tenant_org', JSON.stringify(org));
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100" dir="rtl">
        <div className="text-center space-y-3">
          <Loader2 className="w-12 h-12 text-brand-gold animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-400">جاري تحميل الملف التعريفي للمكتب...</p>
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 text-slate-100 px-6 text-center" dir="rtl">
        <Scale className="w-16 h-16 text-brand-gold mb-6 animate-pulse" />
        <h2 className="text-xl font-extrabold text-white mb-2">موقع غير مسجل</h2>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-6">
          عذراً، هذا الرابط الفرعي غير مرتبط بأي مكتب استشاري مسجل في منصة سند للتمويل حالياً.
        </p>
        <button 
          onClick={() => router.push('/')}
          className="px-6 py-2.5 bg-brand-gold hover:bg-brand-gold-hover text-slate-950 rounded-lg text-xs font-bold transition-all shadow-md"
        >
          العودة للمنصة الرئيسية
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" dir="rtl">
      {/* Header */}
      <header className="w-full py-5 px-6 sm:px-12 flex justify-between items-center border-b border-slate-900 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Scale className="w-8 h-8 text-brand-gold" />
          <div>
            <h1 className="text-sm font-extrabold text-brand-gold">{org.name}</h1>
            <span className="text-[10px] text-slate-400 font-medium block">بوابة الاستشارات واللجان الضريبية</span>
          </div>
        </div>
        <button 
          onClick={handleEnterWorkspace}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-gold hover:bg-brand-gold-hover text-slate-950 rounded-lg text-[11px] font-extrabold transition-all shadow-md"
        >
          <span>دخول بيئة العمل</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-6 sm:px-12 text-center bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-900">
        <div className="bg-brand-gold/10 p-4 rounded-full border border-brand-gold/20 inline-flex mb-6">
          <Scale className="w-10 h-10 text-brand-gold" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">{org.name}</h2>
        <p className="text-brand-gold text-xs font-bold mb-6 tracking-wide">عضو معتمد في شبكة سند للتمويل (Sanad Finance SaaS)</p>
        <p className="max-w-2xl mx-auto text-slate-400 leading-relaxed text-xs sm:text-sm font-medium">
          {org.description || 'يقدم المكتب الاستشاري خدمات متكاملة في لجان الطعن الضريبي وتفنيد قرارات المأموريات الجزافية، حماية لحقوق المساهمين والشركات بالاعتماد على أفضل الكفاءات والخبرات.'}
        </p>
      </section>

      {/* Cards Section */}
      <section className="py-12 px-6 sm:px-12 flex-1 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Specialization Card */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <Award className="w-5 h-5 text-brand-gold" />
              <h3 className="text-xs font-extrabold text-brand-gold">مجالات تخصص المكتب</h3>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
              يقدم مكتبنا حلولاً استباقية وتمثيلاً قانونياً متكاملاً أمام لجان الطعن في:
            </p>
            <ul className="space-y-3.5 text-[11px] font-semibold text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-brand-gold">◆</span> منازعات ضريبة الأرباح التجارية والصناعية
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand-gold">◆</span> فحص لجان ضريبة القيمة المضافة وضريبة الجدول
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand-gold">◆</span> فحص ضريبة المرتبات وما في حكمها والتسويات السنوية
              </li>
              <li className="flex items-center gap-2">
                <span className="text-brand-gold">◆</span> صياغة الطعون القانونية وإعداد مذكرات الدفوع الفنية
              </li>
            </ul>
          </div>

          {/* Contact Info Card */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <Clock className="w-5 h-5 text-brand-gold" />
              <h3 className="text-xs font-extrabold text-brand-gold">بيانات الاتصال والمقر</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[11px] font-extrabold text-white mb-1">المقر الرئيسي للمكتب</h4>
                  <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{org.address || 'جمهورية مصر العربية'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[11px] font-extrabold text-white mb-1">هاتف التواصل</h4>
                  <p className="text-[11px] text-slate-400 font-mono font-medium">{org.phone || 'غير مدرج حالياً'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="mt-12 bg-slate-900 border border-brand-gold/20 rounded-xl p-6 text-center space-y-4">
          <h4 className="text-xs font-extrabold text-white">هل أنت موظف أو مستشار ضريبي في هذا المكتب؟</h4>
          <p className="text-[11px] text-slate-400 font-medium">يمكنك الدخول مباشرة إلى بيئة العمل السحابية المخصصة للمكتب لبدء متابعة لجان الفحص والملفات.</p>
          <button 
            onClick={handleEnterWorkspace}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-brand-gold hover:bg-brand-gold-hover text-slate-950 rounded-lg text-xs font-extrabold transition-all shadow-md"
          >
            <span>الدخول إلى بيئة عمل المكتب</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
