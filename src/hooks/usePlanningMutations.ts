import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PlanningEntry, EngineerInfo } from '@/types/planning';
import { useToast } from '@/hooks/use-toast';
import { getISOWeekMonday } from '@/utils/workingDays';
import { format } from 'date-fns';

const CZECH_MONTHS = [
  'leden', 'únor', 'březen', 'duben', 'květen', 'červen',
  'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'
];

// Helper pro sestavení řádku pro upsert (vytvoří záznam i pro roky bez dat, např. 2027)
const buildUpsertRow = (
  engineerId: string,
  konstrukter: string,
  cwBase: string,
  year: number,
  fields: Record<string, unknown>
) => {
  const cwNumber = parseInt(cwBase.replace('CW', ''), 10);
  const monday = getISOWeekMonday(cwNumber, year);
  const mesic = `${CZECH_MONTHS[monday.getMonth()]} ${monday.getFullYear()}`;
  return {
    engineer_id: engineerId,
    konstrukter,
    cw: cwBase,
    year,
    mesic,
    week_monday: format(monday, 'yyyy-MM-dd'),
    ...fields,
    updated_at: new Date().toISOString(),
  };
};

interface UsePlanningMutationsProps {
  setPlanningData: React.Dispatch<React.SetStateAction<PlanningEntry[]>>;
  engineers: EngineerInfo[];
}

export function usePlanningMutations({ setPlanningData, engineers }: UsePlanningMutationsProps) {
  const { toast } = useToast();

  // Helper to find engineer by name from local data (no DB lookup needed)
  const findEngineerByName = useCallback((displayName: string): EngineerInfo | null => {
    return engineers.find(e => e.display_name === displayName) || null;
  }, [engineers]);

  // Single-row verification after update
  const verifyUpdate = useCallback(async (
    engineerId: string, 
    cw: string, 
    year: number, 
    expectedProject?: string, 
    expectedHours?: number
  ) => {
    const { data, error } = await supabase
      .from('planning_entries')
      .select('engineer_id, cw, year, projekt, mh_tyden, updated_at')
      .eq('engineer_id', engineerId)
      .eq('cw', cw)
      .eq('year', year)
      .single();

    if (error) throw new Error(`Failed to verify update: ${error.message}`);
    
    if (expectedProject && data.projekt !== expectedProject) {
      throw new Error('Update verification failed - project mismatch');
    }
    
    if (expectedHours !== undefined && data.mh_tyden !== expectedHours) {
      throw new Error('Update verification failed - hours mismatch');  
    }

    return data;
  }, []);

  // Update planning entry (project assignment) - CLEAN: only engineer_id
  const updatePlanningEntry = useCallback(async (
    engineerId: string,
    konstrukter: string,
    cw: string, 
    projekt: string,
    isTentative?: boolean
  ): Promise<void> => {
    try {
      console.log('CLEAN_UPDATE_PROJECT:', { engineerId, konstrukter, cw, projekt, isTentative });

      // Extract year from CW (e.g., "CW31-2025" → "CW31", 2025)
      const [cwBase, yearStr] = cw.includes('-') ? cw.split('-') : [cw, new Date().getFullYear().toString()];
      const year = parseInt(yearStr);

      // Upsert using engineer_id (vytvoří záznam i když pro daný rok ještě neexistuje, např. 2027)
      const { data, error } = await supabase
        .from('planning_entries')
        .upsert(
          buildUpsertRow(engineerId, konstrukter, cwBase, year, {
            projekt,
            is_tentative: isTentative ?? false,
          }),
          { onConflict: 'engineer_id,cw,year' }
        )
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error(`No planning entry found for engineer ${konstrukter}, ${cw}, year ${year}`);
      }

      // Single-row verification (source of truth)
      const verifiedData = await verifyUpdate(engineerId, cwBase, year, projekt);
      console.log('VERIFIED_PROJECT_UPDATE:', verifiedData);

      // Targeted UI patch using primary key (engineer_id, cw, year)
      // Note: entry.cw includes year (e.g., "CW31-2025"), cw parameter includes year too
      setPlanningData(prev => prev.map(entry => {
        // Match by engineer_id and cw (both include year format)
        if (entry.engineer_id === engineerId && entry.cw === cw) {
          return { ...entry, projekt: verifiedData.projekt, is_tentative: isTentative ?? false };
        }
        return entry;
      }));

      toast({
        title: "Projekt aktualizován",
        description: `${konstrukter}: ${cw} → ${projekt}${isTentative ? ' (předběžná rezervace)' : ''}`,
      });

    } catch (error) {
      console.error('Error updating planning project:', error);
      toast({
        title: "Chyba při ukládání",
        description: error instanceof Error ? error.message : "Neočekávaná chyba",
        variant: "destructive",
      });
    }
  }, [setPlanningData, toast, verifyUpdate]);

  // Update planning hours - CLEAN: only engineer_id
  const updatePlanningHours = useCallback(async (
    engineerId: string,
    konstrukter: string,
    cw: string,
    hours: number,
    leaveDays?: number
  ): Promise<void> => {
    try {
      console.log('CLEAN_UPDATE_HOURS:', { engineerId, konstrukter, cw, hours, leaveDays });

      // Extract year from CW
      const [cwBase, yearStr] = cw.includes('-') ? cw.split('-') : [cw, new Date().getFullYear().toString()];
      const year = parseInt(yearStr);

      // Upsert using engineer_id (vytvoří záznam i když pro daný rok ještě neexistuje, např. 2027)
      const { data, error } = await supabase
        .from('planning_entries')
        .upsert(
          buildUpsertRow(engineerId, konstrukter, cwBase, year, {
            mh_tyden: hours,
            ...(leaveDays !== undefined ? { leave_days: leaveDays } : {}),
          }),
          { onConflict: 'engineer_id,cw,year' }
        )
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error(`No planning entry found for engineer ${konstrukter}, ${cw}, year ${year}`);
      }

      // Single-row verification (source of truth)
      const verifiedData = await verifyUpdate(engineerId, cwBase, year, undefined, hours);
      console.log('VERIFIED_HOURS_UPDATE:', verifiedData);

      // Targeted UI patch using primary key (engineer_id, cw, year)
      // Note: entry.cw includes year (e.g., "CW31-2025"), cw parameter includes year too
      setPlanningData(prev => prev.map(entry => {
        // Match by engineer_id and cw (both include year format)
        if (entry.engineer_id === engineerId && entry.cw === cw) {
          return { ...entry, mhTyden: verifiedData.mh_tyden, ...(leaveDays !== undefined ? { leaveDays } : {}) };
        }
        return entry;
      }));

      toast({
        title: "Hodiny aktualizovány",
        description: `${konstrukter}: ${cw} → ${hours}h`,
      });

    } catch (error) {
      console.error('Error updating planning hours:', error);
      toast({
        title: "Chyba při ukládání hodin",
        description: error instanceof Error ? error.message : "Neočekávaná chyba",
        variant: "destructive",
      });
    }
  }, [setPlanningData, toast, verifyUpdate]);

  // Update second project of the week (split week)
  const updatePlanningSecondary = useCallback(async (
    engineerId: string,
    konstrukter: string,
    cw: string,
    projekt2: string | null,
    hours2: number,
    isTentative2?: boolean
  ): Promise<void> => {
    try {
      const [cwBase, yearStr] = cw.includes('-') ? cw.split('-') : [cw, new Date().getFullYear().toString()];
      const year = parseInt(yearStr);

      const { error } = await supabase
        .from('planning_entries')
        .upsert(
          buildUpsertRow(engineerId, konstrukter, cwBase, year, {
            projekt_2: projekt2,
            mh_tyden_2: projekt2 ? hours2 : 0,
            is_tentative_2: projekt2 ? (isTentative2 ?? false) : false,
          }),
          { onConflict: 'engineer_id,cw,year' }
        )
        .select();

      if (error) throw error;

      setPlanningData(prev => prev.map(entry => {
        if (entry.engineer_id === engineerId && entry.cw === cw && !entry.isSecondary) {
          return {
            ...entry,
            projekt2: projekt2,
            mhTyden2: projekt2 ? hours2 : 0,
            is_tentative2: projekt2 ? (isTentative2 ?? false) : false,
          };
        }
        return entry;
      }));

      toast({
        title: projekt2 ? "Druhý projekt uložen" : "Druhý projekt odebrán",
        description: projekt2 ? `${konstrukter}: ${cw} → ${projekt2} ${hours2}h` : `${konstrukter}: ${cw}`,
      });
    } catch (error) {
      console.error('Error updating secondary project:', error);
      toast({
        title: "Chyba při ukládání druhého projektu",
        description: error instanceof Error ? error.message : "Neočekávaná chyba",
        variant: "destructive",
      });
    }
  }, [setPlanningData, toast]);

  return {
    updatePlanningEntry,
    updatePlanningHours,
    updatePlanningSecondary,
    findEngineerByName,
  };

}