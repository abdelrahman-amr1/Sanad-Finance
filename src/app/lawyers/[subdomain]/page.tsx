'use client';

import React, { useEffect, useState } from 'react';
import { db, Organization } from '@/lib/supabase';
import { Scale, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PageProps {
  params: Promise<{ subdomain: string }>;
}

export default function LawyerOfficePage({ params }: PageProps) {
  const router = useRouter();
  const [subdomain, setSubdomain] = useState<string>('');
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
        
        // Auto-configure the active tenant in browser context
        localStorage.setItem('ab_active_org_id', data.id);
        localStorage.setItem('ab_tenant_org', JSON.stringify(data));
        
        // Instantly redirect to the isolated login screen
        router.replace('/');
      } else {
        setNotFound(true);
        setLoading(false);
      }
    } catch (e) {
      console.error("Error fetching organization:", e);
      setNotFound(true);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100" dir="rtl">
        <div className="text-center space-y-3">
          <Loader2 className="w-12 h-12 text-brand-gold animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-400">جاري تهيئة بيئة العمل الخاصة بالمكتب...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 text-slate-100 px-6 text-center" dir="rtl">
        <Scale className="w-16 h-16 text-brand-gold mb-6 animate-pulse" />
        <h2 className="text-xl font-extrabold text-white mb-2">مكتب غير مسجل</h2>
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

  return null;
}
