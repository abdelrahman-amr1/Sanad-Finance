'use client';

import React, { useEffect, useState } from 'react';
import { 
  Sparkles, 
  Send, 
  FileText, 
  Scale, 
  BookOpen, 
  Copy, 
  Printer, 
  Database,
  Brain,
  MessageSquare,
  ChevronLeft,
  Check,
  Briefcase
} from 'lucide-react';
import { db, TaxLaw, Client } from '@/lib/supabase';
import { geminiService } from '@/lib/gemini';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sources?: TaxLaw[];
}

export default function ConsultantPage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'drafter'>('chat');
  const [clients, setClients] = useState<Client[]>([]);

  // --- Chat State ---
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'مرحباً بك في المستشار الضريبي الرقمي لشركة Sameh Samir - A&B team. أنا هنا لمساعدتك في الإجابة على الاستفسارات المتعلقة بقوانين الضرائب المصرية (الدخل، القيمة المضافة، الإجراءات الموحدة). كيف يمكنني مساعدتك اليوم؟',
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedLaw, setSelectedLaw] = useState<TaxLaw | null>(null);

  // --- Drafter State ---
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [drafterClientName, setDrafterClientName] = useState('');
  const [drafterTaxCard, setDrafterTaxCard] = useState('');
  const [drafterFileNum, setDrafterFileNum] = useState('');
  const [drafterAuthority, setDrafterAuthority] = useState('');
  const [drafterStage, setDrafterStage] = useState('طعن');
  const [drafterSubject, setDrafterSubject] = useState('');
  const [drafterAmount, setDrafterAmount] = useState('');
  const [drafterYears, setDrafterYears] = useState('');
  const [drafterArguments, setDrafterArguments] = useState('');
  const [generatedDraft, setGeneratedDraft] = useState('');
  const [draftLoading, setDraftLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      const cls = await db.getClients();
      setClients(cls);
    };
    fetchClients();
  }, []);

  // Sync client dropdown with input fields
  const handleClientSelect = (clientId: string) => {
    if (!clientId) {
      setSelectedClient(null);
      setDrafterClientName('');
      setDrafterTaxCard('');
      setDrafterFileNum('');
      return;
    }
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setSelectedClient(client);
      setDrafterClientName(client.name);
      setDrafterTaxCard(client.tax_card_number);
      setDrafterFileNum(client.file_number);
      // Auto-fill some defaults if available
      setDrafterAuthority('مأمورية الشركات المساهمة بالقاهرة');
      setDrafterSubject('الاعتراض على تقديرات الفحص الجزافية والتحصيل الإداري بدون إخطار قانوني سليم.');
      setDrafterAmount('350000');
      setDrafterYears('2020-2022');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || chatLoading) return;

    const userText = inputMessage;
    setInputMessage('');
    
    // Add user message
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setChatLoading(true);

    try {
      const result = await geminiService.askTaxQuestion(userText);
      const assistantMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: result.answer,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        sources: result.sources
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleGenerateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drafterClientName || !drafterSubject || !drafterYears) {
      alert('يرجى ملء البيانات المطلوبة للصياغة');
      return;
    }
    setDraftLoading(true);
    setGeneratedDraft('');

    try {
      const result = await geminiService.generateDocumentDraft(
        drafterClientName,
        drafterTaxCard,
        drafterFileNum,
        drafterAuthority,
        drafterStage,
        drafterSubject,
        drafterAmount,
        drafterYears,
        drafterArguments
      );
      setGeneratedDraft(result.draft);
    } catch (err) {
      console.error(err);
    } finally {
      setDraftLoading(false);
    }
  };

  const handleCopyDraft = () => {
    if (!generatedDraft) return;
    navigator.clipboard.writeText(generatedDraft);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4 no-print">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <Brain className="w-6 h-6 text-brand-gold animate-pulse" />
            المساعد الضريبي والقانوني الذكي
          </h2>
          <p className="text-slate-500 text-xs mt-1">قاعدة معرفة RAG المدمجة بالأنظمة الضريبية المصرية وصياغة المسودات القضائية.</p>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-white p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'chat'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            الاستفسارات والبحث القانوني
          </button>
          <button
            onClick={() => setActiveTab('drafter')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'drafter'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            صياغة صحف الطعون والمذكرات
          </button>
        </div>
      </div>

      {/* Tab 1: Chat interface */}
      {activeTab === 'chat' && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
          
          {/* Chat main area (3 cols) */}
          <div className="xl:col-span-3 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm h-[calc(100vh-200px)] overflow-hidden">
            {/* Header info */}
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-150 flex justify-between items-center text-xs">
              <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-brand-gold" />
                محرك المعرفة المحدث: قوانين الضرائب 91 لسنة 2005، 67 لسنة 2016، 206 لسنة 2020.
              </span>
              <span className="text-[10px] text-slate-400 font-medium">النموذج النشط: Gemini 1.5 Flash</span>
            </div>

            {/* Message Streams */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar bg-slate-50/20">
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'} animate-in fade-in duration-200`}
                >
                  <div className={`max-w-[80%] rounded-xl p-4 shadow-sm text-xs leading-relaxed font-medium ${
                    msg.sender === 'user'
                      ? 'bg-slate-100 text-slate-800 rounded-tr-none border border-slate-200'
                      : 'bg-slate-900 text-white rounded-tl-none border border-slate-800'
                  }`}>
                    {/* Message Body */}
                    <div className="whitespace-pre-line prose prose-invert max-w-none">
                      {msg.text}
                    </div>

                    {/* Sources (if assistant reply has sources) */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-slate-800/60 space-y-2">
                        <span className="text-[10px] font-bold text-brand-gold block">
                          المواد القانونية المرجعية المستند إليها:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sources.map((source) => (
                            <button
                              key={source.id}
                              onClick={() => setSelectedLaw(source)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-brand-gold/45 text-[10px] text-slate-250 font-bold rounded transition-all"
                            >
                              <BookOpen className="w-3 h-3 text-brand-gold" />
                              ق {source.law_number} / مادة {source.article_number}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <span className="block text-[9px] opacity-60 text-left mt-2 font-light">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {/* Chat Loading bubble */}
              {chatLoading && (
                <div className="flex justify-end">
                  <div className="bg-slate-900 text-white rounded-xl rounded-tl-none p-4 border border-slate-800 shadow-sm text-xs max-w-[80%] flex items-center gap-3">
                    <div className="flex space-x-1 space-x-reverse">
                      <div className="w-2 h-2 bg-brand-gold rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-brand-gold rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-2 h-2 bg-brand-gold rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                    <span className="font-semibold text-slate-300">يقوم المستشار الرقمي بصياغة الرد القانوني...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-150 bg-white flex gap-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="اسأل المستشار: ما هي عقوبة التأخر في تقديم الإقرار الضريبي؟ أو ما هي النسبة العامة لضريبة الجدول؟"
                className="flex-1 border border-slate-200 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-brand-gold"
              />
              <button
                type="submit"
                disabled={chatLoading || !inputMessage.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                <span>إرسال</span>
                <Send className="w-3.5 h-3.5 text-brand-gold rotate-180" />
              </button>
            </form>
          </div>

          {/* Source Law Detail Viewer Sidebar (1 col) */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 h-[calc(100vh-200px)] overflow-y-auto space-y-4">
            <h3 className="text-xs font-extrabold text-slate-800 border-b border-slate-150 pb-2.5 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-brand-gold" />
              عارض نصوص ومواد القوانين
            </h3>

            {selectedLaw ? (
              <div className="space-y-3.5 animate-in slide-in-from-left-2 duration-200">
                <div className="flex justify-between items-center">
                  <span className="px-2 py-0.5 rounded bg-brand-gold/15 text-[10px] text-brand-gold font-bold border border-brand-gold/30">
                    {selectedLaw.law_type}
                  </span>
                  <button 
                    onClick={() => setSelectedLaw(null)}
                    className="text-slate-400 hover:text-slate-900 text-[10px] font-bold"
                  >
                    إغلاق [X]
                  </button>
                </div>
                
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">
                    مادة {selectedLaw.article_number}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    القانون رقم {selectedLaw.law_number} لسنة {selectedLaw.law_year}
                  </p>
                </div>

                <p className="text-xs text-slate-700 bg-slate-50 border border-slate-150 p-4 rounded-lg leading-relaxed font-semibold">
                  {selectedLaw.content}
                </p>
              </div>
            ) : (
              <div className="text-center text-slate-400 p-8 flex flex-col justify-center items-center h-[80%]">
                <BookOpen className="w-10 h-10 text-slate-200 mb-2" />
                <p className="text-[11px] font-medium leading-relaxed">
                  اضغط على أي مادة قانونية مستشهد بها في نافذة الدردشة لعرض نصها الحرفي هنا للتدقيق.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab 2: Legal document drafter */}
      {activeTab === 'drafter' && (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
          
          {/* Input Parameter Form (2 cols) */}
          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-800 border-b border-slate-150 pb-2.5 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-brand-gold" />
              مدخلات مسودة الطعن الضريبي
            </h3>

            <form onSubmit={handleGenerateDraft} className="space-y-4 text-xs">
              {/* Select from existing client */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">استيراد بيانات عميل مسجل (اختياري)</label>
                <select
                  onChange={(e) => handleClientSelect(e.target.value)}
                  className="w-full border border-slate-200 p-2 rounded-lg text-xs"
                >
                  <option value="">-- تخصيص بيانات يدوياً --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-750 block mb-1">اسم الممول/الشركة*</label>
                  <input
                    type="text"
                    value={drafterClientName}
                    onChange={(e) => setDrafterClientName(e.target.value)}
                    placeholder="اسم الشركة الموكلة"
                    className="w-full border border-slate-200 p-2 rounded"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-755 block mb-1">الرقم الضريبي</label>
                  <input
                    type="text"
                    value={drafterTaxCard}
                    onChange={(e) => setDrafterTaxCard(e.target.value)}
                    placeholder="123-456-789"
                    className="w-full border border-slate-200 p-2 rounded"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-755 block mb-1">رقم الملف المالي</label>
                  <input
                    type="text"
                    value={drafterFileNum}
                    onChange={(e) => setDrafterFileNum(e.target.value)}
                    placeholder="م/560/مجمعة"
                    className="w-full border border-slate-200 p-2 rounded"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-755 block mb-1">مأمورية الضرائب المختصة</label>
                  <input
                    type="text"
                    value={drafterAuthority}
                    onChange={(e) => setDrafterAuthority(e.target.value)}
                    placeholder="مأمورية ضرائب كبار الممولين"
                    className="w-full border border-slate-200 p-2 rounded"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-755 block mb-1">نوع المذكرة / المرحلة</label>
                  <select
                    value={drafterStage}
                    onChange={(e) => setDrafterStage(e.target.value)}
                    className="w-full border border-slate-200 p-2 rounded"
                  >
                    <option value="طعن">صحيفة طعن للجنة الطعن</option>
                    <option value="اعتراض">اعتراض على نموذج 19</option>
                    <option value="فحص">مذكرة دفاع للجنة فحص</option>
                    <option value="طلب تسوية">طلب تسوية وفض نزاعات</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-755 block mb-1">السنوات الضريبية*</label>
                  <input
                    type="text"
                    value={drafterYears}
                    onChange={(e) => setDrafterYears(e.target.value)}
                    placeholder="مثال: 2019-2022"
                    className="w-full border border-slate-200 p-2 rounded"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-755 block mb-1">المبلغ التقديري للنزاع (ج.م)</label>
                <input
                  type="number"
                  value={drafterAmount}
                  onChange={(e) => setDrafterAmount(e.target.value)}
                  placeholder="مثال: 450000"
                  className="w-full border border-slate-200 p-2 rounded"
                />
              </div>

              <div>
                <label className="font-bold text-slate-755 block mb-1">الموضوع الرئيسي محل النزاع*</label>
                <input
                  type="text"
                  value={drafterSubject}
                  onChange={(e) => setDrafterSubject(e.target.value)}
                  placeholder="تفنيد عدم احتساب المصروفات الفعلية وتطبيق نسب إهلاك جزافية"
                  className="w-full border border-slate-200 p-2 rounded"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-755 block mb-1">دفوع وأسانيد إضافية للدفاع (مبسطة)</label>
                <textarea
                  value={drafterArguments}
                  onChange={(e) => setDrafterArguments(e.target.value)}
                  placeholder="مثال: قيام المأمور الفاحص بتجاهل ميزانية الشركة المعتمدة، وتطبيق متوسط ربح أعلى من المقرر قانوناً..."
                  rows={4}
                  className="w-full border border-slate-200 p-2 rounded"
                />
              </div>

              <button
                type="submit"
                disabled={draftLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-bold text-slate-950 bg-brand-gold hover:bg-brand-gold-hover transition-all shadow-md disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-slate-950 ml-1.5" />
                {draftLoading ? 'جاري الصياغة القانونية بالـ AI...' : 'توليد مسودة الصحيفة بالذكاء الاصطناعي'}
              </button>
            </form>
          </div>

          {/* Generated Rich text preview (3 cols) */}
          <div className="xl:col-span-3 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-[calc(100vh-200px)] overflow-hidden">
            {/* Header controls */}
            <div className="p-3 bg-slate-50 border-b border-slate-150 flex justify-between items-center">
              <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-500" />
                معاينة مستند المسودة القانونية الصادر
              </span>
              {generatedDraft && (
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyDraft}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded text-[10px] font-bold text-slate-700 transition-all"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        تم نسخ المذكرة
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        نسخ المذكرة
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Draft Content container */}
            <div className="flex-1 p-6 overflow-y-auto bg-slate-100/50 custom-scrollbar font-mono leading-relaxed text-xs">
              {draftLoading && (
                <div className="h-full flex flex-col justify-center items-center text-center space-y-3">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-brand-gold rounded-full animate-spin mx-auto"></div>
                  <p className="text-slate-500 font-semibold">يقوم Gemini 1.5 Pro بتحرير صحيفة الطعن طبقاً للشروط والدفوع والمواد القانونية المصرية المناسبة...</p>
                </div>
              )}

              {generatedDraft ? (
                <div className="bg-white p-8 rounded border border-slate-200 shadow-sm whitespace-pre-line font-serif text-slate-900 max-w-[21cm] mx-auto text-sm leading-relaxed shadow-sm">
                  {generatedDraft}
                </div>
              ) : (
                !draftLoading && (
                  <div className="h-full flex flex-col justify-center items-center text-center text-slate-400 p-8">
                    <FileText className="w-12 h-12 text-slate-200 mb-2" />
                    <p className="font-semibold text-sm">لم يتم توليد أي مستند بعد.</p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-[280px]">
                      املأ استمارة البيانات على اليمين ثم اضغط على زر توليد المسودة لصياغة صحيفة الاعتراض فوراً.
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
