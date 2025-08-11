import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

// Create client only if configured, otherwise use null
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Show warning if not configured
if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase not configured. Using localStorage fallback. Click the green Supabase button to connect your database.');
}

// Database types
export interface PlanningEntry {
  id?: string
  konstrukter: string
  cw: string
  mesic: string
  mh_tyden: number
  projekt: string
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
}

export interface Profile {
  id: string
  email: string
  full_name?: string
  role: 'admin' | 'editor' | 'viewer'
  created_at: string
  updated_at: string
}