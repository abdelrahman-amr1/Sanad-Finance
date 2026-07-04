'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Sparkles, 
  FileText, 
  Upload, 
  ChevronRight, 
  Check, 
  ShieldAlert,
  FolderOpen,
  Send,
  Gavel,
  ArrowLeftRight
} from 'lucide-react';
import { db, Client, Committee, Profile } from '@/lib/supabase';
import { geminiService, AnalysisResponse } from '@/lib/gemini';

export default function CommitteesPage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null);
  
  // Search and Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  
  // AI Analysis State
  const [aiAnalysis, setAiAnalysis] = useState<AnalysisResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // New Committee Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientId, setClientId] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientTaxCard, setNewClientTaxCard] = useState('');
  const [newClientFileNum, setNewClientFileNum] = useState('');
  const [newClientMobile, setNewClientMobile] = useState('');
  const [isAddingNewClient, setIsAddingNewClient] = useState(false);

  const [subject, setSubject] = useState('');
  const [taxAuthority, setTaxAuthority] = useState('');
  const [disputedAmount, setDisputedAmount] = useState('');
  const [taxYears, setTaxYears] = useState('');
  const [hearingDate, setHearingDate] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [stage, setStage] = useState<'معاينة' | 'فحص' | 'طعن' | 'قرار نهائي'>('معاينة');

  // File Upload State
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, date: string}[]>([]);

  useEffect(() => {
    setCurrentUser(db.getCurrentUser());
    fetchData();
  }, []);

  const fetchData = async () => {
    const [coms, cls] = await Promise.all([
      db.getCommittees(),
      db.getClients()
    ]);
    setCommittees(coms);
    if (coms.length > 0 && !selectedCommittee) {
      setSelectedCommittee(coms[0]);
    }
    setClients(cls);
  };

  useEffect(() => {
    // Reset AI analysis card when changing committees
    setAiAnalysis(null);
    setUploadedFiles([
      { name: 'محضر فحص ضريبي معتمد.pdf', date: '2026-06-15' },
      { name: 'قرار لجنة الطعن السابق.pdf', date: '2026-06-20' }
    ]);
  }, [selectedCommittee]);

  const handleUpdateStage = async (newStage: Committee['stage']) => {
    if (!selectedCommittee) return;
    
    // RBAC Check
    if (currentUser?.role === 'staff') {
      alert('عذراً، لا تمتلك صلاحية تعديل مراحل الملفات. هذه الصلاحية للمدراء والمستشارين فقط.');
      return;
    }

    try {
      const updated = await db.updateCommittee(selectedCommittee.id, { stage: newStage });
      // Update local state
      setCommittees(prev => prev.map(c => c.id === selectedCommittee.id ? { ...c, stage: newStage } : c));
      setSelectedCommittee(prev => prev ? { ...prev, stage: newStage } : null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunAIAnalysis = async () => {
    if (!selectedCommittee) return;
    setAiLoading(true);
    try {
      const result = await geminiService.analyzeCommittee(selectedCommittee);
      setAiAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !taxAuthority || !taxYears) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    let activeClientId = clientId;

    // If user opts to add a new client on the fly
    if (isAddingNewClient) {
      if (!newClientName || !newClientTaxCard || !newClientFileNum) {
        alert('يرجى ملء بيانات العميل الجديد المطلوبة');
        return;
      }
      const newClient = await db.addClient({
        name: newClientName,
        tax_card_number: newClientTaxCard,
        file_number: newClientFileNum,
        mobile: newClientMobile,
        email: '',
        address: ''
      });
      activeClientId = newClient.id;
    }

    if (!activeClientId) {
      alert('يرجى اختيار عميل أو إضافة عميل جديد');
      return;
    }

    const comData = {
      client_id: activeClientId,
      stage,
      subject,
      tax_authority: taxAuthority,
      disputed_amount: Number(disputedAmount) || 0.0,
      tax_years: taxYears,
      hearing_date: hearingDate || undefined,
      room_number: roomNumber || undefined,
      notes: notes || undefined
    };

    const newComm = await db.addCommittee(comData);
    
    // Refresh lists
    await fetchData();
    setSelectedCommittee(newComm);
    setIsModalOpen(false);

    // Reset fields
    setSubject('');
    setTaxAuthority('');
    setDisputedAmount('');
    setTaxYears('');
    setHearingDate('');
    setRoomNumber('');
    setNotes('');
    setStage('معاينة');
    setIsAddingNewClient(false);
    setNewClientName('');
    setNewClientTaxCard('');
    setNewClientFileNum('');
    setNewClientMobile('');
  };

  const handleSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedCommittee) {
      const newFile = {
        name: file.name,
        date: new Date().toISOString().split('T')[0]
      };
      setUploadedFiles(prev => [newFile, ...prev]);
      db.addAuditLog('إرفاق ملف ضريبي للجنة', `تم إرفاق مستند "${file.name}" باللجنة الخاصة بالعميل: ${selectedCommittee.client_name}`);
    }
  };

  const stagesList: Committee['stage'][] = ['معاينة', 'فحص', 'طعن', 'قرار نهائي'];

  // Filtered committees list
  const filteredCommittees = committees.filter(c => {
    const matchesSearch = 
      (c.client_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tax_authority.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = stageFilter === 'all' ? true : c.stage === stageFilter;
    
    return matchesSearch && matchesStage;
  });

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 no-print">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">لجان الفحص والطعن</h2>
          <p className="text-slate-500 text-xs mt-1">تتبع دورة حياة الملفات وتدقيق أوراق اللجان والطعون الضريبية وتوليد التحليلات الفورية.</p>
        </div>
        {currentUser?.role !== 'staff' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-navy text-white rounded-lg text-xs font-bold hover:bg-brand-navy-light transition-all shadow-md"
          >
            <Plus className="w-4 h-4 text-brand-gold" />
            إضافة ملف لجنة جديد
          </button>
        )}
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Sidebar Search & List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-180px)] overflow-hidden no-print">
          {/* Filters */}
          <div className="p-4 border-b border-slate-150 space-y-3 bg-slate-50/50">
            <div className="relative">
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث باسم العميل أو المأمورية..."
                className="w-full pr-9 pl-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs placeholder-slate-450 focus:outline-none focus:border-brand-gold transition-all"
              />
            </div>
            
            {/* Stage filter pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setStageFilter('all')}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                  stageFilter === 'all'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-505 border-slate-200 hover:bg-slate-100'
                }`}
              >
                الكل
              </button>
              {stagesList.map(st => (
                <button
                  key={st}
                  onClick={() => setStageFilter(st)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                    stageFilter === st
                      ? 'bg-brand-gold text-slate-950 border-brand-gold'
                      : 'bg-white text-slate-505 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredCommittees.map(comm => {
              const isSelected = selectedCommittee?.id === comm.id;
              return (
                <button
                  key={comm.id}
                  onClick={() => setSelectedCommittee(comm)}
                  className={`w-full text-right p-4 transition-all flex items-start justify-between border-r-4 ${
                    isSelected 
                      ? 'bg-slate-55 border-brand-gold' 
                      : 'border-transparent hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-1">
                    <h4 className="font-extrabold text-slate-900 text-xs truncate">{comm.client_name}</h4>
                    <p className="text-[10px] text-slate-450 mt-1 truncate">{comm.subject}</p>
                    <div className="flex items-center gap-3 mt-2 text-[9px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {comm.tax_authority.split(' ').slice(-2).join(' ')}
                      </span>
                      {comm.hearing_date && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(comm.hearing_date).toLocaleDateString('ar-EG')}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                    comm.stage === 'معاينة' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    comm.stage === 'فحص' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    comm.stage === 'طعن' ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {comm.stage}
                  </span>
                </button>
              );
            })}
            {filteredCommittees.length === 0 && (
              <div className="p-8 text-center text-slate-400 font-medium text-xs">
                <FolderOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                لم نجد أي لجان مطابقة للبحث.
              </div>
            )}
          </div>
        </div>

        {/* Column 2 & 3: Detailed view */}
        <div className="lg:col-span-2 h-[calc(100vh-180px)] flex flex-col gap-6 overflow-y-auto pr-1">
          {selectedCommittee ? (
            <>
              {/* Stepper Card */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-brand-gold uppercase tracking-wider">
                    مراحل دورة حياة ملف الاعتراض
                  </span>
                  {currentUser?.role === 'staff' && (
                    <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      عرض فقط (إداري)
                    </span>
                  )}
                </div>
                
                {/* Visual Stepper */}
                <div className="relative flex items-center justify-between w-full mt-4">
                  {/* Background connect line */}
                  <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-slate-100 -translate-y-1/2 z-0" />
                  
                  {stagesList.map((st, idx) => {
                    const currentIdx = stagesList.indexOf(selectedCommittee.stage);
                    const isCompleted = idx < currentIdx;
                    const isActive = idx === currentIdx;
                    
                    return (
                      <button
                        key={st}
                        disabled={currentUser?.role === 'staff'}
                        onClick={() => handleUpdateStage(st)}
                        className={`relative z-10 flex flex-col items-center group focus:outline-none ${
                          currentUser?.role !== 'staff' ? 'cursor-pointer' : 'cursor-default'
                        }`}
                      >
                        {/* Circle badge */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                          isCompleted
                            ? 'bg-slate-900 border-slate-900 text-white'
                            : isActive
                              ? 'bg-brand-gold border-brand-gold text-slate-950 shadow-md font-bold scale-110'
                              : 'bg-white border-slate-200 text-slate-400 group-hover:border-slate-350'
                        }`}>
                          {isCompleted ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </div>
                        {/* Label */}
                        <span className={`text-[10px] font-bold mt-2 transition-colors ${
                          isActive 
                            ? 'text-slate-950 font-black' 
                            : 'text-slate-450 group-hover:text-slate-600'
                        }`}>
                          {st}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Committee Information Box */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-start border-b border-slate-150 pb-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{selectedCommittee.client_name}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">{selectedCommittee.subject}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-slate-400 font-bold">المبلغ المتنازع عليه</p>
                    <p className="text-lg font-black text-slate-800">
                      {selectedCommittee.disputed_amount > 0 
                        ? `${selectedCommittee.disputed_amount.toLocaleString()} ج.م` 
                        : 'معاينة إثبات حالة'}
                    </p>
                  </div>
                </div>

                {/* Metadata Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-slate-400 font-bold block mb-1">الجهة الضريبية (المأمورية)</span>
                    <span className="font-extrabold text-slate-800">{selectedCommittee.tax_authority}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-slate-400 font-bold block mb-1">السنوات الضريبية المعنية</span>
                    <span className="font-extrabold text-slate-800">{selectedCommittee.tax_years}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-slate-400 font-bold block mb-1">تاريخ الجلسة / قاعة اللجنة</span>
                    <span className="font-extrabold text-slate-850">
                      {selectedCommittee.hearing_date 
                        ? `${new Date(selectedCommittee.hearing_date).toLocaleDateString('ar-EG')} - قاعة ${selectedCommittee.room_number || 'غير محددة'}` 
                        : 'غير مجدولة بعد'}
                    </span>
                  </div>
                </div>

                {/* notes */}
                {selectedCommittee.notes && (
                  <div className="space-y-1.5">
                    <span className="text-slate-400 font-bold text-xs block">ملاحظات ودفوع المكتب الحالية:</span>
                    <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-150 leading-relaxed font-medium">
                      {selectedCommittee.notes}
                    </p>
                  </div>
                )}

                {/* Files Attachment section */}
                <div className="border-t border-slate-150 pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-slate-500" />
                      المستندات المرفقة للملف ({uploadedFiles.length})
                    </span>
                    <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 hover:bg-slate-200/80 rounded-lg text-[10px] font-bold text-slate-700 transition-all">
                      <Upload className="w-3.5 h-3.5" />
                      إرفاق مستند جديد
                      <input 
                        type="file" 
                        accept=".pdf" 
                        onChange={handleSimulatedUpload}
                        className="hidden" 
                      />
                    </label>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2">
                    {uploadedFiles.map((file, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-150 rounded-lg text-xs hover:border-slate-300 transition-colors">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                          <span className="font-semibold text-slate-700 truncate">{file.name}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 shrink-0 font-medium">{file.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Consultant Summary and Analysis Section */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-brand-gold" />
                    <h3 className="text-sm font-extrabold text-slate-900">مستشار لجان الفحص والطعن الرقمي (Gemini AI)</h3>
                  </div>
                  {!aiAnalysis && (
                    <button
                      onClick={handleRunAIAnalysis}
                      disabled={aiLoading}
                      className="flex items-center gap-1.5 px-4 py-2 bg-brand-gold hover:bg-brand-gold-hover text-slate-950 rounded-lg text-xs font-bold transition-all shadow-md disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {aiLoading ? 'جاري الفحص القانوني...' : 'تحليل وتوصيات الملف'}
                    </button>
                  )}
                </div>

                {aiLoading && (
                  <div className="p-8 text-center space-y-3">
                    <div className="w-8 h-8 border-4 border-slate-100 border-t-brand-gold rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs text-slate-550 font-medium">يقوم Gemini الآن بقراءة ملف اللجنة ومقارنة الدفوع بأحدث القوانين الضريبية المصرية...</p>
                  </div>
                )}

                {aiAnalysis && (
                  <div className="space-y-4 border-t border-slate-150 pt-4 animate-in fade-in duration-300">
                    {/* Executive Summary */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-500 mb-1">الخلاصة التنفيذية للملف:</h4>
                      <p className="text-xs text-slate-800 leading-relaxed font-medium bg-indigo-50/30 p-3 rounded-lg border border-indigo-100/50">
                        {aiAnalysis.summary}
                      </p>
                    </div>

                    {/* Risks & Recommendations Grid */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Risks Card */}
                      <div className="bg-red-50/30 border border-red-100 p-4 rounded-lg space-y-2">
                        <h5 className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-red-700" />
                          المخاطر الضريبية الأساسية:
                        </h5>
                        <ul className="list-disc list-inside text-xs text-slate-700 space-y-1.5 pr-2 font-medium">
                          {aiAnalysis.risks.map((risk, index) => (
                            <li key={index}>{risk}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Recommendations Card */}
                      <div className="bg-emerald-50/30 border border-emerald-100 p-4 rounded-lg space-y-2">
                        <h5 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-emerald-700" />
                          توصيات الدفاع وخطة التحرك:
                        </h5>
                        <ul className="list-decimal list-inside text-xs text-slate-700 space-y-1.5 pr-2 font-medium">
                          {aiAnalysis.recommendations.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Simulation alert */}
                    {aiAnalysis.isSimulated && (
                      <p className="text-[10px] text-amber-600 bg-amber-50 px-3 py-1 rounded text-center">
                        *مستند مخرجات محاكاة. لتفعيل الاستشارة الذكية الحية، يرجى إدخال مفتاح GEMINI_API_KEY.*
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white p-12 text-center border border-slate-200 rounded-xl shadow-sm text-slate-400 flex flex-col justify-center items-center h-full">
              <FolderOpen className="w-12 h-12 text-slate-300 mb-2" />
              <p className="font-semibold text-sm">يرجى اختيار لجنة من القائمة لعرض تفاصيل الملف ودورة حياته.</p>
            </div>
          )}
        </div>

      </div>

      {/* Modal for adding New Committee */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-150 flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-slate-900">إضافة ملف لجنة اعتراض/فحص جديد</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 text-xs font-bold"
              >
                إغلاق [X]
              </button>
            </div>
            
            <form onSubmit={handleCreateCommittee} className="p-6 space-y-5">
              {/* Client selection on the fly */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-700">الممول (العميل)*</label>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewClient(!isAddingNewClient)}
                    className="text-brand-gold hover:underline font-bold"
                  >
                    {isAddingNewClient ? 'اختر عميل مسجل' : 'إضافة ممول جديد غير مسجل'}
                  </button>
                </div>
                
                {isAddingNewClient ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <div>
                      <label className="font-semibold block mb-1">اسم الممول الجديد*</label>
                      <input 
                        type="text" 
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="مثل: شركة الهدى للصناعة"
                        className="w-full border border-slate-200 p-2 rounded bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">الرقم الضريبي*</label>
                      <input 
                        type="text" 
                        value={newClientTaxCard}
                        onChange={(e) => setNewClientTaxCard(e.target.value)}
                        placeholder="123-456-789"
                        className="w-full border border-slate-200 p-2 rounded bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">رقم ملف الممول*</label>
                      <input 
                        type="text" 
                        value={newClientFileNum}
                        onChange={(e) => setNewClientFileNum(e.target.value)}
                        placeholder="م/560/دخل"
                        className="w-full border border-slate-200 p-2 rounded bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1">رقم الموبايل</label>
                      <input 
                        type="text" 
                        value={newClientMobile}
                        onChange={(e) => setNewClientMobile(e.target.value)}
                        placeholder="010XXXXXXXX"
                        className="w-full border border-slate-200 p-2 rounded bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full border border-slate-200 p-2 rounded-lg text-xs focus:outline-none focus:border-brand-gold"
                  >
                    <option value="">-- اختر العميل --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} (ملف: {c.file_number})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Committee specific attributes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">موضوع الاعتراض واللجنة*</label>
                  <input 
                    type="text" 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="طعن على ضريبة المرتبات جزافياً"
                    className="w-full border border-slate-200 p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">مأمورية الضرائب المختصة*</label>
                  <input 
                    type="text" 
                    value={taxAuthority}
                    onChange={(e) => setTaxAuthority(e.target.value)}
                    placeholder="مأمورية ضرائب كبار الممولين"
                    className="w-full border border-slate-200 p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">المبلغ المتنازع عليه (ج.م)</label>
                  <input 
                    type="number" 
                    value={disputedAmount}
                    onChange={(e) => setDisputedAmount(e.target.value)}
                    placeholder="مثل: 250000"
                    className="w-full border border-slate-200 p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">السنوات الضريبية محل النزاع*</label>
                  <input 
                    type="text" 
                    value={taxYears}
                    onChange={(e) => setTaxYears(e.target.value)}
                    placeholder="مثل: 2019-2022"
                    className="w-full border border-slate-200 p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">مرحلة دورة الملف*</label>
                  <select 
                    value={stage}
                    onChange={(e: any) => setStage(e.target.value)}
                    className="w-full border border-slate-200 p-2 rounded-lg"
                  >
                    <option value="معاينة">معاينة</option>
                    <option value="فحص">فحص</option>
                    <option value="طعن">طعن</option>
                    <option value="قرار نهائي">قرار نهائي</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">تاريخ الجلسة</label>
                    <input 
                      type="date" 
                      value={hearingDate}
                      onChange={(e) => setHearingDate(e.target.value)}
                      className="w-full border border-slate-200 p-2 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">قاعة اللجنة</label>
                    <input 
                      type="text" 
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder="قاعة 2 أ"
                      className="w-full border border-slate-200 p-2 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-slate-700">ملاحظات إضافية وتفاصيل الفحص</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="اكتب تفاصيل النزاع والدفوع المبدئية التي تم الاتفاق عليها مع الفاحص..."
                  rows={3}
                  className="w-full border border-slate-200 p-2 rounded-lg"
                />
              </div>

              <button
                type="submit"
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-bold text-slate-950 bg-brand-gold hover:bg-brand-gold-hover transition-all shadow-md"
              >
                تأسيس ملف اللجنة وحفظه
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
