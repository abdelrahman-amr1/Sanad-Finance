import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(req: NextRequest) {
  try {
    const config = {
      supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    };

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Supabase URL or Anon Key is missing in server environment variables',
        config
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 1. Test query organizations
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .limit(5);

    if (orgsError) {
      return NextResponse.json({
        status: 'database_error',
        message: orgsError.message,
        details: orgsError,
        config
      });
    }

    // 2. Test query profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(5);

    return NextResponse.json({
      status: 'success',
      message: 'Server-side database connection verified successfully',
      config,
      organizationsCount: orgs?.length || 0,
      organizationsSample: orgs,
      profilesSample: profiles,
      profilesError: profilesError ? profilesError.message : null
    });

  } catch (error: any) {
    return NextResponse.json({ 
      status: 'server_error', 
      message: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}
