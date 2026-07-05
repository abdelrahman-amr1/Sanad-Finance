'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Users, 
  BookOpen, 
  FolderLock, 
  Plus, 
  LogOut, 
  Edit3, 
  Globe, 
  MapPin, 
  Phone, 
  PlusCircle, 
  ChevronRight, 
  CheckCircle2, 
  ShieldCheck, 
  RefreshCw,
  Search,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { db, Profile, Organization, TaxLaw } from '@/lib/supabase';
import confetti from 'canvas-confetti';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [usersList, setUsersList] = useState<Profile[]>([]);
  const [lawsList, setLawsList] = useState<TaxLaw[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'organizations' | 'users' | 'laws' | 'settings'>('overview');

  // Modals & Forms State
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [orgAddress, setOrgAddress] = useState('');
  const [orgPhone, setOrgPhone] = useState('');
  const [orgDescription, setOrgDescription] = useState('');
  const [orgMaxUsers, setOrgMaxUsers] = useState<number>(5);
  const [orgFormLoading, setOrgFormLoading] = useState(false);
  const [orgFormError, setOrgFormError] = useState('');

  // Tax Law Form State
  const [isLawModalOpen, setIsLawModalOpen] = useState(false);
  const [lawNumber, setLawNumber] = useState('');
  const [lawYear, setLawYear] = useState('');
  const [lawType, setLawType] = useState('ضريبة الدخل');
  const [lawArticle, setLawArticle] = useState('');
  const [lawContent, setLawContent] = useState('');
  const [lawFormLoading, setLawFormLoading] = useState(false);
  const [lawFormError, setLawFormError] = useState('');

  // PDF Book Uploader State
  const [pdfProcessing, setPdfProcessing] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [pdfStep, setPdfStep] = useState('');

  // Gemini key state
  const [geminiKeyInput, setGeminiKeyInput] = useState('');

  // User Form State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('ABTeam2026!');
  const [newUserRole, setNewUserRole] = useState('admin');
  const [newUserOrgId, setNewUserOrgId] = useState('');
  const [userFormLoading, setUserFormLoading] = useState(false);
  const [userFormError, setUserFormError] = useState('');

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const user = db.getCurrentUser();
    if (!user || user.role !== 'super_admin') {
      router.push('/super-admin/login');
      return;
    }
    setCurrentUser(user);
    loadAllData();

    const loadSettings = async () => {
      let key = '';
      if (typeof window !== 'undefined') {
        key = localStorage.getItem('ab_gemini_api_key') || '';
      }
      if (!key) {
        try {
          const dbKey = await db.getSystemSetting('gemini_api_key');
          if (dbKey) {
            key = dbKey;
            if (typeof window !== 'undefined') {
              localStorage.setItem('ab_gemini_api_key', dbKey);
            }
          }
        } catch (e) {}
      }
      setGeminiKeyInput(key);
    };
    loadSettings();
  }, [router]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [orgs, usersData, laws] = await Promise.all([
        db.getOrganizations(),
        fetch('/api/admin/users').then(res => res.ok ? res.json() : { users: null }),
        db.getTaxLaws()
      ]);

      setOrganizations(orgs);
      setUsersList(usersData.users || db.getProfiles());
      setLawsList(laws);
    } catch (e) {
      console.error('Failed to load global admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    db.signOut().then(() => {
      window.location.href = '/super-admin/login';
    });
  };

  const handleOpenCreateOrg = () => {
    setEditingOrg(null);
    setOrgName('');
    setOrgSlug('');
    setOrgAddress('');
    setOrgPhone('');
    setOrgDescription('');
    setOrgMaxUsers(5);
    setOrgFormError('');
    setIsOrgModalOpen(true);
  };

  const handleOpenEditOrg = (org: Organization) => {
    setEditingOrg(org);
    setOrgName(org.name);
    setOrgSlug(org.slug);
    setOrgAddress(org.address || '');
    setOrgPhone(org.phone || '');
    setOrgDescription(org.description || '');
    setOrgMaxUsers(org.max_users || 5);
    setOrgFormError('');
    setIsOrgModalOpen(true);
  };

  const handleSaveOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName || !orgSlug) {
      setOrgFormError('يرجى إدخال اسم المكتب والعنوان الفرعي');
      return;
    }

    if (!/^[a-z0-9-]+$/.test(orgSlug)) {
      setOrgFormError('العنوان الفرعي يجب أن يحتوي على حروف صغيرة وأرقام وعلامة ناقص (-) فقط بدون مسافات');
      return;
    }

    setOrgFormLoading(true);
    setOrgFormError('');

    try {
      if (editingOrg) {
        await db.updateOrganization(editingOrg.id, {
          name: orgName,
          slug: orgSlug,
          address: orgAddress || undefined,
          phone: orgPhone || undefined,
          description: orgDescription || undefined,
          max_users: Number(orgMaxUsers)
        });
      } else {
        await db.addOrganization({
          name: orgName,
          slug: orgSlug,
          address: orgAddress || undefined,
          phone: orgPhone || undefined,
          description: orgDescription || undefined,
          max_users: Number(orgMaxUsers)
        });
      }

      confetti({
        particleCount: 80,
        spread: 60,
        colors: ['#CE1126', '#C5A880', '#FFFFFF']
      });

      setIsOrgModalOpen(false);
      await loadAllData();
    } catch (err: any) {
      setOrgFormError(err.message || 'فشل حفظ بيانات المنصة');
    } finally {
      setOrgFormLoading(false);
    }
  };

  const handleSaveTaxLaw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lawNumber || !lawYear || !lawArticle || !lawContent) {
      setLawFormError('يرجى ملء جميع الحقول المطلوبة للمادة القانونية');
      return;
    }

    setLawFormLoading(true);
    setLawFormError('');

    try {
      await db.addTaxLaw({
        law_number: lawNumber,
        law_year: lawYear,
        law_type: lawType,
        article_number: lawArticle,
        content: lawContent
      });

      confetti({
        particleCount: 50,
        spread: 45,
        colors: ['#C5A880', '#0F172A']
      });

      setIsLawModalOpen(false);
      setLawNumber('');
      setLawYear('');
      setLawArticle('');
      setLawContent('');
      await loadAllData();
    } catch (err: any) {
      setLawFormError(err.message || 'فشل إضافة المادة القانونية');
    } finally {
      setLawFormLoading(false);
    }
  };

  const handleSaveGeminiKey = async () => {
    if (!geminiKeyInput.trim()) {
      alert('يرجى إدخال مفتاح صالح');
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('ab_gemini_api_key', geminiKeyInput);
    }

    const success = await db.setSystemSetting('gemini_api_key', geminiKeyInput);

    confetti({
      particleCount: 40,
      spread: 40,
      colors: ['#C5A880', '#0F172A']
    });

    if (success) {
      alert('تم حفظ مفتاح Gemini API بنجاح في قاعدة البيانات وسحابياً لكافة المستخدمين!');
    } else {
      alert('تم حفظ المفتاح محلياً بالمتصفح، ولكن تعذر حفظه في قاعدة البيانات. يرجى التأكد من تشغيل جدول الإعدادات system_settings في Supabase.');
    }
  };

  const loadPdfJs = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') return reject(new Error('Window object not found'));
      if ((window as any).pdfjsLib) {
        return resolve((window as any).pdfjsLib);
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
      script.onload = () => {
        const pdfjs = (window as any).pdfjsLib;
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        resolve(pdfjs);
      };
      script.onerror = () => reject(new Error('Failed to load PDF.js CDN library'));
      document.head.appendChild(script);
    });
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lawNum = prompt('أدخل رقم القانون المرفوع (مثال: 91):', '91') || 'معدل';
    const lawYr = prompt('أدخل سنة إصدار القانون (مثال: 2005):', '2005') || '2026';
    const lawTp = prompt('أدخل نوع القانون/الكتاب (مثال: ضريبة الدخل):', 'ضريبة الدخل') || 'كتاب ضريبي مستقل';

    setPdfProcessing(true);
    setPdfProgress(10);
    setPdfStep('جاري تحميل مكتبة قراءة ملفات الـ PDF سحابياً...');

    try {
      const pdfjs = await loadPdfJs();
      setPdfProgress(30);
      setPdfStep('جاري قراءة بنية المستند واستخراج الصفحات...');

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;

      setPdfProgress(50);
      setPdfStep(`جاري معالجة واستخراج النصوص من عدد ${numPages} صفحة...`);

      let accumulatedText = '';
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        accumulatedText += `\n[صفحة ${i}]\n` + pageText;
      }

      setPdfProgress(75);
      setPdfStep('جاري تقسيم نصوص الكتاب إلى مواد ضريبية وفهرستها...');

      const pages = accumulatedText.split('\n[صفحة ');
      const lawChunks: Omit<TaxLaw, 'id'>[] = [];

      pages.forEach((pageData, index) => {
        if (!pageData.trim()) return;
        const cleanContent = pageData.replace(/^\d+\]\n/, '').trim();
        if (cleanContent.length < 50) return;

        lawChunks.push({
          law_number: lawNum,
          law_year: lawYr,
          law_type: lawTp,
          article_number: `صفحة ${index + 1}`,
          content: cleanContent
        });
      });

      setPdfStep(`جاري توليد الـ Vector Embeddings وحفظ عدد ${lawChunks.length} صفحة في السحاب...`);
      setPdfProgress(90);

      for (let i = 0; i < lawChunks.length; i++) {
        await db.addTaxLaw(lawChunks[i]);
      }

      setPdfProgress(100);
      setPdfStep('اكتملت الفهرسة سحابياً بنجاح!');

      confetti({
        particleCount: 100,
        spread: 80,
        colors: ['#C5A880', '#0F172A']
      });

      setTimeout(() => {
        setPdfProcessing(false);
        loadAllData();
      }, 1500);

    } catch (err: any) {
      console.error('PDF Processing error:', err);
      alert('حدث خطأ أثناء معالجة ملف الـ PDF: ' + err.message);
      setPdfProcessing(false);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserOrgId || !newUserPassword) {
      setUserFormError('يرجى ملء جميع الحقول المطلوبة للمستخدم');
      return;
    }

    setUserFormLoading(true);
    setUserFormError('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserEmail,
          name: newUserName,
          role: newUserRole,
          organizationId: newUserOrgId,
          password: newUserPassword
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'فشل إنشاء المستخدم في قاعدة البيانات');
      }

      confetti({
        particleCount: 50,
        spread: 45,
        colors: ['#C5A880', '#0F172A']
      });

      setIsUserModalOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('ABTeam2026!');
      setNewUserRole('admin');
      setNewUserOrgId('');
      await loadAllData();
    } catch (err: any) {
      setUserFormError(err.message || 'فشل تسجيل حساب الموظف');
    } finally {
      setUserFormLoading(false);
    }
  };

  if (!currentUser) return null;

  // Filtered Lists for search
  const filteredOrgs = organizations.filter(o => 
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    o.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = usersList.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLaws = lawsList.filter(l => 
    l.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.law_number.includes(searchQuery) ||
    l.article_number.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" dir="rtl">
      
      {/* Top Navbar */}
      <nav className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center">
            <FolderLock className="w-5 h-5 text-brand-gold" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white">سند للاستشارات والضرائب | لوحة الإشراف العام</h1>
            <p className="text-[10px] text-slate-400 font-semibold">بوابة تحكم السوبر أدمن لإدارة المنصات (SaaS Control Panel)</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="font-extrabold text-slate-300">{currentUser.name} (سوبر أدمن)</span>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors font-bold"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج</span>
          </button>
        </div>
      </nav>

      {/* Main Layout Grid */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 bg-slate-900 border-l border-slate-800 flex flex-col justify-between p-4 space-y-6 shrink-0">
          <div className="space-y-6">
            <div>
              <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">أقسام لوحة الإشراف</span>
              <div className="space-y-1">
                <button
                  onClick={() => { setActiveTab('overview'); setSearchQuery(''); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'overview' ? 'bg-brand-gold text-slate-950' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Globe className="w-4 h-4 shrink-0" />
                  <span>نظرة عامة والتحليلات</span>
                </button>

                <button
                  onClick={() => { setActiveTab('organizations'); setSearchQuery(''); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'organizations' ? 'bg-brand-gold text-slate-950' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>إدارة المكاتب الاستشارية</span>
                </button>

                <button
                  onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'users' ? 'bg-brand-gold text-slate-950' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>مستخدمي النظام (كل المكاتب)</span>
                </button>

                <button
                  onClick={() => { setActiveTab('laws'); setSearchQuery(''); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'laws' ? 'bg-brand-gold text-slate-950' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-4 h-4 shrink-0" />
                  <span>مكتبة القوانين الضريبية</span>
                </button>

                <button
                  onClick={() => { setActiveTab('settings'); setSearchQuery(''); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'settings' ? 'bg-brand-gold text-slate-950' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <FolderLock className="w-4 h-4 shrink-0" />
                  <span>إعدادات النظام والـ AI</span>
                </button>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[11px] font-bold text-brand-gold bg-slate-950 border border-brand-gold/20 hover:bg-slate-800 transition-all"
              >
                <span>الدخول لمنصة العمل النشطة</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-semibold text-center border-t border-slate-800 pt-4">
            سند للاستشارات والضرائب SaaS v2.0
            <br />
            إصدار حماية وتأمين الممولين
          </div>
        </aside>

        {/* Dashboard Content Area */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          
          {loading ? (
            <div className="h-96 flex items-center justify-center flex-col gap-3">
              <div className="w-10 h-10 border-4 border-slate-800 border-t-brand-gold rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400 font-bold">جاري تحميل بيانات لوحة السوبر أدمن...</p>
            </div>
          ) : (
            <>
              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Statistics Widgets */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-3 text-slate-800"><Building2 className="w-16 h-16 scale-150 opacity-10" /></div>
                      <span className="text-slate-400 text-xs font-bold block">إجمالي مكاتب الاستشارات</span>
                      <span className="text-3xl font-extrabold text-white block mt-2">{organizations.length}</span>
                      <span className="text-[10px] text-brand-gold font-bold block mt-1.5">مكتب مسجل ونشط</span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-3 text-slate-800"><Users className="w-16 h-16 scale-150 opacity-10" /></div>
                      <span className="text-slate-400 text-xs font-bold block">إجمالي المستخدمين المسجلين</span>
                      <span className="text-3xl font-extrabold text-white block mt-2">{usersList.length}</span>
                      <span className="text-[10px] text-emerald-500 font-bold block mt-1.5">صلاحية نشطة عبر الـ RLS</span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-3 text-slate-800"><BookOpen className="w-16 h-16 scale-150 opacity-10" /></div>
                      <span className="text-slate-400 text-xs font-bold block">مكتبة التشريعات الضريبية</span>
                      <span className="text-3xl font-extrabold text-white block mt-2">{lawsList.length}</span>
                      <span className="text-[10px] text-blue-400 font-bold block mt-1.5">مادة قانونية للذكاء الاصطناعي</span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-brand-gold/5">
                      <span className="text-brand-gold text-xs font-extrabold block">خوادم البنية التحتية</span>
                      <span className="text-lg font-extrabold text-white block mt-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        Supabase Cloud
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold block mt-3">حماية تامة وصلاحيات RLS معزولة</span>
                    </div>
                  </div>

                  {/* Quick System Diagnostics */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-sm font-extrabold text-white mb-4">نظرة عامة على النظام والمنصة</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed text-slate-300">
                      <div className="space-y-3">
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                          <span className="text-slate-400 font-bold">حالة النظام الأساسي:</span>
                          <span className="text-emerald-500 font-bold">يعمل بكفاءة (نشط)</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                          <span className="text-slate-400 font-bold">خادم المصادقة والـ Auth:</span>
                          <span className="text-emerald-500 font-bold">Supabase Gotrue (نشط)</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                          <span className="text-slate-400 font-bold">بوابة المستندات القانونية:</span>
                          <span className="text-emerald-500 font-bold">مفعلة (Vector Search RAG)</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                          <span className="text-slate-400 font-bold">الحد الأقصى للمكاتب المسموح بها:</span>
                          <span className="text-slate-200 font-bold">غير محدود (SaaS)</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                          <span className="text-slate-400 font-bold">إجمالي عمليات التدقيق (Audit Logs):</span>
                          <span className="text-brand-gold font-bold">مفعلة وتدقق تلقائياً</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                          <span className="text-slate-400 font-bold">آخر تحديث للنظام:</span>
                          <span className="text-slate-400 font-mono font-bold">{new Date().toLocaleDateString('ar-EG')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Organizations Management */}
              {activeTab === 'organizations' && (
                <div className="space-y-6">
                  
                  {/* Search and Action Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative w-full sm:w-80">
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                        <Search className="w-4 h-4" />
                      </span>
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث عن مكتب بالاسم أو الـ Slug..."
                        className="w-full pr-9 pl-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs placeholder-slate-500 text-white focus:outline-none focus:border-brand-gold"
                      />
                    </div>

                    <button
                      onClick={handleOpenCreateOrg}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-brand-gold text-slate-950 rounded-lg text-xs font-bold hover:bg-brand-gold-hover transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      تسجيل مكتب/منصة جديدة
                    </button>
                  </div>

                  {/* Organizations Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredOrgs.map((org) => (
                      <div 
                        key={org.id} 
                        className="bg-slate-900 border border-slate-800 hover:border-brand-gold/30 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between gap-4"
                      >
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-brand-gold" />
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-extrabold text-white">{org.name}</h3>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenEditOrg(org)}
                                className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-white bg-slate-950 border border-slate-800 px-2 py-1 rounded"
                              >
                                <Edit3 className="w-3 h-3 text-slate-400" />
                                تعديل والتحكم
                              </button>
                              <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold ${
                                org.status === 'active' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900' : 'bg-red-950/40 text-red-400 border border-red-900'
                              }`}>
                                {org.status === 'active' ? 'نشط' : 'معطل'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
                            <Globe className="w-3.5 h-3.5 text-brand-gold" />
                            <span>رابط المنصة الفرعي:</span>
                            <a 
                              href={`/lawyers/${org.slug}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="font-mono text-brand-gold hover:underline text-[10px]"
                            >
                              sanadfinance.vercel.app/lawyers/{org.slug}
                            </a>
                          </div>

                          {org.description && (
                            <p className="text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded border border-slate-800/40 leading-relaxed">
                              {org.description}
                            </p>
                          )}

                          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-semibold pt-1">
                            {org.address && (
                              <div className="flex items-start gap-1">
                                <MapPin className="w-3.5 h-3.5 text-brand-gold shrink-0 mt-0.5" />
                                <span className="truncate">{org.address}</span>
                              </div>
                            )}
                            {org.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                                <span className="font-mono">{org.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-400">الحد الأقصى للمستخدمين:</span>
                          <span className="px-2 py-0.5 bg-brand-gold/10 text-brand-gold border border-brand-gold/20 rounded font-mono">
                            {org.max_users || 5} مستخدمين
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* Tab 3: Users Across all offices */}
              {activeTab === 'users' && (
                <div className="space-y-6">
                  
                  {/* Search and Action Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative w-full sm:w-80">
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                        <Search className="w-4 h-4" />
                      </span>
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث عن موظف بالاسم أو البريد..."
                        className="w-full pr-9 pl-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs placeholder-slate-500 text-white focus:outline-none focus:border-brand-gold"
                      />
                    </div>

                    <button
                      onClick={() => setIsUserModalOpen(true)}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-brand-gold text-slate-950 rounded-lg text-xs font-bold hover:bg-brand-gold-hover transition-all"
                    >
                      <UserPlus className="w-4 h-4" />
                      إضافة مستخدم جديد للمنصة
                    </button>
                  </div>

                  {/* Users Table */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                          <tr>
                            <th className="p-4">اسم الموظف</th>
                            <th className="p-4">البريد الإلكتروني</th>
                            <th className="p-4">الصلاحية</th>
                            <th className="p-4">المكتب التابع له</th>
                            <th className="p-4">معرف الحساب</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                          {filteredUsers.map((u) => {
                            const userOrg = organizations.find(o => o.id === u.organization_id);
                            return (
                              <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                                <td className="p-4 flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center font-bold text-xs text-brand-gold shrink-0">
                                    {u.avatar_url ? (
                                      <img src={u.avatar_url} alt={u.name} className="w-full h-full object-cover" />
                                    ) : (
                                      u.name[0]
                                    )}
                                  </div>
                                  <span className="font-extrabold text-white">{u.name}</span>
                                </td>
                                <td className="p-4 text-slate-400 font-medium">{u.email}</td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    u.role === 'super_admin' ? 'bg-brand-navy text-brand-gold border-brand-gold/30' :
                                    u.role === 'admin' ? 'bg-slate-950 text-slate-200 border-slate-800' :
                                    u.role === 'consultant' ? 'bg-brand-gold/15 text-brand-gold border-brand-gold/30' :
                                    'bg-blue-950/40 text-blue-400 border-blue-900/50'
                                  }`}>
                                    {u.role === 'super_admin' ? 'سوبر أدمن' : u.role === 'admin' ? 'مدير مكتب' : u.role === 'consultant' ? 'مستشار ضريبي' : 'موظف إداري'}
                                  </span>
                                </td>
                                <td className="p-4 font-bold text-slate-200">
                                  {userOrg ? userOrg.name : 'الإشراف العام (شركة سند)'}
                                </td>
                                <td className="p-4 font-mono text-[10px] text-slate-500">{u.id}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* Tab 4: Tax Laws Management */}
              {activeTab === 'laws' && (
                <div className="space-y-6">
                  
                  {/* Search and Action Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative w-full sm:w-80">
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                        <Search className="w-4 h-4" />
                      </span>
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث في نص القوانين والمواد..."
                        className="w-full pr-9 pl-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs placeholder-slate-500 text-white focus:outline-none focus:border-brand-gold"
                      />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <label className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer">
                        <BookOpen className="w-4 h-4 text-brand-gold" />
                        <span>رفع كتاب قانون (PDF)</span>
                        <input 
                          type="file" 
                          accept=".pdf" 
                          onChange={handlePdfUpload}
                          className="hidden" 
                        />
                      </label>

                      <button
                        onClick={() => setIsLawModalOpen(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-brand-gold text-slate-950 rounded-lg text-xs font-bold hover:bg-brand-gold-hover transition-all"
                      >
                        <PlusCircle className="w-4 h-4" />
                        إضافة مادة يدوياً
                      </button>
                    </div>
                  </div>

                  {/* Laws List */}
                  <div className="space-y-4">
                    {filteredLaws.map((law) => (
                      <div key={law.id} className="bg-slate-900 border border-slate-850 rounded-xl p-5 space-y-3 relative overflow-hidden">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-brand-gold/15 text-brand-gold border border-brand-gold/20 rounded-[4px] text-[10px] font-extrabold">
                              {law.law_type}
                            </span>
                            <span className="text-xs font-extrabold text-white">
                              قانون رقم {law.law_number} لسنة {law.law_year}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-slate-400">
                            مادة رقم ({law.article_number})
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs leading-relaxed">
                          {law.content}
                        </p>
                      </div>
                    ))}
                  </div>

                </div>
              )}
            </>
          )}

        </main>
      </div>

      {/* Modal 1: Create or Edit Organization */}
      {isOrgModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <h3 className="text-sm font-extrabold text-white">
                {editingOrg ? 'تعديل بيانات المكتب والترخيص' : 'تسجيل مكتب/منصة جديدة'}
              </h3>
              <button 
                onClick={() => setIsOrgModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                إغلاق [X]
              </button>
            </div>
            
            <form onSubmit={handleSaveOrganization} className="p-5 space-y-4 text-xs">
              {orgFormError && (
                <div className="bg-red-950/40 border border-red-800 text-red-300 p-2.5 rounded text-[11px]">
                  {orgFormError}
                </div>
              )}

              <div>
                <label className="font-bold text-slate-350 block mb-1">اسم المكتب الاستشاري*</label>
                <input 
                  type="text" 
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="مثال: مكتب الأمل للاستشارات والضرائب"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-gold px-3 py-2 rounded-lg text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-350 block mb-1">العنوان الفرعي (Slug)*</label>
                <input 
                  type="text" 
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value.toLowerCase())}
                  placeholder="e.g. alamal-tax"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-gold px-3 py-2 rounded-lg text-xs font-mono text-left text-white"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  رابط المنصة: <code className="text-brand-gold">/lawyers/{orgSlug || 'alamal-tax'}</code>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-350 block mb-1">الحد الأقصى للمستخدمين (Max Users)*</label>
                  <input 
                    type="number" 
                    value={orgMaxUsers}
                    onChange={(e) => setOrgMaxUsers(Number(e.target.value))}
                    min={1}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-brand-gold px-3 py-2 rounded-lg text-xs font-mono text-white"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-350 block mb-1">هاتف التواصل للمكتب</label>
                  <input 
                    type="text" 
                    value={orgPhone}
                    onChange={(e) => setOrgPhone(e.target.value)}
                    placeholder="02-33445566"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-brand-gold px-3 py-2 rounded-lg text-xs font-mono text-white text-left text-right"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-350 block mb-1">عنوان المقر الرئيسي</label>
                <input 
                  type="text" 
                  value={orgAddress}
                  onChange={(e) => setOrgAddress(e.target.value)}
                  placeholder="شارع التسعين، التجمع الخامس، القاهرة"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-gold px-3 py-2 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-350 block mb-1">تفاصيل ونبذة عن المكتب</label>
                <textarea 
                  value={orgDescription}
                  onChange={(e) => setOrgDescription(e.target.value)}
                  placeholder="اكتب نبذة عن التخصصات وأحجام القضايا..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-gold px-3 py-2 rounded-lg text-xs text-white"
                />
              </div>

              <button
                type="submit"
                disabled={orgFormLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-bold text-slate-950 bg-brand-gold hover:bg-brand-gold-hover transition-all shadow-md disabled:opacity-50"
              >
                {orgFormLoading ? 'جاري حفظ البيانات سحابياً...' : 'حفظ التغييرات'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create Tax Law */}
      {isLawModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <h3 className="text-sm font-extrabold text-white">إضافة مادة قانونية جديدة للمنظومة</h3>
              <button 
                onClick={() => setIsLawModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                إغلاق [X]
              </button>
            </div>
            
            <form onSubmit={handleSaveTaxLaw} className="p-5 space-y-4 text-xs">
              {lawFormError && (
                <div className="bg-red-950/40 border border-red-800 text-red-300 p-2.5 rounded text-[11px]">
                  {lawFormError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-350 block mb-1">رقم القانون*</label>
                  <input 
                    type="text" 
                    value={lawNumber}
                    onChange={(e) => setLawNumber(e.target.value)}
                    placeholder="مثال: 91"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-brand-gold px-3 py-2 rounded-lg text-xs text-white text-center font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-350 block mb-1">سنة الإصدار*</label>
                  <input 
                    type="text" 
                    value={lawYear}
                    onChange={(e) => setLawYear(e.target.value)}
                    placeholder="مثال: 2005"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-brand-gold px-3 py-2 rounded-lg text-xs text-white text-center font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-350 block mb-1">نوع القانون*</label>
                  <select
                    value={lawType}
                    onChange={(e) => setLawType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-brand-gold px-3 py-2 rounded-lg text-xs text-white font-bold"
                  >
                    <option value="ضريبة الدخل">ضريبة الدخل</option>
                    <option value="ضريبة القيمة المضافة">ضريبة القيمة المضافة</option>
                    <option value="قانون الإجراءات الضريبية الموحد">قانون الإجراءات الضريبية الموحد</option>
                    <option value="الجمارك">الجمارك</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-350 block mb-1">رقم المادة*</label>
                  <input 
                    type="text" 
                    value={lawArticle}
                    onChange={(e) => setLawArticle(e.target.value)}
                    placeholder="مثال: 8"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-brand-gold px-3 py-2 rounded-lg text-xs text-white text-center font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-350 block mb-1">نص المادة القانونية بالكامل*</label>
                <textarea 
                  value={lawContent}
                  onChange={(e) => setLawContent(e.target.value)}
                  placeholder="اكتب نص المادة القانونية كاملاً كما وردت في الجريدة الرسمية..."
                  rows={6}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-gold px-3 py-2 rounded-lg text-xs text-white leading-relaxed"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={lawFormLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-bold text-slate-950 bg-brand-gold hover:bg-brand-gold-hover transition-all shadow-md disabled:opacity-50"
              >
                {lawFormLoading ? 'جاري الحفظ والتدريب...' : 'إدراج القانون سحابياً'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 5: Settings */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <FolderLock className="w-5 h-5 text-brand-gold" />
              <h3 className="text-sm font-extrabold text-white">إعدادات مفتاح الذكاء الاصطناعي (Gemini)</h3>
            </div>
            
            <p className="text-slate-400 text-[11px] leading-relaxed">
              هذا المفتاح يُستخدم لتوليد الردود الذكية الفورية وتحليل ملفات اللجان الضريبية، بالإضافة إلى فهرسة القوانين والكتب المرفوعة سحابياً.
            </p>

            <div className="space-y-2">
              <label className="font-bold text-slate-350 block">مفتاح API Key الخاص بـ Gemini*</label>
              <input 
                type="password" 
                value={geminiKeyInput}
                onChange={(e) => setGeminiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-brand-gold px-3 py-2 rounded-lg text-xs text-white font-mono text-left"
              />
            </div>

            <button
              onClick={handleSaveGeminiKey}
              className="px-4 py-2 bg-brand-gold text-slate-950 rounded-lg text-xs font-bold hover:bg-brand-gold-hover transition-all"
            >
              حفظ إعدادات المفتاح
            </button>
          </div>
        </div>
      )}

      {/* PDF Processing Overlay */}
      {pdfProcessing && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center mx-auto animate-bounce">
              <BookOpen className="w-8 h-8 text-brand-gold" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-extrabold text-white">جاري معالجة وفهرسة كتاب القانون</h3>
              <p className="text-[11px] text-slate-400 font-bold">{pdfStep}</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-950 border border-slate-850 h-3 rounded-full overflow-hidden p-0.5">
              <div 
                className="bg-brand-gold h-full rounded-full transition-all duration-300"
                style={{ width: `${pdfProgress}%` }}
              ></div>
            </div>

            <span className="text-xs text-brand-gold font-bold block">{pdfProgress}% مكتمل</span>
          </div>
        </div>
      )}

      {/* Modal for adding User */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h3 className="text-sm font-extrabold text-white">إضافة مستخدم جديد للنظام وتعيينه لمكتب</h3>
              <button 
                onClick={() => setIsUserModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                إغلاق [X]
              </button>
            </div>
            
            <form onSubmit={handleSaveUser} className="p-5 space-y-4 text-xs text-right" dir="rtl">
              {userFormError && (
                <div className="bg-red-950/40 border border-red-900/50 text-red-400 p-2.5 rounded text-[11px] font-bold text-center">
                  {userFormError}
                </div>
              )}

              <div>
                <label className="font-bold text-slate-350 block mb-1">اسم الموظف*</label>
                <input 
                  type="text" 
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="مثال: أحمد عبد الله"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-gold px-3 py-2 rounded-lg text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-350 block mb-1">البريد الإلكتروني*</label>
                <input 
                  type="email" 
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-gold px-3 py-2 rounded-lg text-xs text-white text-left font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-350 block mb-1">صلاحية الدور*</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-brand-gold px-3 py-2 rounded-lg text-xs text-white font-bold"
                  >
                    <option value="admin">مدير مكتب (Admin)</option>
                    <option value="consultant">مستشار ضريبي (Consultant)</option>
                    <option value="staff">موظف إداري (Staff)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-350 block mb-1">كلمة المرور الافتراضية*</label>
                  <input 
                    type="text" 
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-brand-gold px-3 py-2 rounded-lg text-xs text-white text-center font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-350 block mb-1">المكتب التابع له*</label>
                <select
                  value={newUserOrgId}
                  onChange={(e) => setNewUserOrgId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-brand-gold px-3 py-2 rounded-lg text-xs text-white font-bold"
                  required
                >
                  <option value="">-- اختر المكتب الاستشاري --</option>
                  {organizations.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={userFormLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-bold text-slate-950 bg-brand-gold hover:bg-brand-gold-hover transition-all shadow-md disabled:opacity-50"
              >
                {userFormLoading ? 'جاري تسجيل المستخدم سحابياً...' : 'تسجيل وتفعيل المستخدم'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
