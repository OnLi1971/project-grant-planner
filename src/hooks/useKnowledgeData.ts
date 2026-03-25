import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type KnowledgeItem = { id: string; name: string; created_at: string };
type KnowledgeTable = 'knowledge_software' | 'knowledge_pdm_plm' | 'knowledge_specialization';
type JunctionTable = 'engineer_software' | 'engineer_pdm_plm' | 'engineer_specialization';
type JunctionFkColumn = 'software_id' | 'pdm_plm_id' | 'specialization_id';

const TABLE_CONFIG: Record<KnowledgeTable, { junction: JunctionTable; fk: JunctionFkColumn }> = {
  knowledge_software: { junction: 'engineer_software', fk: 'software_id' },
  knowledge_pdm_plm: { junction: 'engineer_pdm_plm', fk: 'pdm_plm_id' },
  knowledge_specialization: { junction: 'engineer_specialization', fk: 'specialization_id' },
};

export function useKnowledgeList(table: KnowledgeTable) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const qk = ['knowledge', table];

  const { data = [], isLoading } = useQuery({
    queryKey: qk,
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select('*').order('name');
      if (error) throw error;
      return data as KnowledgeItem[];
    },
    staleTime: 120_000,
  });

  const addItem = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from(table).insert({ name: name.trim() });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk }); toast({ title: 'Přidáno' }); },
    onError: (e: Error) => { toast({ title: 'Chyba', description: e.message, variant: 'destructive' }); },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from(table).update({ name: name.trim() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk }); toast({ title: 'Upraveno' }); },
    onError: (e: Error) => { toast({ title: 'Chyba', description: e.message, variant: 'destructive' }); },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk }); toast({ title: 'Smazáno' }); },
    onError: (e: Error) => { toast({ title: 'Chyba', description: e.message, variant: 'destructive' }); },
  });

  return { items: data, isLoading, addItem, updateItem, deleteItem };
}

export function useEngineerKnowledge(engineerId: string | null) {
  const qc = useQueryClient();

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['engineer-knowledge', engineerId],
    queryFn: async () => {
      if (!engineerId) return { software: [], pdmPlm: [], specialization: [] };

      const [sw, pdm, spec] = await Promise.all([
        supabase.from('engineer_software').select('software_id').eq('engineer_id', engineerId),
        supabase.from('engineer_pdm_plm').select('pdm_plm_id').eq('engineer_id', engineerId),
        supabase.from('engineer_specialization').select('specialization_id').eq('engineer_id', engineerId),
      ]);

      return {
        software: (sw.data || []).map(r => r.software_id),
        pdmPlm: (pdm.data || []).map(r => r.pdm_plm_id),
        specialization: (spec.data || []).map(r => r.specialization_id),
      };
    },
    enabled: !!engineerId,
    staleTime: 30_000,
  });

  const saveAssignments = async (
    engId: string,
    softwareIds: string[],
    pdmPlmIds: string[],
    specializationIds: string[]
  ) => {
    // Delete old, insert new for each category
    await Promise.all([
      (async () => {
        await supabase.from('engineer_software').delete().eq('engineer_id', engId);
        if (softwareIds.length > 0) {
          const { error } = await supabase.from('engineer_software').insert(
            softwareIds.map(id => ({ engineer_id: engId, software_id: id }))
          );
          if (error) throw error;
        }
      })(),
      (async () => {
        await supabase.from('engineer_pdm_plm').delete().eq('engineer_id', engId);
        if (pdmPlmIds.length > 0) {
          const { error } = await supabase.from('engineer_pdm_plm').insert(
            pdmPlmIds.map(id => ({ engineer_id: engId, pdm_plm_id: id }))
          );
          if (error) throw error;
        }
      })(),
      (async () => {
        await supabase.from('engineer_specialization').delete().eq('engineer_id', engId);
        if (specializationIds.length > 0) {
          const { error } = await supabase.from('engineer_specialization').insert(
            specializationIds.map(id => ({ engineer_id: engId, specialization_id: id }))
          );
          if (error) throw error;
        }
      })(),
    ]);

    qc.invalidateQueries({ queryKey: ['engineer-knowledge', engId] });
  };

  return {
    assignments: assignments || { software: [], pdmPlm: [], specialization: [] },
    isLoading,
    saveAssignments,
  };
}
