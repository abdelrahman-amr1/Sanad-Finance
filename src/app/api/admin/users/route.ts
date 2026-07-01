import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { db, isSupabaseConfigured } from '@/lib/supabase';
import { mockDb, Profile } from '@/lib/mockDb';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create a Supabase client with the service role key to access Admin Auth APIs
const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

const isServiceRoleActive = !!supabaseAdmin;

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch profiles
    if (isSupabaseConfigured && isServiceRoleActive && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        return NextResponse.json({ users: data });
      }
    }
    
    // Fallback to local mock profiles
    const mockUsers = mockDb.getProfiles();
    // Also include any users created locally in localStorage
    const storedClients = typeof window !== 'undefined' ? localStorage.getItem('ab_clients') : null; // check if storage has custom data
    // In mockDb, we can retrieve dynamically modified profiles
    const currentMockProfiles = mockDb.getProfiles();
    
    // Read from localStorage to retrieve newly created mock profiles
    let profilesList = currentMockProfiles;
    if (typeof window !== 'undefined') {
      const storedProfiles = localStorage.getItem('ab_mock_profiles');
      if (storedProfiles) {
        try {
          profilesList = JSON.parse(storedProfiles);
        } catch(e) {}
      }
    }

    return NextResponse.json({ users: profilesList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, name, role, password = 'ABTeam2026!' } = await req.json();
    
    if (!email || !name || !role) {
      return NextResponse.json({ error: 'Email, Name, and Role are required' }, { status: 400 });
    }

    // 1. If real Supabase and Service Role are active
    if (isSupabaseConfigured && isServiceRoleActive && supabaseAdmin) {
      // Create user inside Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (authError) {
        console.error('Supabase Auth createUser error:', authError);
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }

      const user = authData.user;
      if (!user) {
        throw new Error('User creation returned empty payload');
      }

      // Create profile row linked to auth user
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert([{
          id: user.id,
          name,
          email,
          role,
          avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces` // Default generic avatar
        }])
        .select()
        .single();

      if (profileError) {
        console.error('Supabase profiles insert error, reverting auth user:', profileError);
        // Rollback created auth user
        await supabaseAdmin.auth.admin.deleteUser(user.id);
        return NextResponse.json({ error: profileError.message }, { status: 400 });
      }

      // Log action
      await db.addAuditLog('إنشاء حساب مستخدم جديد (سحابي)', `تم تسجيل الحساب: ${name} بدوره: ${role}`);

      return NextResponse.json({ user: profileData });
    }

    // 2. Local Mock DB Fallback
    // In mock mode, we add the profile to localStorage profiles list
    let profilesList = mockDb.getProfiles();
    if (typeof window !== 'undefined') {
      const storedProfiles = localStorage.getItem('ab_mock_profiles');
      if (storedProfiles) {
        try { profilesList = JSON.parse(storedProfiles); } catch(e) {}
      }
    }

    const newProfile: Profile = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role,
      avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces`
    };

    profilesList.push(newProfile);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ab_mock_profiles', JSON.stringify(profilesList));
    }
    
    // Write log
    mockDb.addAuditLog('إنشاء حساب مستخدم جديد (محاكاة)', `تم تسجيل الحساب: ${name} بدوره: ${role}`);

    return NextResponse.json({ user: newProfile });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // 1. If real Supabase and Service Role are active
    if (isSupabaseConfigured && isServiceRoleActive && supabaseAdmin) {
      // Delete user from Supabase Auth (cascades to profiles)
      const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (error) {
        console.error('Supabase Auth deleteUser error:', error);
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      await db.addAuditLog('حذف حساب مستخدم (سحابي)', `حذف المعرف: ${id}`);
      return NextResponse.json({ success: true });
    }

    // 2. Local Mock DB Fallback
    let profilesList = mockDb.getProfiles();
    if (typeof window !== 'undefined') {
      const storedProfiles = localStorage.getItem('ab_mock_profiles');
      if (storedProfiles) {
        try { profilesList = JSON.parse(storedProfiles); } catch(e) {}
      }
    }

    const filtered = profilesList.filter(p => p.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ab_mock_profiles', JSON.stringify(filtered));
    }

    mockDb.addAuditLog('حذف حساب مستخدم (محاكاة)', `حذف المعرف: ${id}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
