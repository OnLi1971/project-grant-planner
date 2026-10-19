import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { MonthlyDemand } from '@/utils/projectDemand';

/** Monthly hour demand per project (generic resources plan from Project Management). */
export function useProjectMonthlyPlan() {
  return useQuery({
    queryKey: ['project-monthly-plan'],
    queryFn: async (): Promise<MonthlyDemand[]> => {
      const [{ data, error }, projects] = await Promise.all([
        supabase.from('project_monthly_plan').select('project_id, month, hours'),
        supabase.from('projects').select('id, code'),
      ]);
      if (error) throw error;
      if (projects.error) throw projects.error;
      const codeById = new Map(projects.data.map(p => [p.id, p.code]));
      return (data || [])
        .map(row => ({ projectCode: codeById.get(row.project_id) || '', month: row.month.slice(0, 7), hours: row.hours }))
        .filter(row => row.projectCode);
    },
    staleTime: 0,
  });
}
