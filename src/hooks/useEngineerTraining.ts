import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type TrainingRecord = {
  id?: string;
  engineer_id: string;
  name: string;
  date_from: string | null;
  date_to: string | null;
  company_trainer: string | null;
  has_exam: boolean;
  notes: string | null;
};

export function useEngineerTraining(engineerId: string | null) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: trainings = [], isLoading } = useQuery({
    queryKey: ['engineer-training', engineerId],
    queryFn: async () => {
      if (!engineerId) return [];
      const { data, error } = await (supabase
        .from('engineer_training' as any)
        .select('*')
        .eq('engineer_id', engineerId)
        .order('date_from', { ascending: false, nullsFirst: false }) as any);
      if (error) throw error;
      return (data || []) as TrainingRecord[];
    },
    enabled: !!engineerId,
    staleTime: 30_000,
  });

  const saveTrainings = async (engId: string, records: Omit<TrainingRecord, 'engineer_id'>[]) => {
    await (supabase.from('engineer_training' as any).delete().eq('engineer_id', engId) as any);
    if (records.length > 0) {
      const rows = records.map(r => ({
        engineer_id: engId,
        name: r.name,
        date_from: r.date_from || null,
        date_to: r.date_to || null,
        company_trainer: r.company_trainer || null,
        has_exam: r.has_exam,
        notes: r.notes || null,
      }));
      const { error } = await (supabase.from('engineer_training' as any).insert(rows) as any);
      if (error) throw error;
    }
    qc.invalidateQueries({ queryKey: ['engineer-training', engId] });
  };

  const bulkInsert = async (engId: string, records: Omit<TrainingRecord, 'engineer_id'>[]) => {
    if (records.length === 0) return;
    const rows = records.map(r => ({
      engineer_id: engId,
      name: r.name,
      date_from: r.date_from || null,
      date_to: r.date_to || null,
      company_trainer: r.company_trainer || null,
      has_exam: r.has_exam,
      notes: r.notes || null,
    }));
    const { error } = await (supabase.from('engineer_training' as any).insert(rows) as any);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ['engineer-training', engId] });
    toast({ title: `Importováno ${records.length} záznamů` });
  };

  return { trainings, isLoading, saveTrainings, bulkInsert };
}

export function useTrainingSearch() {
  return async (query: string): Promise<string[]> => {
    if (!query.trim()) return [];
    const { data, error } = await (supabase
      .from('engineer_training' as any)
      .select('engineer_id')
      .ilike('name', `%${query.trim()}%`) as any);
    if (error) return [];
    const ids = [...new Set((data || []).map((r: any) => r.engineer_id as string))];
    return ids;
  };
}
