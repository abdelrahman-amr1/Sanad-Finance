const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pgrblvunsqkyvblyoalf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncmJsdnVuc3FreXZibHlvYWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4ODg1NjEsImV4cCI6MjA5ODQ2NDU2MX0.sq1nIFswfVDYCu7mSQMrPXVAEmqADzN-h2w-Lf2V-vQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Attempting sign in with @supabase/supabase-js...");
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'abdelrahman@sanad.ai',
      password: 'Sanad2026!'
    });
    
    if (error) {
      console.error("Auth Error:", error.message);
      return;
    }
    
    const user = data.user;
    console.log("Auth Success. User ID:", user.id);
    
    console.log("Fetching profile from public.profiles...");
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (profileError) {
      console.error("Profile Fetch Error:", profileError.message);
    } else {
      console.log("Profile Fetch Success:", profile);
    }
  } catch (err) {
    console.error("Unexpected error:", err);
  }
}

test();
