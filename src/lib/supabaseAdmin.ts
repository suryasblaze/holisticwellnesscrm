import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Supabase URL is not defined in environment variables. Please set NEXT_PUBLIC_SUPABASE_URL.');
}
if (!supabaseServiceRoleKey) {
  throw new Error('Supabase Service Role Key is not defined in environment variables. Please set SUPABASE_SERVICE_ROLE_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    // It's generally recommended to disable auto-refreshing a session on the admin client
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
}); 