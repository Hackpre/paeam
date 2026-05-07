import { createClient } from '@supabase/supabase-js';

// These are fallback values - you should replace with your actual Supabase keys
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);