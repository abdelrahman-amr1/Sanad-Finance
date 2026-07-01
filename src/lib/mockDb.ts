// Mock Database for local development and testing
// Saves data in localStorage to persist modifications across refreshes

export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'suspended';
  address?: string; // عنوان المكتب
  phone?: string; // هاتف المكتب
  description?: string; // تفاصيل ونبذة عن المكتب
  created_at: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'consultant' | 'staff';
  organization_id?: string; // null for super_admin who has global access
  avatar_url?: string;
}

export interface Client {
  id: string;
  organization_id: string;
  name: string;
  tax_card_number: string;
  file_number: string;
  mobile: string;
  email: string;
  address: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Committee {
  id: string;
  organization_id: string;
  client_id: string;
  client_name?: string;
  stage: 'معاينة' | 'فحص' | 'طعن' | 'قرار نهائي';
  subject: string;
  tax_authority: string;
  disputed_amount: number;
  tax_years: string;
  hearing_date?: string;
  room_number?: string;
  status: 'pending' | 'in_progress' | 'resolved';
  notes?: string;
  created_at: string;
}

export interface Task {
  id: string;
  organization_id: string;
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
  organization_id: string;
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
  law_type: string;
  article_number: string;
  content: string;
}

// Initial Seed Data with valid PostgreSQL UUID strings for multi-tenant SaaS compatibility
const defaultOrganizations: Organization[] = [
  { 
    id: '11111111-1111-1111-1111-111111111111', 
    name: 'Sameh Samir - A&B team', 
    slug: 'sameh-samir-ab-team', 
    status: 'active', 
    address: 'شارع البطل أحمد عبد العزيز، المهندسين، الجيزة',
    phone: '02-33445566',
    description: 'المكتب الاستشاري الرئيسي للمجموعة، متخصص في لجان فحص القيمة المضافة وضريبة الدخل لكبرى الشركات المساهمة.',
    created_at: new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString() 
  },
  { 
    id: '22222222-2222-2222-2222-222222222222', 
    name: 'مكتب النور للاستشارات والضرائب', 
    slug: 'al-nour-tax', 
    status: 'active', 
    address: 'شارع فؤاد، وسط البلد، الإسكندرية',
    phone: '03-4889900',
    description: 'مكتب استشاري متخصص في المنازعات الجمركية وضرائب المهن الحرة لقطاع الاستيراد والتصدير بالإسكندرية.',
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString() 
  }
];

const defaultProfiles: Profile[] = [
  // Super Admin updated to Abdelrahman Amr
  { id: 'usr-super', name: 'أ. عبد الرحمن عمرو', email: 'abdelrahman@sanadfinance.com', role: 'super_admin', avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=faces' },
  // Sameh Samir - A&B team profiles
  { id: 'usr-admin', name: 'أ. سامح سمير', email: 'admin@abteam.com', role: 'admin', organization_id: '11111111-1111-1111-1111-111111111111', avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=faces' },
  { id: 'usr-cons', name: 'مستشار أحمد رأفت', email: 'consultant@abteam.com', role: 'consultant', organization_id: '11111111-1111-1111-1111-111111111111', avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces' },
  { id: 'usr-staff', name: 'مهى علي', email: 'staff@abteam.com', role: 'staff', organization_id: '11111111-1111-1111-1111-111111111111', avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=faces' },
  // Al-Nour Office profiles
  { id: 'usr-admin-nour', name: 'أ. محمد عبد الله', email: 'admin@alnour.com', role: 'admin', organization_id: '22222222-2222-2222-2222-222222222222', avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces' },
  { id: 'usr-cons-nour', name: 'مستشار خالد منصور', email: 'consultant@alnour.com', role: 'consultant', organization_id: '22222222-2222-2222-2222-222222222222', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces' },
  { id: 'usr-staff-nour', name: 'أ. سارة أحمد', email: 'staff@alnour.com', role: 'staff', organization_id: '22222222-2222-2222-2222-222222222222', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces' }
];

const defaultClients: Client[] = [];

const defaultCommittees: Committee[] = [];

const defaultTasks: Task[] = [];

const defaultAuditLogs: AuditLog[] = [];

// Seeded Egyptian Tax Laws
const defaultLaws: TaxLaw[] = [
  { id: 'law-1', law_number: '91', law_year: '2005', law_type: 'ضريبة الدخل', article_number: '8', content: 'تُحدد أسعار الضريبة على دخل الأشخاص الطبيعيين على عدة شرائح تبدأ من الشريحة المعفاة البالغة 15,000 جنيه سنوياً، وتتدرج نسب الضريبة لتصل إلى 25% ثم 27.5% لأصحاب الدخول المرتفعة التي تفوق المليون جنيه سنوياً.' },
  { id: 'law-2', law_number: '91', law_year: '2005', law_type: 'ضريبة الدخل', article_number: '110', content: 'يستحق مقابل تأخير على ما لا يتم أداؤه من الضريبة في موعدها القانوني. ويتم حساب مقابل التأخير على أساس سعر الائتمان والخصم المعلن من البنك المركزي المصري مضافاً إليه 2%.' },
  { id: 'law-3', law_number: '67', law_year: '2016', law_type: 'ضريبة القيمة المضافة', article_number: '2', content: 'تفرض الضريبة على السلع والخدمات المحلية والمستوردة في كافة مراحل تداولها إلا ما استثني بنص خاص. ويُلتزم بتسجيل الموردين فور بلوغ حجم مبيعاتهم 500 ألف جنيه مصري.' },
  { id: 'law-4', law_number: '67', law_year: '2016', law_type: 'ضريبة القيمة المضافة', article_number: '3', content: 'يكون السعر العام لضريبة القيمة المضافة هو 14% على جميع السلع والخدمات الخاضعة، باستثناء السلع والخدمات المعفاة الواردة في جدول الإعفاءات المرفق بالقانون.' },
  { id: 'law-5', law_number: '206', law_year: '2020', law_type: 'قانون الإجراءات الضريبية الموحد', article_number: '31', content: 'يجب على كل ممول تقديم الإقرار الضريبي السنوي أو الشهري إلكترونياً. ويحدد القانون مواعيد صارمة لتقديم الإقرارات: 3 أشهر للشركات، وشهر تالٍ لضريبة القيمة المضافة.' }
];

const isClient = typeof window !== 'undefined';

const getFromStorage = <T>(key: string, defaultValue: T): T => {
  if (!isClient) return defaultValue;
  const stored = localStorage.getItem(key);
  
  // Auto-healing check: If the stored data contains old Super Admin name 'خالد سند', reset the key
  if (stored && stored.includes('خالد سند')) {
    localStorage.removeItem(key);
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  
  if (!stored) {
    // DO NOT save default null to localStorage to avoid permanent empty values
    if (defaultValue !== null) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
    }
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

// Client-side domain parser helper to extract the subdomain/slug dynamically
export const getSlugFromHostname = (): string | null => {
  if (!isClient) return null;
  const hostname = window.location.hostname;
  
  // Exclude main application domains and localhost roots
  if (
    hostname === 'localhost' || 
    hostname === '127.0.0.1' || 
    hostname === 'sanadfinance.vercel.app' || 
    hostname === 'sanadfinance.com'
  ) {
    return null;
  }
  
  // 1. If Vercel default deployment domain (e.g. sameh-samir-ab-team-sanadfinance.vercel.app)
  if (hostname.endsWith('-sanadfinance.vercel.app')) {
    return hostname.replace('-sanadfinance.vercel.app', '');
  }
  
  // 2. If custom domain subdomain (e.g. sameh-samir-ab-team.sanadfinance.com)
  if (hostname.endsWith('.sanadfinance.com')) {
    return hostname.replace('.sanadfinance.com', '');
  }
  
  // 3. If local localhost subdomain (e.g. sameh-samir-ab-team.localhost)
  if (hostname.endsWith('.localhost')) {
    return hostname.replace('.localhost', '');
  }
  
  // Fallback: If hostname contains a dot and doesn't match above, try to split
  const parts = hostname.split('.');
  if (parts.length > 2 && parts[0] !== 'www') {
    return parts[0];
  }
  
  return null;
};

// Client-side domain routing helper to isolate tenants by domain name
export const getTenantFromHostname = (): { isSubdomain: boolean; orgId?: string; slug?: string } => {
  if (!isClient) {
    return { isSubdomain: false };
  }
  
  const slug = getSlugFromHostname();
  if (slug) {
    // Check if we have the organization cached in localStorage (avoids async queries blocking)
    const cached = localStorage.getItem('ab_tenant_org');
    if (cached) {
      try {
        const org = JSON.parse(cached);
        if (org && org.slug === slug) {
          return {
            isSubdomain: true,
            orgId: org.id,
            slug: org.slug
          };
        }
      } catch (e) {}
    }
    
    // Fallback: If not cached yet, return subdomain info (id will be updated by page useEffect)
    return {
      isSubdomain: true,
      slug: slug
    };
  }
  
  return { isSubdomain: false };
};

export const mockDb = {
  // Organizations
  getOrganizations: (): Organization[] => {
    return getFromStorage<Organization[]>('ab_organizations', defaultOrganizations);
  },

  getOrganizationBySlug: (slug: string): Organization | null => {
    const orgs = mockDb.getOrganizations();
    return orgs.find(o => o.slug === slug) || null;
  },

  addOrganization: (org: Omit<Organization, 'id' | 'created_at' | 'status'>): Organization => {
    const orgs = mockDb.getOrganizations();
    const newOrg: Organization = {
      ...org,
      id: `org-${Date.now()}`,
      status: 'active',
      created_at: new Date().toISOString()
    };
    orgs.push(newOrg);
    saveToStorage('ab_organizations', orgs);
    mockDb.addAuditLog('إنشاء شركة/منصة جديدة', `تم إضافة شركة جديدة: ${newOrg.name} بمعرف: ${newOrg.slug}`);
    return newOrg;
  },

  updateOrganization: (id: string, updatedData: Partial<Organization>): Organization => {
    const orgs = mockDb.getOrganizations();
    const idx = orgs.findIndex(o => o.id === id);
    if (idx === -1) throw new Error('Organization not found');
    orgs[idx] = { ...orgs[idx], ...updatedData };
    saveToStorage('ab_organizations', orgs);
    mockDb.addAuditLog('تحديث بيانات المنصة (محاكاة)', `تم تعديل بيانات المنصة: ${orgs[idx].name}`);
    return orgs[idx];
  },

  // Active Tenant Context (for Super Admin & Subdomain lock)
  getActiveOrgId: (): string => {
    // 1. If we are on a specific subdomain/custom domain, force the corresponding organization
    const tenant = getTenantFromHostname();
    if (tenant.isSubdomain && tenant.orgId) {
      return tenant.orgId;
    }

    // 2. Otherwise fall back to user profile role or switcher settings
    const user = mockDb.getCurrentUser();
    if (!user || user.role !== 'super_admin') {
      return (user && user.organization_id) || '11111111-1111-1111-1111-111111111111';
    }
    return getFromStorage<string>('ab_active_org_id', '11111111-1111-1111-1111-111111111111');
  },

  setActiveOrgId: (orgId: string) => {
    saveToStorage('ab_active_org_id', orgId);
    mockDb.addAuditLog('تغيير المنصة النشطة (سوبر أدمن)', `تم الانتقال لاستعراض بيانات الشركة معرف: ${orgId}`);
  },

  // Users - Modified to default to null for proper simulated login
  getCurrentUser: (): Profile | null => {
    return getFromStorage<Profile | null>('ab_current_user', null);
  },

  setCurrentUser: (profile: Profile | null) => {
    if (profile === null) {
      if (isClient) {
        localStorage.removeItem('ab_current_user');
      }
    } else {
      saveToStorage<Profile>('ab_current_user', profile);
      // If user has organization_id, set it as active org
      if (profile.organization_id) {
        saveToStorage('ab_active_org_id', profile.organization_id);
      }
      mockDb.addAuditLog('تغيير المستخدم الفعال (محاكاة)', `تم تسجيل دخول ${profile.name} (${profile.role})`);
    }
  },

  getProfiles: (): Profile[] => {
    const defaultList = defaultProfiles;
    let profilesList = defaultList;
    if (isClient) {
      const stored = localStorage.getItem('ab_mock_profiles');
      // Auto-healing profiles list if it has old super admin or is missing Al-Nour profiles
      if (stored && (stored.includes('خالد سند') || !stored.includes('usr-admin-nour'))) {
        localStorage.removeItem('ab_mock_profiles');
        localStorage.setItem('ab_mock_profiles', JSON.stringify(defaultList));
        profilesList = defaultList;
      } else if (stored) {
        try {
          profilesList = JSON.parse(stored);
        } catch (e) {}
      } else {
        localStorage.setItem('ab_mock_profiles', JSON.stringify(defaultList));
      }
    }
    
    // Filter profiles by activeOrgId to isolate tenants (Super Admin is always visible)
    const activeOrgId = mockDb.getActiveOrgId();
    return profilesList.filter(p => p.role === 'super_admin' || p.organization_id === activeOrgId);
  },

  // Clients (Filtered by active tenant)
  getClients: (): Client[] => {
    const all = getFromStorage<Client[]>('ab_clients', defaultClients);
    const activeOrgId = mockDb.getActiveOrgId();
    return all.filter(c => c.organization_id === activeOrgId);
  },

  addClient: (client: Omit<Client, 'id' | 'created_at' | 'status' | 'organization_id'>): Client => {
    const clients = getFromStorage<Client[]>('ab_clients', defaultClients);
    const activeOrgId = mockDb.getActiveOrgId();
    const newClient: Client = {
      ...client,
      id: `cli-${Date.now()}`,
      organization_id: activeOrgId,
      status: 'active',
      created_at: new Date().toISOString()
    };
    clients.unshift(newClient);
    saveToStorage('ab_clients', clients);
    
    mockDb.addAuditLog('إضافة عميل جديد', `تم إضافة العميل: ${newClient.name} بالملف رقم ${newClient.file_number}`);
    return newClient;
  },

  updateClient: (id: string, updatedData: Partial<Client>): Client => {
    const clients = getFromStorage<Client[]>('ab_clients', defaultClients);
    const idx = clients.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Client not found');
    
    clients[idx] = { ...clients[idx], ...updatedData };
    saveToStorage('ab_clients', clients);
    
    mockDb.addAuditLog('تحديث بيانات عميل', `تعديل بيانات العميل: ${clients[idx].name}`);
    return clients[idx];
  },

  // Committees (Filtered by active tenant)
  getCommittees: (): Committee[] => {
    const all = getFromStorage<Committee[]>('ab_committees', defaultCommittees);
    const activeOrgId = mockDb.getActiveOrgId();
    const filtered = all.filter(comm => comm.organization_id === activeOrgId);
    
    // Join client names
    const clients = getFromStorage<Client[]>('ab_clients', defaultClients);
    return filtered.map(comm => {
      const client = clients.find(c => c.id === comm.client_id);
      return {
        ...comm,
        client_name: client ? client.name : 'عميل غير معروف'
      };
    });
  },

  addCommittee: (committee: Omit<Committee, 'id' | 'created_at' | 'status' | 'organization_id'>): Committee => {
    const committees = getFromStorage<Committee[]>('ab_committees', defaultCommittees);
    const activeOrgId = mockDb.getActiveOrgId();
    const newCommittee: Committee = {
      ...committee,
      id: `com-${Date.now()}`,
      organization_id: activeOrgId,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    committees.unshift(newCommittee);
    saveToStorage('ab_committees', committees);
    
    const client = mockDb.getClients().find(c => c.id === committee.client_id);
    mockDb.addAuditLog('إنشاء ملف لجنة جديدة', `إضافة لجنة بمرحلة [${committee.stage}] للعميل: ${client?.name || 'مجهول'}`);
    return newCommittee;
  },

  updateCommittee: (id: string, updatedData: Partial<Committee>): Committee => {
    const committees = getFromStorage<Committee[]>('ab_committees', defaultCommittees);
    const idx = committees.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Committee not found');
    
    const oldStage = committees[idx].stage;
    committees[idx] = { ...committees[idx], ...updatedData };
    saveToStorage('ab_committees', committees);
    
    const client = mockDb.getClients().find(c => c.id === committees[idx].client_id);
    let actionDesc = `تعديل بيانات ملف لجنة للعميل: ${client?.name}`;
    if (updatedData.stage && updatedData.stage !== oldStage) {
      actionDesc = `تحويل مرحلة لجنة للعميل ${client?.name} من [${oldStage}] إلى [${updatedData.stage}]`;
    }
    
    mockDb.addAuditLog('تحديث ملف اللجنة', actionDesc);
    return committees[idx];
  },

  // Tasks (Filtered by active tenant)
  getTasks: (): Task[] => {
    const all = getFromStorage<Task[]>('ab_tasks', defaultTasks);
    const activeOrgId = mockDb.getActiveOrgId();
    const filtered = all.filter(t => t.organization_id === activeOrgId);
    
    const profiles = mockDb.getProfiles();
    const committees = mockDb.getCommittees();
    return filtered.map(t => {
      const user = profiles.find(p => p.id === t.assigned_to);
      const comm = committees.find(c => c.id === t.committee_id);
      return {
        ...t,
        assigned_name: user ? user.name : 'غير محدد',
        committee_subject: comm ? comm.subject : undefined
      };
    });
  },

  addTask: (task: Omit<Task, 'id' | 'created_at' | 'status' | 'organization_id'>): Task => {
    const tasks = getFromStorage<Task[]>('ab_tasks', defaultTasks);
    const activeOrgId = mockDb.getActiveOrgId();
    const newTask: Task = {
      ...task,
      id: `tsk-${Date.now()}`,
      organization_id: activeOrgId,
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
    
    tasks[idx] = { ...tasks[idx], ...updatedData };
    saveToStorage('ab_tasks', tasks);
    return tasks[idx];
  },

  deleteTask: (id: string) => {
    const tasks = getFromStorage<Task[]>('ab_tasks', defaultTasks);
    const filtered = tasks.filter(t => t.id !== id);
    saveToStorage('ab_tasks', filtered);
  },

  // Audit Logs (Filtered by active tenant)
  getAuditLogs: (): AuditLog[] => {
    const all = getFromStorage<AuditLog[]>('ab_audit_logs', defaultAuditLogs);
    const activeOrgId = mockDb.getActiveOrgId();
    return all.filter(log => log.organization_id === activeOrgId);
  },

  addAuditLog: (action: string, details?: string) => {
    const logs = getFromStorage<AuditLog[]>('ab_audit_logs', defaultAuditLogs);
    const currentUser = mockDb.getCurrentUser();
    const activeOrgId = mockDb.getActiveOrgId();
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      organization_id: activeOrgId,
      user_id: currentUser ? currentUser.id : 'system',
      user_name: currentUser ? currentUser.name : 'النظام',
      user_role: currentUser ? currentUser.role : 'system',
      action,
      details,
      created_at: new Date().toISOString()
    };
    logs.unshift(newLog);
    const cappedLogs = logs.slice(0, 100);
    saveToStorage('ab_audit_logs', cappedLogs);
    return newLog;
  },

  // Laws
  getLaws: (): TaxLaw[] => {
    return defaultLaws;
  },

  searchLaws: (query: string): TaxLaw[] => {
    const laws = mockDb.getLaws();
    if (!query) return laws;
    const cleanQuery = query.toLowerCase();
    
    return laws
      .map(law => {
        let score = 0;
        const text = `${law.law_number} ${law.law_year} ${law.law_type} المادة ${law.article_number} ${law.content}`.toLowerCase();
        
        const words = cleanQuery.split(/\s+/);
        words.forEach(word => {
          if (word.length > 2 && text.includes(word)) {
            score += 1;
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
      .slice(0, 3);
  },

  resetMockDb: () => {
    if (isClient) {
      localStorage.removeItem('ab_organizations');
      localStorage.removeItem('ab_current_user');
      localStorage.removeItem('ab_active_org_id');
      localStorage.removeItem('ab_clients');
      localStorage.removeItem('ab_committees');
      localStorage.removeItem('ab_tasks');
      localStorage.removeItem('ab_audit_logs');
      localStorage.removeItem('ab_mock_profiles');
      window.location.reload();
    }
  }
};
