import { supabase } from '@/integrations/supabase/client';
import type { EngineerStatus } from '@/constants/statuses';

export type DatabaseEngineer = {
  id: string;
  display_name: string;
  slug: string;
  email?: string;
  status: 'active' | 'inactive' | 'contractor' | 'on_leave';
  fte_percent: number;
  department_id?: string;
  manager_id?: string;
  company: string;
  hourly_rate?: number;
  currency?: 'EUR' | 'CZK';
  created_at: string;
  updated_at: string;
};

export async function fetchEngineers(statuses: readonly EngineerStatus[]): Promise<DatabaseEngineer[]> {
  const { data, error } = await supabase
    .from('engineers')
    .select('*')
    .in('status', statuses as string[])
    .order('display_name');

  if (error) throw new Error(error.message);
  return (data || []) as DatabaseEngineer[];
}
