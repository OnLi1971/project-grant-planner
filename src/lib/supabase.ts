import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://vkhyvziywciwlcehtaxw.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZraHl2eml5d2Npd2xjZWh0YXh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDgzNTYsImV4cCI6MjA3MDQ4NDM1Nn0.40nPN6fHLXKgJHbNtYWrGiV3VZQ3GG8kLeOqWd92wz0"

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