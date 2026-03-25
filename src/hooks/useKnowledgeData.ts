import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type KnowledgeItem = { id: string; name: string; created_at: string; oblast_id?: string | null };
type KnowledgeTable = 'knowledge_software' | 'knowledge_pdm_plm' | 'knowledge_specialization' | 'knowledge_oblast';
type JunctionTable = 'engineer_software' | 'engineer_pdm_plm' | 'engineer_specialization';
type JunctionFkColumn = 'software_id' | 'pdm_plm_id' | 'specialization_id';

const TABLE_CONFIG: Record<'knowledge_software' | 'knowledge_pdm_plm', { junction: JunctionTable; fk: JunctionFkColumn }> = {
  knowledge_software: { junction: 'engineer_software', fk: 'software_id' },
  knowledge_pdm_plm: { junction: 'engineer_pdm_plm', fk: 'pdm_plm_id' },
};

export function useKnowledgeList(table: KnowledgeTable) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const qk = ['knowledge', table];

  const { data = [], isLoading } = useQuery({
    queryKey: qk,
    queryFn: async () => {
      const { data, error } = await (supabase.from(table as any).select('*').order('name') as any);
      if (error) throw error;
      return data as KnowledgeItem[];
    },
    staleTime: 120_000,
  });

  const addItem = useMutation({
    mutationFn: async (payload: string | { name: string; oblast_id?: string }) => {
      const insertData = typeof payload === 'string' ? { name: payload.trim() } : { name: payload.name.trim(), ...(payload.oblast_id ? { oblast_id: payload.oblast_id } : {}) };
      const { error } = await (supabase.from(table as any).insert(insertData) as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk }); toast({ title: 'Přidáno' }); },
    onError: (e: Error) => { toast({ title: 'Chyba', description: e.message, variant: 'destructive' }); },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, name, oblast_id }: { id: string; name: string; oblast_id?: string }) => {
      const updateData: any = { name: name.trim() };
      if (oblast_id !== undefined) updateData.oblast_id = oblast_id;
      const { error } = await (supabase.from(table as any).update(updateData).eq('id', id) as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk }); toast({ title: 'Upraveno' }); },
    onError: (e: Error) => { toast({ title: 'Chyba', description: e.message, variant: 'destructive' }); },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from(table as any).delete().eq('id', id) as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk }); toast({ title: 'Smazáno' }); },
    onError: (e: Error) => { toast({ title: 'Chyba', description: e.message, variant: 'destructive' }); },
  });

  return { items: data, isLoading, addItem, updateItem, deleteItem };
}

export type SpecializationAssignment = {
  id?: string;
  oblast_id: string;
  specialization_id: string;
  level: string;
  granted_date: string | null;
};

export function useEngineerKnowledge(engineerId: string | null) {
  const qc = useQueryClient();

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['engineer-knowledge', engineerId],
    queryFn: async () => {
      if (!engineerId) return { software: [], pdmPlm: [], specializations: [] };

      const [sw, pdm, spec] = await Promise.all([
        supabase.from('engineer_software').select('software_id').eq('engineer_id', engineerId),
        supabase.from('engineer_pdm_plm').select('pdm_plm_id').eq('engineer_id', engineerId),
        supabase.from('engineer_specialization').select('id, oblast_id, specialization_id, level, granted_date').eq('engineer_id', engineerId),
      ]);

      return {
        software: (sw.data || []).map(r => r.software_id),
        pdmPlm: (pdm.data || []).map(r => r.pdm_plm_id),
        specializations: (spec.data || []).map(r => ({
          id: r.id,
          oblast_id: r.oblast_id,
          specialization_id: r.specialization_id,
          level: r.level,
          granted_date: r.granted_date,
        })) as SpecializationAssignment[],
      };
    },
    enabled: !!engineerId,
    staleTime: 30_000,
  });

  const saveAssignments = async (
    engId: string,
    softwareIds: string[],
    pdmPlmIds: string[],
    specializations: SpecializationAssignment[]
  ) => {
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
        if (specializations.length > 0) {
          const sanitized = specializations.map(s => {
            let grantedDate = s.granted_date || null;
            if (grantedDate) {
              const year = parseInt(grantedDate.split('-')[0], 10);
              if (isNaN(year) || year < 1900 || year > 2100) {
                console.warn(`Invalid granted_date year: ${grantedDate}, setting to null`);
                grantedDate = null;
              }
            }
            return {
              engineer_id: engId,
              oblast_id: s.oblast_id,
              specialization_id: s.specialization_id,
              level: s.level,
              granted_date: grantedDate,
            };
          });
          const { error } = await supabase.from('engineer_specialization').insert(sanitized);
          if (error) throw error;
        }
      })(),
    ]);

    qc.invalidateQueries({ queryKey: ['engineer-knowledge', engId] });
  };

  return {
    assignments: assignments || { software: [], pdmPlm: [], specializations: [] },
    isLoading,
    saveAssignments,
  };
}
