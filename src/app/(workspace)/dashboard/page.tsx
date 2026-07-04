'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Scale, 
  CheckSquare, 
  Coins, 
  AlertCircle, 
  Calendar, 
  Clock, 
  ArrowUpRight,
  TrendingDown,
  UserCheck
} from 'lucide-react';
import { db, Client, Committee, Task, AuditLog, Profile } from '@/lib/supabase';

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [clientsCount, setClientsCount] = useState(0);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [totalDisputed, setTotalDisputed] = useState(0);
  const [urgentCommittees, setUrgentCommittees] = useState<Committee[]>([]);

  useEffect(() => {
    // 1. Fetch current profile
    const user = db.getCurrentUser();
    setCurrentUser(user);

    // 2. Fetch data from DB
    const fetchData = async () => {
      const [allClients, allCommittees, allTasks, logs] = await Promise.all([
        db.getClients(),
        db.getCommittees(),
        db.getTasks(),
        db.getAuditLogs()
      ]);

      setClientsCount(allClients.length);
      setCommittees(allCommittees);
      setTasks(allTasks);
      setAuditLogs(logs);

      // Sum disputed amounts for non-resolved committees
      const disputedSum = allCommittees
        .filter(c => c.status !== 'resolved')
        .reduce((sum, c) => sum + (Number(c.disputed_amount) || 0), 0);
      setTotalDisputed(disputedSum);

      // Filter urgent committees (hearings in next 3 days)
      const now = new Date();
      const threeDaysLater = new Date(Date.now() + 3 * 24 * 3600 * 1000);
      const urgent = allCommittees.filter(c => {
        if (!c.hearing_date || c.status === 'resolved') return false;
        const hDate = new Date(c.hearing_date);
        return hDate >= now && hDate <= threeDaysLater;
      });
      setUrgentCommittees(urgent);
    };

    fetchData();
  }, []);

  if (!currentUser) return null;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(amount);
  };

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getStageBadgeColor = (stage: Committee['stage']) => {
    switch (stage) {
      case 'معاينة': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'فحص': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'طعن': return 'bg-red-50 text-red-700 border-red-200';
      case 'قرار نهائي': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">نظرة عامة على المكتب</h2>
          <p className="text-slate-500 text-xs mt-1">عرض فوري لحالة المكاتب، والمهام المعلقة، والمواعيد القانونية القريبة.</p>
        </div>
        <div className="text-xs text-slate-400 font-semibold bg-white px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          تحديث تلقائي: {new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Urgent Alerts Widget */}
      {urgentCommittees.length > 0 && (
        <div className="bg-red-50 border-r-4 border-egypt-red p-4 rounded-l-lg shadow-sm no-print space-y-2">
          <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
            <AlertCircle className="w-5 h-5 text-egypt-red animate-bounce" />
            <span>تنبيه لجان قانونية عاجلة (خلال 72 ساعة القادمة)</span>
          </div>
          <div className="grid md:grid-cols-2 gap-3 mt-1">
            {urgentCommittees.map(comm => (
              <div key={comm.id} className="bg-white/80 p-3 rounded-lg border border-red-100 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-slate-900">{comm.client_name}</p>
                  <p className="text-slate-500 text-[10px] mt-0.5">{comm.subject}</p>
                  <p className="text-red-700 font-medium mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    الموعد: {formatDate(comm.hearing_date)} (قاعة {comm.room_number || 'غير محددة'})
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStageBadgeColor(comm.stage)}`}>
                  {comm.stage}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: Active Clients */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover-gold-glow">
          <div>
            <span className="text-slate-400 font-bold text-xs">الملفات والعملاء</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{clientsCount}</h3>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-1.5">
              <span>+1 عميل جديد هذا الأسبوع</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Users className="w-6 h-6 text-slate-700" />
          </div>
        </div>

        {/* KPI 2: Active Committees */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover-gold-glow">
          <div>
            <span className="text-slate-400 font-bold text-xs">اللجان النشطة</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {committees.filter(c => c.status !== 'resolved').length}
            </h3>
            <span className="text-[10px] text-brand-gold font-semibold flex items-center gap-0.5 mt-1.5">
              <span>جاري المتابعة إدارياً</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Scale className="w-6 h-6 text-slate-700" />
          </div>
        </div>

        {/* KPI 3: Pending Tasks */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover-gold-glow">
          <div>
            <span className="text-slate-400 font-bold text-xs">المهام المعلقة</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {tasks.filter(t => t.status !== 'completed').length}
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-0.5 mt-1.5">
              <span>مسندة للمستشارين والموظفين</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <CheckSquare className="w-6 h-6 text-slate-700" />
          </div>
        </div>

        {/* KPI 4: Disputed Amount */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover-gold-glow">
          <div>
            <span className="text-slate-400 font-bold text-xs">مبالغ النزاع النشط</span>
            <h3 className="text-xl font-black text-slate-850 mt-1 truncate max-w-[170px]">
              {formatCurrency(totalDisputed)}
            </h3>
            <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-0.5 mt-1.5">
              <span>القيمة التقديرية للطعون الجارية</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Coins className="w-6 h-6 text-slate-700" />
          </div>
        </div>

      </div>

      {/* Main Grid: Upcoming Hearings + Audit Trail */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Side: Upcoming hearings (Takes 2 cols on big screens) */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-150 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-gold" />
              جدول جلسات اللجان القادمة
            </h3>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded">
              إجمالي الجلسات المخططة: {committees.filter(c => c.status === 'pending' && c.hearing_date).length}
            </span>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150">
                <tr>
                  <th className="p-4">العميل</th>
                  <th className="p-4">المرحلة</th>
                  <th className="p-4">تاريخ الجلسة</th>
                  <th className="p-4">القاعة/العنوان</th>
                  <th className="p-4">المبلغ</th>
                  <th className="p-4">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-slate-700">
                {committees.filter(c => c.status !== 'resolved').slice(0, 5).map(comm => (
                  <tr key={comm.id} className="hover:bg-slate-50/55 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{comm.client_name}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStageBadgeColor(comm.stage)}`}>
                        {comm.stage}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 font-medium">
                      {comm.hearing_date ? new Date(comm.hearing_date).toLocaleDateString('ar-EG') : 'غير محدد'}
                    </td>
                    <td className="p-4 text-slate-500 max-w-[150px] truncate" title={comm.room_number || comm.tax_authority}>
                      {comm.room_number || comm.tax_authority}
                    </td>
                    <td className="p-4 font-semibold">{formatCurrency(comm.disputed_amount)}</td>
                    <td className="p-4">
                      <span className={`inline-block w-2 h-2 rounded-full ${comm.status === 'pending' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                      <span className="mr-1.5">{comm.status === 'pending' ? 'بانتظار الجلسة' : 'قيد المتابعة'}</span>
                    </td>
                  </tr>
                ))}
                {committees.filter(c => c.status !== 'resolved').length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                      لا يوجد لجان نشطة أو جلسات قادمة مجدولة حالياً.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Audit Trail (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-150 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-brand-gold" />
              سجل العمليات الأخير (Audit Trail)
            </h3>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>

          <div className="p-4 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar space-y-4">
            {auditLogs.slice(0, 10).map((log) => (
              <div key={log.id} className="text-xs border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-slate-850">{log.user_name}</span>
                  <span className="text-[10px] text-slate-450">
                    {new Date(log.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex gap-1.5 items-center mt-1 text-[11px]">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-500 font-semibold border border-slate-200">
                    {log.user_role === 'admin' ? 'مدير' : log.user_role === 'consultant' ? 'مستشار' : 'إداري'}
                  </span>
                  <span className="text-slate-800 font-medium">{log.action}</span>
                </div>
                {log.details && (
                  <p className="text-[10px] text-slate-400 mt-1.5 bg-slate-50 p-1.5 rounded border border-slate-100">
                    {log.details}
                  </p>
                )}
              </div>
            ))}
            {auditLogs.length === 0 && (
              <p className="text-center text-slate-450 p-6 text-xs">لا يوجد عمليات مسجلة حالياً.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
