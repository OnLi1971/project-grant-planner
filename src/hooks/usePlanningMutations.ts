import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PlanningEntry, EngineerInfo } from '@/types/planning';
import { useToast } from '@/hooks/use-toast';

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
    projekt: string
  ): Promise<void> => {
    try {
      console.log('CLEAN_UPDATE_PROJECT:', { engineerId, konstrukter, cw, projekt });

      // Extract year from CW (e.g., "CW31-2025" → "CW31", 2025)
      const [cwBase, yearStr] = cw.includes('-') ? cw.split('-') : [cw, new Date().getFullYear().toString()];
      const year = parseInt(yearStr);

      // Single update using engineer_id only (no fallbacks)
      const { data, error } = await supabase
        .from('planning_entries')
        .update({ 
          projekt,
          updated_at: new Date().toISOString()
        })
        .eq('engineer_id', engineerId)
        .eq('cw', cwBase)
        .eq('year', year)
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
          return { ...entry, projekt: verifiedData.projekt };
        }
        return entry;
      }));

      toast({
        title: "Projekt aktualizován",
        description: `${konstrukter}: ${cw} → ${projekt}`,
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
    hours: number
  ): Promise<void> => {
    try {
      console.log('CLEAN_UPDATE_HOURS:', { engineerId, konstrukter, cw, hours });

      // Extract year from CW
      const [cwBase, yearStr] = cw.includes('-') ? cw.split('-') : [cw, new Date().getFullYear().toString()];
      const year = parseInt(yearStr);

      // Single update using engineer_id only (no fallbacks)
      const { data, error } = await supabase
        .from('planning_entries')
        .update({ 
          mh_tyden: hours,
          updated_at: new Date().toISOString()
        })
        .eq('engineer_id', engineerId)
        .eq('cw', cwBase)
        .eq('year', year)
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
          return { ...entry, mhTyden: verifiedData.mh_tyden };
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

  return {
    updatePlanningEntry,
    updatePlanningHours,
    findEngineerByName,
  };
}