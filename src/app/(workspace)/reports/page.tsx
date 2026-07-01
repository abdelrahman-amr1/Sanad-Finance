'use client';

import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Printer, 
  Users, 
  Briefcase, 
  Scale, 
  Download,
  ShieldAlert,
  Edit3,
  Bookmark
} from 'lucide-react';
import { db, Client, Committee, Profile } from '@/lib/supabase';
import { Logo } from '@/components/Logo';

export default function ReportsPage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  
  // Compiler Selection States
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedCommitteeId, setSelectedCommitteeId] = useState('');
  const [reportType, setReportType] = useState('objection'); // objection | minutes | settlement
  
  // Document Content States
  const [docTitle, setDocTitle] = useState('مذكرة طعن ضريبي رسمية');
  const [docBody, setDocBody] = useState('');
  const [docSignee, setDocSignee] = useState('أ. سامح سمير - المدير العام');

  useEffect(() => {
    const user = db.getCurrentUser();
    setCurrentUser(user);
    fetchData();
  }, []);

  const fetchData = async () => {
    const cls = await db.getClients();
    setClients(cls);
    const coms = await db.getCommittees();
    setCommittees(coms);
  };

  // Compile document template whenever selections or type change
  useEffect(() => {
    if (!selectedClientId) {
      setDocBody('يرجى اختيار العميل وتحديد نوع الملف لتوليد المستند الرسمي...');
      return;
    }

    const client = clients.find(c => c.id === selectedClientId);
    const committee = committees.find(comm => comm.id === selectedCommitteeId);
    
    if (!client) return;

    const dateStr = new Date().toLocaleDateString('ar-EG');
    const taxCard = client.tax_card_number;
    const fileNum = client.file_number;
    const disputedStr = committee && committee.disputed_amount > 0 
      ? `${committee.disputed_amount.toLocaleString()} ج.م` 
      : 'غير متوفر';

    if (reportType === 'objection') {
      setDocTitle('صحيفة طعن ضريبي واعتراض رسمي');
      setDocBody(`السيد الأستاذ / رئيس لجنة الطعن الضريبي المختصة بمصلحة الضرائب المصرية
تحية طيبة وبعد،،،

مقدمه لسيادتكم / مكتب الأستاذ سامح سمير (A&B team للاستشارات القانونية والضريبية) بصفتنا وكلاء عن الممول:
- الاسم: ${client.name}
- الرقم الضريبي: ${taxCard}
- رقم ملف الممول: ${fileNum}
- جهة النزاع (المأمورية): ${committee?.tax_authority || 'مأمورية الشركات المساهمة'}

الموضوع:
الاعتراض والطعن على نموذج (19) ضرائب والتقدير الصادر بخصوص ملف الممول عن السنوات الضريبية [${committee?.tax_years || '2019-2022'}]، والبالغ قيمة النزاع فيها تقديرياً [${disputedStr}].

الدفوع والأسانيد القانونية:
1. الدفع ببطلان تقديرات المأمورية الفاحصة لمخالفتها الدفاتر والقيود الحسابية المنتظمة للممول، وقيام الفحص على التقدير الجزافي غير المستند لأوراق مادية، بالمخالفة لأحكام المادة رقم 90 من قانون الضريبة على الدخل.
2. عدم الاعتداد ببنود المصروفات الفعلية المرفوعة بمنظومة الفاتورة الإلكترونية المعتمدة للشركة، وهو ما يعد تعسفاً إدارياً وإخلالاً بحقوق دافعي الضرائب.
3. التمسك بإعادة الملف إلى لجنة الفحص المختصة لإجراء معاينة ميدانية فعلية لمقارنة النشاط الفعلي مع التقدير النظري الفحصي.

الطلبات:
نلتمس من اللجنة الموقرة قبول الطعن شكلاً لتقديمه في الموعد القانوني، وفي الموضوع بإلغاء تقديرات المأمورية وإصدار قرارها بإخضاع الممول للضريبة بناءً على دفاتره المنتظمة.

وتفضلوا بقبول وافر الاحترام،،،`);
    } else if (reportType === 'minutes') {
      setDocTitle('ملخص محضر فحص ومعاينة لجنة ضريبية');
      setDocBody(`تقرير داخلي معتمد بخصوص حضور جلسة اللجنة الضريبية
تاريخ الانعقاد: ${dateStr}
مكان الانعقاد: مقر مأمورية ضرائب [${committee?.tax_authority || 'مصلحة الضرائب المختصة'}]

أولاً: بيانات الحضور:
1. المستشار الحاضر عن المكتب: ${currentUser?.name || 'أ. سامح سمير'}
2. الفاحص المسؤول عن الملف: رئيس لجنة الفحص المختص بالمأمورية
3. الممول الموكل: شركة [${client.name}]

ثانياً: مجريات الجلسة والمناقشات:
تم الاجتماع مع رئيس لجنة الفحص وعرض المستندات المؤيدة للإقرار الضريبي عن السنوات [${committee?.tax_years || '2019-2022'}]. تمسك الفاحص بتطبيق نسبة مجمل ربح قدرها 15% على المبيعات بينما طالبنا بالنزول للنسبة المعتمدة بالدفاتر (9%) نظراً لظروف السوق.
بناءً عليه، تم تحرير محضر المناقشة وتأجيل اللجنة لتقديم شهادات إضافية بخصوص إهلاك الآلات القديمة بالمصنع.

ثالثاً: التوصية الفنية للمكتب:
يجب التنبيه على الإدارة المالية للعميل بتوفير صور شهادات إهلاك الأصول قبل نهاية الأسبوع الحالي لتقديمها في موعد التأجيل المقرر.`);
    } else {
      setDocTitle('مذكرة تسوية وفض نزاع ضريبي نهائي');
      setDocBody(`محضر تسوية نهائية للنزاع الضريبي مع مصلحة الضرائب المصرية
بموجب قرار لجنة الطعن النهائي / لجان فض المنازعات الصادر بتاريخ: ${dateStr}

أطراف التسوية:
- الطرف الأول: مصلحة الضرائب المصرية (مأمورية ضرائب ${committee?.tax_authority || 'المأمورية المختصة'})
- الطرف الثاني: الممول شركة [${client.name}] - ملف رقم: [${fileNum}]

بناءً على الاعتراض المقدم من وكيل الممول الأستاذ سامح سمير (A&B team للاستشارات) بخصوص المطالبة الضريبية البالغة [${disputedStr}]، عقدت لجنة التسوية جلساتها وانتهت إلى القرار النهائي التالي:

بنود القرار النهائي والتسوية:
1. تخفيض المطالبة الضريبية الكلية للسنوات [${committee?.tax_years || '2019-2022'}] بنسبة 65% لتصبح الضريبة المستحقة النهائية واجبة السداد [${committee && committee.disputed_amount > 0 ? (committee.disputed_amount * 0.35).toLocaleString() : '122,500'} ج.م].
2. إعفاء الممول من غرامات مقابل التأخير المنصوص عليها بالمادة 110 من قانون 91 لسنة 2005، نظراً لتعاون الممول وتقديمه الأوراق طواعية.
3. يلتزم الممول بسداد المبلغ المتفق عليه على دفعتين متساويتين خلال 60 يوماً من تاريخ التوقيع على هذا القرار.

التوصية الختامية:
يعتبر هذا القرار تسوية نهائية وشاملة ومبرئة للذمة المالية للممول عن السنوات المذكورة، ويغلق ملف النزاع إدارياً وقضائياً.`);
    }
  }, [selectedClientId, selectedCommitteeId, reportType, clients, committees, currentUser]);

  const handlePrint = () => {
    window.print();
  };

  // RBAC Lock: Staff cannot access reports compiler
  if (currentUser?.role === 'staff') {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-lg mx-auto shadow-sm space-y-4">
        <ShieldAlert className="w-16 h-16 text-red-650 mx-auto" />
        <h3 className="text-lg font-extrabold text-slate-800">صلاحيات غير كافية</h3>
        <p className="text-xs text-slate-550 leading-relaxed font-medium">
          عذراً، تقتصر صلاحيات مركز التقارير والطباعة الرسمية على المدير العام والمستشارين المعتمدين بالشركة.
          يرجى التبديل لدور **(أ. سامح سمير)** أو **(مستشار أحمد رأفت)** من محاكي الصلاحيات أسفل القائمة الجانبية لتصفح وطباعة التقارير.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Upper header */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-4 no-print">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">مركز التقارير والطباعة الذكية</h2>
          <p className="text-slate-500 text-xs mt-1">صياغة التقارير الضريبية ومذكرات الدفاع وتصديرها بتنسيق مهني يحمل هوية وشعار الشركة.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        
        {/* Document controls Form (1 col) */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-4 no-print">
          <h3 className="text-xs font-extrabold text-slate-800 border-b border-slate-150 pb-2.5 flex items-center gap-1.5">
            <Edit3 className="w-4 h-4 text-brand-gold" />
            إعداد مستند التقرير
          </h3>

          <div className="space-y-4 text-xs">
            {/* Client selection */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">الممول (العميل)*</label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full border border-slate-200 p-2 rounded-lg text-xs"
              >
                <option value="">-- اختر العميل --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Committee selection */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">ملف اللجنة المرتبط</label>
              <select
                value={selectedCommitteeId}
                onChange={(e) => setSelectedCommitteeId(e.target.value)}
                className="w-full border border-slate-200 p-2 rounded-lg text-xs"
              >
                <option value="">-- اختر ملف اللجنة --</option>
                {committees
                  .filter(comm => comm.client_id === selectedClientId)
                  .map(comm => (
                    <option key={comm.id} value={comm.id}>{comm.subject.substring(0, 30)}... ({comm.stage})</option>
                  ))
                }
              </select>
            </div>

            {/* Report Type */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">نموذج التقرير المعتمد*</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full border border-slate-200 p-2 rounded-lg text-xs font-bold"
              >
                <option value="objection">صحيفة اعتراض وطعن ضريبي</option>
                <option value="minutes">تقرير حضور جلسة لجنة</option>
                <option value="settlement">مذكرة قرار تسوية نهائي</option>
              </select>
            </div>

            {/* Custom Title */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">عنوان التقرير</label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="w-full border border-slate-200 p-2 rounded"
              />
            </div>

            {/* Signee name */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">الموقع المعتمد</label>
              <input
                type="text"
                value={docSignee}
                onChange={(e) => setDocSignee(e.target.value)}
                className="w-full border border-slate-200 p-2 rounded"
              />
            </div>

            <button
              onClick={handlePrint}
              disabled={!selectedClientId}
              className="w-full flex justify-center items-center gap-1.5 py-2.5 px-4 rounded-lg text-sm font-bold text-slate-950 bg-brand-gold hover:bg-brand-gold-hover transition-all shadow-md disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              طباعة التقرير الرسمي
            </button>
          </div>
        </div>

        {/* Printable Document Preview Container (3 cols) */}
        <div className="xl:col-span-3 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          
          <div className="p-3 bg-slate-50 border-b border-slate-150 flex justify-between items-center no-print">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Bookmark className="w-4 h-4 text-brand-gold" />
              معاينة ما قبل الطباعة الورقية (A4)
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">محدد التنسيق: خط أميري عربي رسمي</span>
          </div>

          {/* Paper View */}
          <div className="flex-1 p-6 overflow-y-auto bg-slate-100/35 custom-scrollbar min-h-[500px]">
            
            {/* The printable card container */}
            <div className="bg-white p-12 rounded border border-slate-250 shadow-md max-w-[21cm] mx-auto text-sm print-card text-slate-900 flex flex-col justify-between min-h-[29.7cm]">
              
              {/* Report Header: Letterhead */}
              <div>
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
                  {/* Left block: Address info */}
                  <div className="text-[10px] text-slate-600 font-semibold text-right leading-relaxed">
                    <p className="font-extrabold text-slate-950 text-xs">Sameh Samir - A&B team</p>
                    <p>للاستشارات الضريبية والقانونية والمحاسبة</p>
                    <p>شارع التسعين الشمالي، التجمع الخامس، القاهرة</p>
                    <p>هاتف: 02-23456789 | موبايل: 01009876543</p>
                    <p>بريد: contact@abteam-consulting.com</p>
                  </div>
                  
                  {/* Center: Egyptian Flag Styled Shield Logo */}
                  <div className="flex flex-col items-center">
                    <Logo showText={false} className="scale-100" />
                    <span className="text-[10px] font-extrabold text-slate-800 mt-1.5">شعار مستند معتمد</span>
                  </div>
                </div>

                {/* Document Title */}
                <div className="text-center my-6">
                  <h1 className="text-lg font-black text-slate-900 border-double border-b-4 border-slate-850 inline-block px-6 pb-1">
                    {docTitle}
                  </h1>
                </div>

                {/* Metadata Details table (client, file, etc.) */}
                {selectedClientId ? (
                  <div className="border border-slate-800 rounded mb-6 text-xs overflow-hidden">
                    <div className="grid grid-cols-2 bg-slate-50 border-b border-slate-800 font-bold text-slate-950">
                      <div className="p-2 border-l border-slate-800">بيانات الممول (العميل)</div>
                      <div className="p-2">تفاصيل النزاع واللجنة</div>
                    </div>
                    <div className="grid grid-cols-2 font-medium">
                      <div className="p-2 border-l border-slate-800 space-y-1">
                        <p><span className="font-bold">الاسم:</span> {clients.find(c => c.id === selectedClientId)?.name}</p>
                        <p><span className="font-bold">رقم الملف:</span> {clients.find(c => c.id === selectedClientId)?.file_number}</p>
                        <p><span className="font-bold">الرقم الضريبي:</span> {clients.find(c => c.id === selectedClientId)?.tax_card_number}</p>
                      </div>
                      <div className="p-2 space-y-1">
                        <p><span className="font-bold">المأمورية:</span> {committees.find(comm => comm.id === selectedCommitteeId)?.tax_authority || 'غير محدد'}</p>
                        <p><span className="font-bold">السنوات المعنية:</span> {committees.find(comm => comm.id === selectedCommitteeId)?.tax_years || 'غير محدد'}</p>
                        <p><span className="font-bold">قيمة النزاع:</span> {committees.find(comm => comm.id === selectedCommitteeId)?.disputed_amount.toLocaleString() || '0'} ج.م</p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Edit container (shows textarea in edit, text in print) */}
                <div className="no-print mb-4 border border-brand-gold/40 rounded-lg p-3 bg-brand-gold/5 flex gap-2 items-start">
                  <Edit3 className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
                  <div className="text-[10px] text-slate-600">
                    <p className="font-bold text-slate-800 mb-0.5">محرر التقرير المباشر:</p>
                    <p>تستطيع التعديل والإضافة يدوياً على محتوى التقرير الظاهر بالأسفل من خلال صندوق النصوص المتاح بالداخل، وسينعكس التعديل فوراً على النسخة المطبوعة.</p>
                  </div>
                </div>

                <div className="mb-8 font-serif leading-relaxed text-slate-900 text-sm whitespace-pre-line text-justify no-print">
                  <textarea
                    value={docBody}
                    onChange={(e) => setDocBody(e.target.value)}
                    rows={12}
                    className="w-full font-serif text-sm p-4 border border-slate-200 rounded focus:outline-none focus:border-brand-gold bg-slate-50/50"
                  />
                </div>

                {/* Print-only static text (will show in print and hide textarea) */}
                <div className="hidden print:block font-serif leading-relaxed text-slate-900 text-sm whitespace-pre-line text-justify mb-8 px-2">
                  {docBody}
                </div>
              </div>

              {/* Report Footer: Signatures and stamp */}
              <div className="border-t border-slate-300 pt-6 mt-8">
                <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                  <div className="text-right">
                    <p>مقدمه لسيادتكم،</p>
                    <p className="mt-1 text-slate-700">{docSignee}</p>
                    <p className="mt-8 text-slate-400 font-light text-[10px]">التوقيع: ............................</p>
                  </div>
                  
                  <div className="text-left flex flex-col items-center">
                    <p>خاتم المكتب الرسمي</p>
                    {/* Stamp Placeholder */}
                    <div className="w-20 h-20 rounded-full border-4 border-dashed border-brand-gold/40 flex items-center justify-center text-center text-[9px] text-brand-gold/60 font-black mt-2 rotate-12 select-none">
                      Sameh Samir
                      <br />
                      A&B Team
                    </div>
                  </div>
                </div>
                
                <p className="text-[8px] text-slate-400 text-center mt-8 border-t border-slate-100 pt-2 no-print">
                  * هذا المستند صادر إلكترونياً ويخضع للتنظيم الداخلي للشركة.
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
