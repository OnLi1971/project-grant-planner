import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

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