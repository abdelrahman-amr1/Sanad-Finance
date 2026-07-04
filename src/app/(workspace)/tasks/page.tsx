'use client';

import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  CheckSquare, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft, 
  User, 
  Clock, 
  Briefcase,
  Trash2,
  Check
} from 'lucide-react';
import { db, Task, Committee, Profile } from '@/lib/supabase';
import confetti from 'canvas-confetti';

export default function TasksPage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  // Calendar Navigation (Initial State: July 2026 based on Current Time context)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // 0-indexed, so 6 = July
  const [selectedDay, setSelectedDay] = useState<number | null>(1); // July 1st selected by default

  // New Task Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('2026-07-01');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [committeeId, setCommitteeId] = useState('');

  // Task list filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

  useEffect(() => {
    setCurrentUser(db.getCurrentUser());
    fetchData();
  }, []);

  const fetchData = async () => {
    const [allTasks, allCommittees] = await Promise.all([
      db.getTasks(),
      db.getCommittees()
    ]);
    setTasks(allTasks);
    setCommittees(allCommittees);

    const users = db.getProfiles();
    setProfiles(users);
    if (users.length > 0 && !assignedTo) {
      setAssignedTo(users[0].id);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate || !assignedTo) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const taskData = {
      title,
      description: description || undefined,
      due_date: new Date(dueDate).toISOString(),
      priority,
      assigned_to: assignedTo,
      committee_id: committeeId || undefined
    };

    await db.addTask(taskData);
    await fetchData();
    setIsModalOpen(false);

    // Reset Form
    setTitle('');
    setDescription('');
    setDueDate('2026-07-01');
    setPriority('medium');
    setCommitteeId('');
  };

  const handleToggleTaskStatus = async (id: string, currentStatus: Task['status']) => {
    let newStatus: Task['status'] = 'completed';
    if (currentStatus === 'completed') newStatus = 'pending';
    else if (currentStatus === 'pending') newStatus = 'in_progress';
    else newStatus = 'completed';

    try {
      await db.updateTask(id, { status: newStatus });
      
      // Celebrate completion
      if (newStatus === 'completed') {
        confetti({
          particleCount: 60,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#CE1126', '#C5A880', '#0F172A']
        });
      }

      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذه المهمة؟')) {
      await db.deleteTask(id);
      await fetchData();
    }
  };

  // --- Calendar Math Helpers ---
  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    // Adjusting for RTL/Arabic starts (Saturday/Sunday)
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
    setSelectedDay(null);
  };

  // Check if a day has items
  const getDayItems = (day: number) => {
    const checkDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const dayTasks = tasks.filter(t => {
      const d = t.due_date.split('T')[0];
      return d === checkDateStr;
    });

    const dayCommittees = committees.filter(c => {
      if (!c.hearing_date) return false;
      const d = c.hearing_date.split('T')[0];
      return d === checkDateStr;
    });

    return { dayTasks, dayCommittees };
  };

  // Filter tasks based on checklist selection
  const filteredTasksList = tasks.filter(t => {
    if (statusFilter === 'all') return true;
    return t.status === statusFilter;
  });

  // Calculate items for selected day
  const selectedDayItems = selectedDay ? getDayItems(selectedDay) : { dayTasks: [], dayCommittees: [] };

  const getPriorityColor = (pr: Task['priority']) => {
    switch (pr) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low': return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4 no-print">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">الأجندة والمهام اليومية</h2>
          <p className="text-slate-500 text-xs mt-1">تنسيق مواعيد لجان الطعن ومطابقتها بمهام الموظفين الاستشارية والإدارية.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-navy text-white rounded-lg text-xs font-bold hover:bg-brand-navy-light transition-all shadow-md"
        >
          <Plus className="w-4 h-4 text-brand-gold" />
          إسناد مهمة جديدة
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* Left: Smart Calendar Grid (2 cols) */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 no-print">
          <div className="flex justify-between items-center pb-2 border-b border-slate-150">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-brand-gold" />
              أجندة لجان ومهام {monthNames[currentMonth]} {currentYear}
            </h3>
            
            <div className="flex items-center gap-1">
              <button onClick={prevMonth} className="p-1 rounded hover:bg-slate-100 transition-colors">
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
              <span className="text-xs font-extrabold px-3 text-slate-700">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <button onClick={nextMonth} className="p-1 rounded hover:bg-slate-100 transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
            {/* Days header */}
            {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(day => (
              <div key={day} className="font-extrabold text-slate-400 py-2 border-b border-slate-100">
                {day}
              </div>
            ))}

            {/* Empty cells for starting offsets */}
            {/* Standard Gregorian starts Sunday. Adjusting for Arabic weeks: Sat to Fri */}
            {/* If firstDay is 0 (Sunday), offset is 1. If 6 (Saturday), offset is 0. */}
            {Array.from({ length: (firstDay + 1) % 7 }).map((_, idx) => (
              <div key={`offset-${idx}`} className="bg-slate-50/30 py-6 border border-slate-50 rounded-lg"></div>
            ))}

            {/* Month days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const { dayTasks, dayCommittees } = getDayItems(day);
              const isSelected = selectedDay === day;
              
              return (
                <button
                  key={`day-${day}`}
                  onClick={() => setSelectedDay(day)}
                  className={`py-2 px-1 border min-h-[70px] rounded-lg transition-all text-right flex flex-col justify-between items-start group ${
                    isSelected 
                      ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                      : 'bg-white hover:bg-slate-50 border-slate-150 hover:border-brand-gold/30'
                  }`}
                >
                  <span className={`font-extrabold text-[11px] px-1.5 rounded-full ${
                    isSelected ? 'bg-brand-gold text-slate-950' : 'text-slate-600'
                  }`}>
                    {day}
                  </span>

                  {/* Overlays indicators */}
                  <div className="w-full space-y-1 mt-2">
                    {dayCommittees.length > 0 && (
                      <div className={`text-[8px] font-black py-0.5 px-1 rounded truncate border ${
                        isSelected 
                          ? 'bg-red-950 text-red-200 border-red-800' 
                          : 'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        لجنة {dayCommittees.length}
                      </div>
                    )}
                    {dayTasks.length > 0 && (
                      <div className={`text-[8px] font-black py-0.5 px-1 rounded truncate border ${
                        isSelected 
                          ? 'bg-slate-850 text-brand-gold border-slate-700' 
                          : 'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                        مهمة {dayTasks.length}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Tasks List & Day details (1 col) */}
        <div className="space-y-6">
          
          {/* Day detail panel */}
          {selectedDay && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
              <h3 className="text-xs font-extrabold text-slate-800 border-b border-slate-150 pb-2 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-brand-gold" />
                المواعيد والمهام ليوم {selectedDay} {monthNames[currentMonth]}
              </h3>

              {/* Committees due today */}
              {selectedDayItems.dayCommittees.map(comm => (
                <div key={comm.id} className="p-3 bg-red-50/40 border border-red-100 rounded-lg text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-slate-900">{comm.client_name}</span>
                    <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[9px] font-bold rounded">جلسة {comm.stage}</span>
                  </div>
                  <p className="text-[10px] text-slate-550 font-medium">{comm.subject}</p>
                  <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold mt-2">
                    <span>قاعة: {comm.room_number || 'غير محددة'}</span>
                    <span>المبلغ: {comm.disputed_amount.toLocaleString()} ج.م</span>
                  </div>
                </div>
              ))}

              {/* Tasks due today */}
              {selectedDayItems.dayTasks.map(task => (
                <div key={task.id} className="p-3 bg-blue-50/20 border border-blue-100 rounded-lg text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-slate-900 truncate max-w-[150px]">{task.title}</span>
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${getPriorityColor(task.priority)}`}>
                      {task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'عادية'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">{task.description || 'لا يوجد وصف تفصيلي.'}</p>
                  <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold mt-2">
                    <span>المنفذ: {task.assigned_name}</span>
                    <button 
                      onClick={() => handleToggleTaskStatus(task.id, task.status)}
                      className={`px-2 py-0.5 rounded font-black border transition-all ${
                        task.status === 'completed' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {task.status === 'completed' ? 'مكتملة' : task.status === 'in_progress' ? 'قيد العمل' : 'معلقة'}
                    </button>
                  </div>
                </div>
              ))}

              {selectedDayItems.dayCommittees.length === 0 && selectedDayItems.dayTasks.length === 0 && (
                <p className="text-center text-slate-400 py-6 text-xs">الأجندة فارغة في هذا اليوم.</p>
              )}
            </div>
          )}

          {/* Global Task Checklist */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col overflow-hidden max-h-[400px]">
            <div className="pb-3 border-b border-slate-150 flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-brand-gold" />
                سجل المهام العام ({filteredTasksList.length})
              </h3>
              
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="border border-slate-200 p-1 rounded text-[10px] bg-slate-50 font-bold"
              >
                <option value="all">الكل</option>
                <option value="pending">معلقة</option>
                <option value="in_progress">قيد التنفيذ</option>
                <option value="completed">منتهية</option>
              </select>
            </div>

            {/* Checklist items */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 mt-2 custom-scrollbar space-y-1">
              {filteredTasksList.map((task) => (
                <div key={task.id} className="py-2.5 flex items-start justify-between gap-3 group">
                  <div className="flex items-start gap-2.5 truncate">
                    <button
                      onClick={() => handleToggleTaskStatus(task.id, task.status)}
                      className={`w-4 h-4 rounded mt-0.5 border flex items-center justify-center transition-all ${
                        task.status === 'completed'
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'border-slate-300 hover:border-brand-gold bg-white'
                      }`}
                    >
                      {task.status === 'completed' && <Check className="w-3 h-3" />}
                    </button>
                    <div className="truncate">
                      <span className={`text-xs font-extrabold block truncate ${
                        task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'
                      }`}>
                        {task.title}
                      </span>
                      <span className="text-[9px] text-slate-400 block font-medium mt-0.5">
                        المنفذ: {task.assigned_name} | تاريخ الاستحقاق: {task.due_date.split('T')[0]}
                      </span>
                    </div>
                  </div>
                  
                  {/* Delete button */}
                  {currentUser?.role === 'admin' && (
                    <button 
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-slate-350 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {filteredTasksList.length === 0 && (
                <p className="text-center text-slate-400 py-6 text-xs">لا يوجد مهام مطابقة للمرشح.</p>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Modal for adding New Task */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-150 flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-slate-900">إسناد مهمة جديدة لفريق العمل</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 text-xs font-bold"
              >
                إغلاق [X]
              </button>
            </div>
            
            <form onSubmit={handleCreateTask} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">اسم المهمة*</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مراجعة الإقرارات الضريبية"
                  className="w-full border border-slate-200 p-2 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">وصف تفصيلي</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب التوجيهات القانونية والمهام الفرعية المطلوبة..."
                  rows={3}
                  className="w-full border border-slate-200 p-2 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">تاريخ الاستحقاق*</label>
                  <input 
                    type="date" 
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full border border-slate-200 p-2 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">الأولوية*</label>
                  <select 
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full border border-slate-200 p-2 rounded-lg"
                  >
                    <option value="low">منخفضة</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">عالية</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">المنفذ المكلف*</label>
                  <select 
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full border border-slate-200 p-2 rounded-lg"
                  >
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.role === 'admin' ? 'مدير' : p.role === 'consultant' ? 'مستشار' : 'إداري'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">لجنة الاعتراض التابعة (اختياري)</label>
                  <select 
                    value={committeeId}
                    onChange={(e) => setCommitteeId(e.target.value)}
                    className="w-full border border-slate-200 p-2 rounded-lg text-[10px]"
                  >
                    <option value="">-- غير مرتبطة بلجنة --</option>
                    {committees.map(c => (
                      <option key={c.id} value={c.id}>{c.client_name} - {c.stage}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg text-sm font-bold text-slate-950 bg-brand-gold hover:bg-brand-gold-hover transition-all shadow-md"
              >
                تثبيت وإسناد المهمة
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
