// Mock Database for local development and testing
// Saves data in localStorage to persist modifications across refreshes

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'consultant' | 'staff';
  avatar_url?: string;
}

export interface Client {
  id: string;
  name: string;
  tax_card_number: string; // الرقم الضريبي
  file_number: string;     // رقم الملف
  mobile: string;
  email: string;
  address: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Committee {
  id: string;
  client_id: string;
  client_name?: string;
  stage: 'معاينة' | 'فحص' | 'طعن' | 'قرار نهائي';
  subject: string;
  tax_authority: string; // مأمورية الضرائب
  disputed_amount: number;
  tax_years: string;      // السنوات الضريبية المعنية
  hearing_date?: string;
  room_number?: string;
  status: 'pending' | 'in_progress' | 'resolved';
  notes?: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assigned_to: string; // profile_id
  assigned_name?: string;
  committee_id?: string;
  committee_subject?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  action: string;
  details?: string;
  created_at: string;
}

export interface TaxLaw {
  id: string;
  law_number: string;
  law_year: string;
  law_type: string; // ضريبة دخل، قيمة مضافة، إجراءات موحدة، إلخ.
  article_number: string;
  content: string;
}

// Initial Seed Data
const defaultProfiles: Profile[] = [
  { id: 'usr-admin', name: 'أ. سامح سمير', email: 'admin@abteam.com', role: 'admin', avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=faces' },
  { id: 'usr-cons', name: 'مستشار أحمد رأفت', email: 'consultant@abteam.com', role: 'consultant', avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces' },
  { id: 'usr-staff', name: 'مهى علي', email: 'staff@abteam.com', role: 'staff', avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=faces' }
];

const defaultClients: Client[] = [
  { id: 'cli-1', name: 'شركة النيل للمقاولات والاستيراد', tax_card_number: '123-456-789', file_number: 'م/1209/دخل', mobile: '01012345678', email: 'info@nile-contracting.com', address: '12 شارع التسعين، التجمع الخامس، القاهرة', status: 'active', created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString() },
  { id: 'cli-2', name: 'المصرية للحلول البرمجية', tax_card_number: '987-654-321', file_number: 'م/3490/مضافة', mobile: '01222446688', email: 'finance@egypt-software.com', address: 'المنطقة الحرة العامة، مدينة نصر، القاهرة', status: 'active', created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString() },
  { id: 'cli-3', name: 'مصانع الأمل للصناعات الغذائية', tax_card_number: '456-789-123', file_number: 'م/5567/دخل', mobile: '01144556677', email: 'tax@alamal-foods.com', address: 'المنطقة الصناعية السادسة، مدينة 6 أكتوبر', status: 'active', created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString() },
  { id: 'cli-4', name: 'الشركة العربية للاستثمار العقاري', tax_card_number: '321-987-654', file_number: 'م/8832/عقاري', mobile: '01511223344', email: 'investments@arabian-realestate.com', address: 'شارع الثورة، مصر الجديدة، القاهرة', status: 'active', created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() }
];

const defaultCommittees: Committee[] = [
  { id: 'com-1', client_id: 'cli-1', stage: 'طعن', subject: 'طعن على تقدير ضريبة أرباح تجارية وصناعية بقيمة مبالغ فيها', tax_authority: 'مأمورية ضرائب الشركات المساهمة بالقاهرة', disputed_amount: 450000.00, tax_years: '2019-2021', hearing_date: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(), room_number: 'قاعة 3 ب', status: 'pending', notes: 'تم تجهيز مذكرة الدفوع القانونية ومستندات الإهلاك السنوية لتفنيد التقدير الجزافي للمأمور الفاحص.', created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString() },
  { id: 'com-2', client_id: 'cli-2', stage: 'فحص', subject: 'فحص ضريبة القيمة المضافة لشهور السنة المالية الماضية', tax_authority: 'مأمورية ضرائب مدينة نصر أول', disputed_amount: 180000.00, tax_years: '2023', hearing_date: new Date(Date.now() + 12 * 24 * 3600 * 1000).toISOString(), room_number: 'مكتب رئيس الفحص الثاني', status: 'in_progress', notes: 'الفاحص يطالب بتحليل فواتير المشتريات ومطابقتها ببيانات منظومة الفواتير الإلكترونية.', created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() },
  { id: 'com-3', client_id: 'cli-3', stage: 'معاينة', subject: 'معاينة ميدانية للمصانع وتقدير الطاقة الإنتاجية الفعلية', tax_authority: 'مأمورية ضرائب أكتوبر', disputed_amount: 0.00, tax_years: '2024', hearing_date: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(), room_number: 'موقع المصنع بمدينة 6 أكتوبر', status: 'pending', notes: 'يجب حضور المستشار الفني والمحامي أثناء معاينة اللجنة للمصنع لمطابقة الآلات القديمة والجديدة.', created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() },
  { id: 'com-4', client_id: 'cli-4', stage: 'قرار نهائي', subject: 'تسوية النزاع القائم بخصوص ضريبة كسب العمل', tax_authority: 'مركز كبار الممولين بالحي الحكومي بالعاصمة الإدارية', disputed_amount: 850000.00, tax_years: '2018-2022', hearing_date: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(), room_number: 'قاعة تسوية النزاعات الضريبية 1', status: 'resolved', notes: 'صدر قرار اللجنة النهائي بتخفيض المطالبة الضريبية بنسبة 70% وتجنيب غرامات التأخير طبقاً للمادة 110 من القانون 91 لسنة 2005.', created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString() }
];

const defaultTasks: Task[] = [
  { id: 'tsk-1', title: 'مراجعة الدفوع القانونية للجنة شركة النيل', description: 'التأكد من مطابقة أرقام الإهلاك الواردة بالمذكرة مع الدفاتر الحسابية المعتمدة.', due_date: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(), status: 'in_progress', priority: 'high', assigned_to: 'usr-cons', committee_id: 'com-1', created_at: new Date().toISOString() },
  { id: 'tsk-2', title: 'تجميع صور فواتير المبيعات الإلكترونية للمصرية للحلول', description: 'مطابقة الفواتير الورقية القديمة مع الفواتير المرفوعة على بورتال الضرائب للرد على استفسارات الفاحص.', due_date: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(), status: 'pending', priority: 'medium', assigned_to: 'usr-staff', committee_id: 'com-2', created_at: new Date().toISOString() },
  { id: 'tsk-3', title: 'تجهيز تفويض الحضور لمعاينة مصانع الأمل', description: 'كتابة صيغة التفويض باسم المحامي المكلف وتوقيعه من الممثل القانوني للشركة وتوثيقه.', due_date: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString(), status: 'pending', priority: 'high', assigned_to: 'usr-staff', committee_id: 'com-3', created_at: new Date().toISOString() },
  { id: 'tsk-4', title: 'تحصيل الفاتورة النهائية للشركة العربية بعد صدور القرار', description: 'إرسال خطاب التهنئة بصدور القرار النهائي وتسليمهم ملف التسوية والمطالبة بنسبة أتعاب النجاح.', due_date: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(), status: 'completed', priority: 'medium', assigned_to: 'usr-admin', committee_id: 'com-4', created_at: new Date().toISOString() }
];

const defaultAuditLogs: AuditLog[] = [
  { id: 'log-1', user_id: 'usr-admin', user_name: 'أ. سامح سمير', user_role: 'admin', action: 'إنشاء ملف عميل جديد', details: 'تم إضافة ملف العميل "الشركة العربية للاستثمار العقاري" بنجاح للمنظومة.', created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() },
  { id: 'log-2', user_id: 'usr-cons', user_name: 'مستشار أحمد رأفت', user_role: 'consultant', action: 'تعديل حالة لجنة', details: 'تم تعديل حالة لجنة كسب العمل للشركة العربية إلى "تم التسوية والحل النهائي".', created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString() },
  { id: 'log-3', user_id: 'usr-admin', user_name: 'أ. سامح سمير', user_role: 'admin', action: 'تصدير تقرير رسمي للطباعة', details: 'تصدير قرار لجنة تسوية النزاع للشركة العربية للطباعة وتوقيعه.', created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() }
];

// Seeded Egyptian Tax Laws for the RAG Knowledge Engine
const defaultLaws: TaxLaw[] = [
  {
    id: 'law-1',
    law_number: '91',
    law_year: '2005',
    law_type: 'ضريبة الدخل',
    article_number: '8',
    content: 'تُحدد أسعار الضريبة على دخل الأشخاص الطبيعيين على عدة شرائح تبدأ من الشريحة المعفاة البالغة 15,000 جنيه سنوياً (تم تعديلها لاحقاً بموجب القوانين المتعاقبة لتصل لـ 30,000 ثم 40,000 جنيه)، وتتدرج نسب الضريبة لتصل إلى 25% ثم 27.5% لأصحاب الدخول المرتفعة التي تفوق المليون جنيه سنوياً.'
  },
  {
    id: 'law-2',
    law_number: '91',
    law_year: '2005',
    law_type: 'ضريبة الدخل',
    article_number: '110',
    content: 'يستحق مقابل تأخير على ما لا يتم أداؤه من الضريبة في موعدها القانوني. ويتم حساب مقابل التأخير على أساس سعر الائتمان والخصم المعلن من البنك المركزي المصري في الأول من يناير من كل عام مضافاً إليه 2%، مع استبعاد كسور الشهر والجنيه.'
  },
  {
    id: 'law-3',
    law_number: '67',
    law_year: '2016',
    law_type: 'ضريبة القيمة المضافة',
    article_number: '2',
    content: 'تفرض الضريبة على السلع والخدمات المحلية والمستوردة في كافة مراحل تداولها إلا ما استثني بنص خاص. ويُلتزم بتسجيل الموردين ومقدمي الخدمات لدى مصلحة الضرائب فور بلوغ حجم مبيعاتهم حد التسجيل المقرر قانوناً وهو 500 ألف جنيه مصري.'
  },
  {
    id: 'law-4',
    law_number: '67',
    law_year: '2016',
    law_type: 'ضريبة القيمة المضافة',
    article_number: '3',
    content: 'يكون السعر العام لضريبة القيمة المضافة هو 14% على جميع السلع والخدمات الخاضعة، باستثناء السلع والخدمات المعفاة الواردة في جدول الإعفاءات المرفق بالقانون (كالخدمات الصحية، التعليم، والخبز)، والسلع الخاضعة لضريبة الجدول بأسعار خاصة.'
  },
  {
    id: 'law-5',
    law_number: '206',
    law_year: '2020',
    law_type: 'قانون الإجراءات الضريبية الموحد',
    article_number: '31',
    content: 'يجب على كل ممول أو مكلف تقديم الإقرار الضريبي السنوي أو الشهري من خلال المنظومة الإلكترونية لمصلحة الضرائب. ويحدد القانون مواعيد صارمة لتقديم الإقرارات: 3 أشهر من انتهاء السنة المالية للشركات، وشهر تالٍ للشهر الخاضع لضريبة القيمة المضافة. ويُعاقب بغرامة مالية كبيرة كل من يتخلف عن هذه المواعيد.'
  },
  {
    id: 'law-6',
    law_number: '206',
    law_year: '2020',
    law_type: 'قانون الإجراءات الضريبية الموحد',
    article_number: '56',
    content: 'يحق للممول الاعتراض على تقديرات مصلحة الضرائب خلال 30 يوماً من تاريخ تبليغه بنموذج التقدير (مثل نموذج 19 ضرائب). ويُحال هذا الاعتراض إلى لجنة الطعن المختصة كأول درجة من درجات النزاع الإداري قبل اللجوء للمحكمة المختصة.'
  },
  {
    id: 'law-7',
    law_number: '206',
    law_year: '2020',
    law_type: 'قانون الإجراءات الضريبية الموحد',
    article_number: '61',
    content: 'تتشكل لجان الطعن الضريبي بقرار من وزير المالية من رئيس من غير موظفي المصلحة وعضوية اثنين من خبراء الضرائب واثنين من موظفي المصلحة. وتصدر اللجنة قراراً مسبباً في حدود طلبات الممول، ويكون قرارها واجب النفاذ إدارياً.'
  }
];

// Helper to access localStorage safely in SSR Next.js
const isClient = typeof window !== 'undefined';

const getFromStorage = <T>(key: string, defaultValue: T): T => {
  if (!isClient) return defaultValue;
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, value: T) => {
  if (isClient) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

export const mockDb = {
  // Current user state (for simulation of RBAC)
  getCurrentUser: (): Profile => {
    const defaultUser = defaultProfiles[0]; // Admin by default
    return getFromStorage<Profile>('ab_current_user', defaultUser);
  },

  setCurrentUser: (profile: Profile) => {
    saveToStorage<Profile>('ab_current_user', profile);
    mockDb.addAuditLog('تغيير دور المستخدم النشط', `تم التبديل إلى دور ${profile.name} (${profile.role})`);
  },

  getProfiles: (): Profile[] => {
    return defaultProfiles;
  },

  // Clients
  getClients: (): Client[] => {
    return getFromStorage<Client[]>('ab_clients', defaultClients);
  },

  addClient: (client: Omit<Client, 'id' | 'created_at' | 'status'>): Client => {
    const clients = mockDb.getClients();
    const newClient: Client = {
      ...client,
      id: `cli-${Date.now()}`,
      status: 'active',
      created_at: new Date().toISOString()
    };
    clients.unshift(newClient);
    saveToStorage('ab_clients', clients);
    
    mockDb.addAuditLog('إضافة عميل جديد', `تم إضافة العميل: ${newClient.name} بالملف رقم ${newClient.file_number}`);
    return newClient;
  },

  updateClient: (id: string, updatedData: Partial<Client>): Client => {
    const clients = mockDb.getClients();
    const idx = clients.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Client not found');
    
    clients[idx] = { ...clients[idx], ...updatedData };
    saveToStorage('ab_clients', clients);
    
    mockDb.addAuditLog('تحديث بيانات عميل', `تعديل بيانات العميل: ${clients[idx].name}`);
    return clients[idx];
  },

  // Committees
  getCommittees: (): Committee[] => {
    const committees = getFromStorage<Committee[]>('ab_committees', defaultCommittees);
    const clients = mockDb.getClients();
    return committees.map(comm => {
      const client = clients.find(c => c.id === comm.client_id);
      return {
        ...comm,
        client_name: client ? client.name : 'عميل غير معروف'
      };
    });
  },

  addCommittee: (committee: Omit<Committee, 'id' | 'created_at' | 'status'>): Committee => {
    const committees = getFromStorage<Committee[]>('ab_committees', defaultCommittees);
    const newCommittee: Committee = {
      ...committee,
      id: `com-${Date.now()}`,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    committees.unshift(newCommittee);
    saveToStorage('ab_committees', committees);
    
    const client = mockDb.getClients().find(c => c.id === committee.client_id);
    mockDb.addAuditLog('إنشاء ملف لجنة جديدة', `إضافة لجنة بمرحلة [${committee.stage}] للعميل: ${client?.name || 'مجهول'} بموضوع: ${committee.subject}`);
    return newCommittee;
  },

  updateCommitteeStage: (id: string, stage: Committee['stage']): Committee => {
    return mockDb.updateCommittee(id, { stage });
  },

  updateCommittee: (id: string, updatedData: Partial<Committee>): Committee => {
    const committees = getFromStorage<Committee[]>('ab_committees', defaultCommittees);
    const idx = committees.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Committee not found');
    
    const oldStage = committees[idx].stage;
    committees[idx] = { ...committees[idx], ...updatedData };
    saveToStorage('ab_committees', committees);
    
    const client = mockDb.getClients().find(c => c.id === committees[idx].client_id);
    let actionDesc = `تعديل بيانات ملف اللجنة للعميل: ${client?.name}`;
    if (updatedData.stage && updatedData.stage !== oldStage) {
      actionDesc = `تحويل مرحلة اللجنة للعميل ${client?.name} من [${oldStage}] إلى [${updatedData.stage}]`;
    }
    
    mockDb.addAuditLog('تحديث ملف اللجنة', actionDesc);
    return committees[idx];
  },

  // Tasks
  getTasks: (): Task[] => {
    const tasks = getFromStorage<Task[]>('ab_tasks', defaultTasks);
    const profiles = mockDb.getProfiles();
    const committees = mockDb.getCommittees();
    return tasks.map(t => {
      const user = profiles.find(p => p.id === t.assigned_to);
      const comm = committees.find(c => c.id === t.committee_id);
      return {
        ...t,
        assigned_name: user ? user.name : 'غير محدد',
        committee_subject: comm ? comm.subject : undefined
      };
    });
  },

  addTask: (task: Omit<Task, 'id' | 'created_at' | 'status'>): Task => {
    const tasks = getFromStorage<Task[]>('ab_tasks', defaultTasks);
    const newTask: Task = {
      ...task,
      id: `tsk-${Date.now()}`,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    tasks.unshift(newTask);
    saveToStorage('ab_tasks', tasks);
    
    const assignedUser = defaultProfiles.find(p => p.id === task.assigned_to);
    mockDb.addAuditLog('إسناد مهمة جديدة', `تم إسناد مهمة "${task.title}" إلى ${assignedUser?.name || 'غير محدد'}`);
    return newTask;
  },

  updateTask: (id: string, updatedData: Partial<Task>): Task => {
    const tasks = getFromStorage<Task[]>('ab_tasks', defaultTasks);
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Task not found');
    
    const oldStatus = tasks[idx].status;
    tasks[idx] = { ...tasks[idx], ...updatedData };
    saveToStorage('ab_tasks', tasks);
    
    if (updatedData.status && updatedData.status !== oldStatus) {
      mockDb.addAuditLog('تحديث حالة المهمة', `تم تغيير حالة المهمة "${tasks[idx].title}" إلى [${updatedData.status}]`);
    } else {
      mockDb.addAuditLog('تعديل تفاصيل المهمة', `تعديل تفاصيل المهمة: ${tasks[idx].title}`);
    }
    return tasks[idx];
  },

  deleteTask: (id: string) => {
    const tasks = getFromStorage<Task[]>('ab_tasks', defaultTasks);
    const taskToDelete = tasks.find(t => t.id === id);
    const filtered = tasks.filter(t => t.id !== id);
    saveToStorage('ab_tasks', filtered);
    if (taskToDelete) {
      mockDb.addAuditLog('حذف مهمة', `حذف المهمة القانونية: "${taskToDelete.title}"`);
    }
  },

  // Audit Logs
  getAuditLogs: (): AuditLog[] => {
    return getFromStorage<AuditLog[]>('ab_audit_logs', defaultAuditLogs);
  },

  addAuditLog: (action: string, details?: string) => {
    const logs = getFromStorage<AuditLog[]>('ab_audit_logs', defaultAuditLogs);
    const currentUser = mockDb.getCurrentUser();
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_role: currentUser.role,
      action,
      details,
      created_at: new Date().toISOString()
    };
    logs.unshift(newLog);
    // Keep logs size capped at 100 entries locally
    const cappedLogs = logs.slice(0, 100);
    saveToStorage('ab_audit_logs', cappedLogs);
    return newLog;
  },

  // Laws
  getLaws: (): TaxLaw[] => {
    return defaultLaws;
  },

  // Local semantic keyword search mock
  searchLaws: (query: string): TaxLaw[] => {
    const laws = mockDb.getLaws();
    if (!query) return laws;
    const cleanQuery = query.toLowerCase();
    
    // Quick keyword weights matching
    return laws
      .map(law => {
        let score = 0;
        const text = `${law.law_number} ${law.law_year} ${law.law_type} المادة ${law.article_number} ${law.content}`.toLowerCase();
        
        // Match exact words
        const words = cleanQuery.split(/\s+/);
        words.forEach(word => {
          if (word.length > 2 && text.includes(word)) {
            score += 1;
            // Higher weight if the query contains exact article or law numbers
            if (law.law_number === word || law.article_number === word) {
              score += 5;
            }
          }
        });
        
        return { law, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.law)
      .slice(0, 3); // Return top 3 matches
  },

  resetMockDb: () => {
    if (isClient) {
      localStorage.removeItem('ab_current_user');
      localStorage.removeItem('ab_clients');
      localStorage.removeItem('ab_committees');
      localStorage.removeItem('ab_tasks');
      localStorage.removeItem('ab_audit_logs');
      window.location.reload();
    }
  }
};
