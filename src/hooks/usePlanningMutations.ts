import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PlanningEntry } from '@/types/planning';
import { useToast } from '@/hooks/use-toast';

interface UsePlanningMutationsProps {
  setPlanningData: React.Dispatch<React.SetStateAction<PlanningEntry[]>>;
}

export function usePlanningMutations({ setPlanningData }: UsePlanningMutationsProps) {
  const { toast } = useToast();

  const findEngineerIdByName = useCallback(async (konstrukter: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('engineers')
        .select('id')
        .eq('display_name', konstrukter)
        .eq('status', 'active')
        .maybeSingle();

      if (error || !data) {
        console.warn(`Engineer not found for name: ${konstrukter}`);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error finding engineer:', error);
      return null;
    }
  }, []);

  const updatePlanningEntry = useCallback(async (
    engineerId: string, 
    konstrukter: string, 
    cw: string, 
    projekt: string
  ) => {
    try {
      // Optimistically update local state
      setPlanningData(prev => 
        prev.map(entry => {
          const sameRow = (entry.engineer_id === engineerId || entry.konstrukter === konstrukter) && entry.cw === cw;
          return sameRow ? { ...entry, projekt: projekt } : entry;
        })
      );

      // Parse CW and year
      let cwBase: string, year: number;
      
      if (cw.includes('-')) {
        [cwBase,] = cw.split('-');
        const yearPart = cw.split('-')[1];
        year = parseInt(yearPart);
      } else {
        cwBase = cw;
        year = 2026; // Default for entries without explicit year
      }

      // Ensure we have engineer_id
      let finalEngineerId = engineerId;
      if (!finalEngineerId) {
        finalEngineerId = await findEngineerIdByName(konstrukter);
        if (!finalEngineerId) {
          throw new Error(`Engineer not found: ${konstrukter}`);
        }
      }

      // Try by engineer_id first
      const { data: existingByEng, error: selectByEngErr } = await supabase
        .from('planning_entries')
        .select('id')
        .eq('engineer_id', finalEngineerId)
        .eq('cw', cwBase)
        .eq('year', year)
        .maybeSingle();

      if (selectByEngErr) {
        console.warn('Select by engineer_id failed, will try by konstrukter:', selectByEngErr.message);
      }

      if (existingByEng) {
        const { error } = await supabase
          .from('planning_entries')
          .update({ projekt: projekt })
          .eq('id', existingByEng.id);
        if (error) throw new Error('Failed to update planning entry');
      } else {
        // Fallback: find by konstrukter (legacy rows)
        const { data: existingByName } = await supabase
          .from('planning_entries')
          .select('id')
          .eq('konstrukter', konstrukter)
          .eq('cw', cwBase)
          .eq('year', year)
          .maybeSingle();

        if (existingByName) {
          const { error } = await supabase
            .from('planning_entries')
            .update({ projekt: projekt, engineer_id: finalEngineerId })
            .eq('id', existingByName.id);
          if (error) throw new Error('Failed to update legacy planning entry');
        } else {
          // Create new entry
          const cwNum = parseInt(cwBase.replace('CW', ''));
          let mesic: string;
          
          if (year === 2025) {
            if (cwNum <= 35) mesic = 'srpen 2025';
            else if (cwNum <= 39) mesic = 'září 2025';
            else if (cwNum <= 43) mesic = 'říjen 2025';
            else if (cwNum <= 47) mesic = 'listopad 2025';
            else mesic = 'prosinec 2025';
          } else { // 2026
            if (cwNum <= 5) mesic = 'leden 2026';
            else if (cwNum <= 9) mesic = 'únor 2026';  
            else if (cwNum <= 13) mesic = 'březen 2026';
            else if (cwNum <= 17) mesic = 'duben 2026';
            else if (cwNum <= 22) mesic = 'květen 2026';
            else if (cwNum <= 26) mesic = 'červen 2026';
            else if (cwNum <= 30) mesic = 'červenec 2026';
            else if (cwNum <= 35) mesic = 'srpen 2026';
            else if (cwNum <= 39) mesic = 'září 2026';
            else if (cwNum <= 43) mesic = 'říjen 2026';
            else if (cwNum <= 47) mesic = 'listopad 2026';
            else mesic = 'prosinec 2026';
          }

          const newEntry: any = {
            engineer_id: finalEngineerId,
            konstrukter,
            cw: cwBase,
            year,
            mesic,
            projekt: projekt,
            mh_tyden: 36,
          };

          const { error: insertError } = await supabase
            .from('planning_entries')
            .insert(newEntry);

          if (insertError) throw new Error('Failed to create new planning entry');
        }
      }

      toast({
        title: "Změna uložena",
        description: `Hodnota byla úspěšně aktualizována.`,
      });

    } catch (error: any) {
      console.error('Error in updatePlanningEntry:', error);
      toast({
        title: "Chyba při ukládání",
        description: error.message || "Nepodařilo se uložit změnu.",
        variant: "destructive",
      });
      
      // Revert optimistic update on error (no-op; realtime will resync)
    }
  }, [toast, setPlanningData, findEngineerIdByName]);

  const updatePlanningHours = useCallback(async (
    engineerId: string,
    konstrukter: string, 
    cw: string, 
    hours: number
  ) => {
    try {
      // Optimistically update local state
      setPlanningData(prev => 
        prev.map(entry => {
          const sameRow = (entry.engineer_id === engineerId || entry.konstrukter === konstrukter) && entry.cw === cw;
          return sameRow ? { ...entry, mhTyden: hours } : entry;
        })
      );

      // Parse CW and year
      let cwBase: string, year: number;
      
      if (cw.includes('-')) {
        [cwBase,] = cw.split('-');
        const yearPart = cw.split('-')[1];
        year = parseInt(yearPart);
      } else {
        cwBase = cw;
        year = 2026;
      }

      // Ensure we have engineer_id
      let finalEngineerId = engineerId;
      if (!finalEngineerId) {
        finalEngineerId = await findEngineerIdByName(konstrukter);
        if (!finalEngineerId) {
          throw new Error(`Engineer not found: ${konstrukter}`);
        }
      }

      // Check for existing entry
      const { data: existingData, error: selectError } = await supabase
        .from('planning_entries')
        .select('*')
        .eq('engineer_id', finalEngineerId)
        .eq('cw', cwBase)
        .eq('year', year)
        .maybeSingle();

      if (selectError) {
        throw new Error('Failed to check existing entry');
      }

      if (existingData) {
        // Update existing entry
        const { error } = await supabase
          .from('planning_entries')
          .update({ mh_tyden: hours })
          .eq('engineer_id', finalEngineerId)
          .eq('cw', cwBase)
          .eq('year', year);

        if (error) {
          throw new Error('Failed to update planning hours');
        }
      } else {
        // Create new entry with hours
        const cwNum = parseInt(cwBase.replace('CW', ''));
        let mesic: string;
        
        if (year === 2025) {
          if (cwNum <= 35) mesic = 'srpen 2025';
          else if (cwNum <= 39) mesic = 'září 2025';
          else if (cwNum <= 43) mesic = 'říjen 2025';
          else if (cwNum <= 47) mesic = 'listopad 2025';
          else mesic = 'prosinec 2025';
        } else { // 2026
          if (cwNum <= 5) mesic = 'leden 2026';
          else if (cwNum <= 9) mesic = 'únor 2026';  
          else if (cwNum <= 13) mesic = 'březen 2026';
          else if (cwNum <= 17) mesic = 'duben 2026';
          else if (cwNum <= 22) mesic = 'květen 2026';
          else if (cwNum <= 26) mesic = 'červen 2026';
          else if (cwNum <= 30) mesic = 'červenec 2026';
          else if (cwNum <= 35) mesic = 'srpen 2026';
          else if (cwNum <= 39) mesic = 'září 2026';
          else if (cwNum <= 43) mesic = 'říjen 2026';
          else if (cwNum <= 47) mesic = 'listopad 2026';
          else mesic = 'prosinec 2026';
        }

        const newEntry: any = {
          engineer_id: finalEngineerId,
          konstrukter,
          cw: cwBase,
          year,
          mesic,
          projekt: 'FREE',
          mh_tyden: hours,
        };

        const { error: insertError } = await supabase
          .from('planning_entries')
          .insert(newEntry);

        if (insertError) {
          throw new Error('Failed to create new planning entry with hours');
        }
      }

      toast({
        title: "Hodiny uloženy",
        description: `Hodiny byly úspěšně aktualizovány na ${hours}h.`,
      });

    } catch (error: any) {
      console.error('Error in updatePlanningHours:', error);
      toast({
        title: "Chyba při ukládání hodin",
        description: error.message || "Nepodařilo se uložit změnu hodin.",
        variant: "destructive",
      });
    }
  }, [toast, setPlanningData, findEngineerIdByName]);

  return {
    updatePlanningEntry,
    updatePlanningHours,
  };
}