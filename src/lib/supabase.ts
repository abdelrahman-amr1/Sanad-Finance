import { createClient } from '@supabase/supabase-js';
import { mockDb, Client, Committee, Task, AuditLog, TaxLaw, Profile, Organization } from './mockDb';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Initialize Supabase only if credentials are provided
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Combined Unified Database API
export const db = {
  // Authentication & RBAC User Simulation
  getCurrentUser: (): Profile | null => {
    return mockDb.getCurrentUser();
  },

  setCurrentUser: (profile: Profile | null) => {
    mockDb.setCurrentUser(profile);
  },

  getProfiles: (): Profile[] => {
    return mockDb.getProfiles();
  },

  // Organizations (Multi-Tenancy)
  getOrganizations: async (): Promise<Organization[]> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Supabase getOrganizations error, falling back to mock:', error);
        return mockDb.getOrganizations();
      }
      return data || [];
    }
    return mockDb.getOrganizations();
  },

  addOrganization: async (org: Omit<Organization, 'id' | 'created_at' | 'status'>): Promise<Organization> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('organizations')
        .insert([org])
        .select()
        .single();
      if (error) {
        console.error('Supabase addOrganization error, falling back to mock:', error);
        return mockDb.addOrganization(org);
      }
      return data;
    }
    return mockDb.addOrganization(org);
  },

  updateOrganization: async (id: string, updatedData: Partial<Organization>): Promise<Organization> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('organizations')
        .update(updatedData)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error('Supabase updateOrganization error, falling back to mock:', error);
        return mockDb.updateOrganization(id, updatedData);
      }
      await db.addAuditLog('تحديث بيانات المنصة (Supabase)', `تم تعديل بيانات المنصة: ${data.name}`);
      return data;
    }
    return mockDb.updateOrganization(id, updatedData);
  },

  getActiveOrgId: (): string => {
    return mockDb.getActiveOrgId();
  },

  setActiveOrgId: (orgId: string) => {
    mockDb.setActiveOrgId(orgId);
  },

  // Clients (Tenant Isolated)
  getClients: async (): Promise<Client[]> => {
    const activeOrgId = mockDb.getActiveOrgId();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('organization_id', activeOrgId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Supabase getClients error, falling back to mock:', error);
        return mockDb.getClients();
      }
      return data || [];
    }
    return mockDb.getClients();
  },

  addClient: async (client: Omit<Client, 'id' | 'created_at' | 'status' | 'organization_id'>): Promise<Client> => {
    const activeOrgId = mockDb.getActiveOrgId();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('clients')
        .insert([{ ...client, organization_id: activeOrgId, status: 'active' }])
        .select()
        .single();
      if (error) {
        console.error('Supabase addClient error, falling back to mock:', error);
        return mockDb.addClient(client);
      }
      // Log audit
      await db.addAuditLog('إضافة عميل جديد (Supabase)', `تم إضافة العميل: ${data.name}`);
      return data;
    }
    return mockDb.addClient(client);
  },

  updateClient: async (id: string, updatedData: Partial<Client>): Promise<Client> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('clients')
        .update(updatedData)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error('Supabase updateClient error, falling back to mock:', error);
        return mockDb.updateClient(id, updatedData);
      }
      await db.addAuditLog('تحديث بيانات عميل (Supabase)', `تعديل بيانات العميل: ${data.name}`);
      return data;
    }
    return mockDb.updateClient(id, updatedData);
  },

  // Committees (Tenant Isolated)
  getCommittees: async (): Promise<Committee[]> => {
    const activeOrgId = mockDb.getActiveOrgId();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('committees')
        .select(`
          *,
          clients ( name )
        `)
        .eq('organization_id', activeOrgId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Supabase getCommittees error, falling back to mock:', error);
        return mockDb.getCommittees();
      }
      return (data || []).map((c: any) => ({
        ...c,
        client_name: c.clients?.name || 'عميل غير معروف'
      }));
    }
    return mockDb.getCommittees();
  },

  addCommittee: async (committee: Omit<Committee, 'id' | 'created_at' | 'status' | 'organization_id'>): Promise<Committee> => {
    const activeOrgId = mockDb.getActiveOrgId();
    if (isSupabaseConfigured && supabase) {
      const currentUser = db.getCurrentUser();
      const { data, error } = await supabase
        .from('committees')
        .insert([{ ...committee, organization_id: activeOrgId, status: 'pending', created_by: currentUser ? currentUser.id : null }])
        .select()
        .single();
      if (error) {
        console.error('Supabase addCommittee error, falling back to mock:', error);
        return mockDb.addCommittee(committee);
      }
      // Log audit
      await db.addAuditLog('إنشاء ملف لجنة (Supabase)', `إضافة لجنة بمرحلة [${committee.stage}] للعميل`);
      return data;
    }
    return mockDb.addCommittee(committee);
  },

  updateCommittee: async (id: string, updatedData: Partial<Committee>): Promise<Committee> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('committees')
        .update(updatedData)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error('Supabase updateCommittee error, falling back to mock:', error);
        return mockDb.updateCommittee(id, updatedData);
      }
      await db.addAuditLog('تحديث ملف اللجنة (Supabase)', `تعديل لجنة معرف: ${id}`);
      return data;
    }
    return mockDb.updateCommittee(id, updatedData);
  },

  // Tasks (Tenant Isolated)
  getTasks: async (): Promise<Task[]> => {
    const activeOrgId = mockDb.getActiveOrgId();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          profiles ( name ),
          committees ( subject )
        `)
        .eq('organization_id', activeOrgId)
        .order('due_date', { ascending: true });
      if (error) {
        console.error('Supabase getTasks error, falling back to mock:', error);
        return mockDb.getTasks();
      }
      return (data || []).map((t: any) => ({
        ...t,
        assigned_name: t.profiles?.name || 'غير محدد',
        committee_subject: t.committees?.subject || undefined
      }));
    }
    return mockDb.getTasks();
  },

  addTask: async (task: Omit<Task, 'id' | 'created_at' | 'status' | 'organization_id'>): Promise<Task> => {
    const activeOrgId = mockDb.getActiveOrgId();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ ...task, organization_id: activeOrgId, status: 'pending' }])
        .select()
        .single();
      if (error) {
        console.error('Supabase addTask error, falling back to mock:', error);
        return mockDb.addTask(task);
      }
      await db.addAuditLog('إسناد مهمة (Supabase)', `إضافة مهمة: "${task.title}"`);
      return data;
    }
    return mockDb.addTask(task);
  },

  updateTask: async (id: string, updatedData: Partial<Task>): Promise<Task> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('tasks')
        .update(updatedData)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        console.error('Supabase updateTask error, falling back to mock:', error);
        return mockDb.updateTask(id, updatedData);
      }
      return data;
    }
    return mockDb.updateTask(id, updatedData);
  },

  deleteTask: async (id: string): Promise<void> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      if (error) {
        console.error('Supabase deleteTask error, falling back to mock:', error);
        mockDb.deleteTask(id);
      } else {
        await db.addAuditLog('حذف مهمة (Supabase)', `حذف المهمة رقم: ${id}`);
      }
      return;
    }
    mockDb.deleteTask(id);
  },

  // Audit Logs (Tenant Isolated)
  getAuditLogs: async (): Promise<AuditLog[]> => {
    const activeOrgId = mockDb.getActiveOrgId();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('organization_id', activeOrgId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) {
        console.error('Supabase getAuditLogs error, falling back to mock:', error);
        return mockDb.getAuditLogs();
      }
      return data || [];
    }
    return mockDb.getAuditLogs();
  },

  addAuditLog: async (action: string, details?: string): Promise<AuditLog> => {
    const activeOrgId = mockDb.getActiveOrgId();
    // Audit logs must be added to local mock db to maintain local trail
    const localLog = mockDb.addAuditLog(action, details);
    
    if (isSupabaseConfigured && supabase) {
      const currentUser = db.getCurrentUser();
      const { data, error } = await supabase
        .from('audit_logs')
        .insert([{
          organization_id: activeOrgId,
          user_id: currentUser ? currentUser.id : null,
          user_name: currentUser ? currentUser.name : 'النظام',
          user_role: currentUser ? currentUser.role : 'system',
          action,
          details
        }])
        .select()
        .single();
      if (error) {
        console.error('Supabase addAuditLog error:', error);
      } else {
        return data;
      }
    }
    return localLog;
  },

  // Laws Search (Supports Vector Similarity Search in Supabase + fallback keywords search)
  searchLaws: async (query: string): Promise<TaxLaw[]> => {
    if (isSupabaseConfigured && supabase) {
      try {
        // Fetch embeddings for query from API
        const response = await fetch('/api/embeddings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: query })
        });
        if (response.ok) {
          const { embedding } = await response.json();
          // Call postgres match_laws RPC function
          const { data, error } = await supabase.rpc('match_laws', {
            query_embedding: embedding,
            match_threshold: 0.3,
            match_count: 3
          });
          if (!error && data && data.length > 0) {
            return data;
          }
        }
      } catch (err) {
        console.error('Vector search failed, falling back to keyword search:', err);
      }
    }
    return mockDb.searchLaws(query);
  },

  resetMockDb: () => {
    mockDb.resetMockDb();
  }
};
export type { Client, Committee, Task, AuditLog, TaxLaw, Profile, Organization };
