import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type EngineerProfile = {
  engineer: any;
  software: string[];
  pdmPlm: string[];
  specializations: {
    oblast: string;
    specialization: string;
    level: string;
    granted_date: string | null;
  }[];
  trainings: {
    id: string;
    name: string;
    date_from: string | null;
    date_to: string | null;
    company_trainer: string | null;
    has_exam: boolean;
    notes: string | null;
  }[];
  planning: {
    cw: string;
    projekt: string | null;
    mh_tyden: number | null;
    is_tentative: boolean;
    mesic: string;
  }[];
};

export function useEngineerProfile(id: string | undefined) {
  return useQuery({
    queryKey: ['engineer-profile', id],
    queryFn: async (): Promise<EngineerProfile> => {
      if (!id) throw new Error('No engineer ID');

      const currentYear = new Date().getFullYear();

      const [engRes, swRes, pdmRes, specRes, trainRes, planRes] = await Promise.all([
        supabase.from('engineers').select('*').eq('id', id).single(),
        supabase.from('engineer_software').select('software_id, level, knowledge_software(name)').eq('engineer_id', id),
        supabase.from('engineer_pdm_plm').select('pdm_plm_id, level, knowledge_pdm_plm(name)').eq('engineer_id', id),
        supabase.from('engineer_specialization')
          .select('level, granted_date, knowledge_specialization(name), knowledge_oblast(name)')
          .eq('engineer_id', id),
        (supabase.from('engineer_training' as any).select('*').eq('engineer_id', id).order('date_from', { ascending: false }) as any),
        supabase.from('planning_entries').select('cw, projekt, mh_tyden, is_tentative, mesic')
          .eq('engineer_id', id)
          .gte('year', currentYear)
          .order('cw', { ascending: true }),
      ]);

      if (engRes.error) throw engRes.error;

      return {
        engineer: engRes.data,
        software: (swRes.data || []).map((r: any) => r.knowledge_software?.name).filter(Boolean),
        pdmPlm: (pdmRes.data || []).map((r: any) => r.knowledge_pdm_plm?.name).filter(Boolean),
        specializations: (specRes.data || []).map((r: any) => ({
          oblast: r.knowledge_oblast?.name || '',
          specialization: r.knowledge_specialization?.name || '',
          level: r.level,
          granted_date: r.granted_date,
        })),
        trainings: (trainRes.data || []) as EngineerProfile['trainings'],
        planning: ((planRes.data || []) as any[]).filter((p: any) => p.projekt && p.projekt !== 'FREE'),
      };
    },
    enabled: !!id,
    staleTime: 30_000,
  });
}
