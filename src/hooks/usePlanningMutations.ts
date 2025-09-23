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
        .neq('status', 'inactive')
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
      console.log('UPDATE_INTENT:', { engineerId, konstrukter, cw, projekt });
      
      const [cwBase, yearStr] = cw.includes('-') ? cw.split('-') : [cw, new Date().getFullYear().toString()];
      const year = parseInt(yearStr);

      // Update existing entry - with trigger, entries should always exist
      // Primary update by engineer_id
      let { data: updateData, error: updateError } = await supabase
        .from('planning_entries')
        .update({ 
          projekt,
          updated_at: new Date().toISOString()
        })
        .eq('engineer_id', engineerId)
        .eq('cw', cwBase)
        .eq('year', year)
        .select('*');

      if (updateError) {
        console.error('Update error:', updateError);
        toast({
          title: "Chyba při ukládání",
          description: updateError.message,
          variant: "destructive",
        });
        return;
      }

      // Fallback: legacy rows may have NULL engineer_id but matching konstrukter
      if (!updateData || updateData.length === 0) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('planning_entries')
          .update({
            projekt,
            updated_at: new Date().toISOString(),
            engineer_id: engineerId
          })
          .is('engineer_id', null)
          .eq('konstrukter', konstrukter)
          .eq('cw', cwBase)
          .eq('year', year)
          .select('*');

        if (fallbackError) {
          console.error('Fallback update error:', fallbackError);
        } else {
          updateData = fallbackData;
        }
      }

      console.log('UPDATE successful (with possible fallback):', updateData);

      // FIX 1: Po UPDATE vždy potvrď pravdu cíleným dotazem
      const { data: verifyRow, error: verifyError } = await supabase
        .from('planning_entries')
        .select('engineer_id,cw,year,projekt,mh_tyden,updated_at')
        .eq('engineer_id', engineerId)
        .eq('cw', cwBase)          // POZOR: cw bez roku (např. 'CW31')
        .eq('year', year)          // rok zvlášť
        .maybeSingle();

      if (!verifyError && verifyRow) {
        console.log('SINGLE_ROW_VERIFY:', verifyRow);
        // FIX 2: Patchni přes primární klíč (engineer_id, cw, year), ne přes jméno/cw_full
        setPlanningData(prev => {
          const sameRow = (e: any) => e.engineer_id === verifyRow.engineer_id && 
                                      e.cw === `${verifyRow.cw}-${verifyRow.year}`;
          
          const exists = prev.some(sameRow);
          
          if (exists) {
            return prev.map(entry =>
              sameRow(entry)
                ? { ...entry, projekt: verifyRow.projekt, mhTyden: verifyRow.mh_tyden }
                : entry
            );
          } else {
            // Add new entry if not exists
            const newEntry: PlanningEntry = {
              engineer_id: verifyRow.engineer_id,
              konstrukter,
              cw: `${verifyRow.cw}-${verifyRow.year}`,
              mesic: new Date().toLocaleDateString('cs-CZ', { month: 'long' }),
              projekt: verifyRow.projekt,
              mhTyden: verifyRow.mh_tyden
            };
            return [...prev, newEntry];
          }
        });
      } else {
        console.warn('Single-row verify failed:', verifyError);
        // Fallback to optimistic update
        setPlanningData(prev => prev.map(entry => {
          const matchById = entry.engineer_id === engineerId && entry.cw === `${cwBase}-${year}`;
          const matchByNameLegacy = entry.engineer_id === null && entry.konstrukter === konstrukter && entry.cw === `${cwBase}-${year}`;
          return (matchById || matchByNameLegacy)
            ? { ...entry, projekt }
            : entry;
        }));
      }

      toast({
        title: "Projekt aktualizován",
        description: `${konstrukter}: ${cw} → ${projekt}`,
      });

    } catch (error) {
      console.error('Unexpected error in updatePlanningEntry:', error);
      toast({
        title: "Neočekávaná chyba",
        description: "Kontaktujte podporu",
        variant: "destructive",
      });
    }
  }, [setPlanningData]);

  const updatePlanningHours = useCallback(async (
    engineerId: string,
    konstrukter: string,
    cw: string,
    hours: number
  ) => {
    try {
      const [cwBase, yearStr] = cw.includes('-') ? cw.split('-') : [cw, new Date().getFullYear().toString()];
      const year = parseInt(yearStr);

      // Update existing entry - with trigger, entries should always exist  
      // Primary update by engineer_id
      let { data: updateData, error: updateError } = await supabase
        .from('planning_entries')
        .update({ 
          mh_tyden: hours,
          updated_at: new Date().toISOString()
        })
        .eq('engineer_id', engineerId)
        .eq('cw', cwBase)
        .eq('year', year)
        .select('*');

      if (updateError) {
        console.error('Update hours error:', updateError);
        toast({
          title: "Chyba při ukládání hodin",
          description: updateError.message,
          variant: "destructive",
        });
        return;
      }

      // Fallback: legacy rows may have NULL engineer_id but matching konstrukter
      if (!updateData || updateData.length === 0) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('planning_entries')
          .update({
            mh_tyden: hours,
            updated_at: new Date().toISOString(),
            engineer_id: engineerId
          })
          .is('engineer_id', null)
          .eq('konstrukter', konstrukter)
          .eq('cw', cwBase)
          .eq('year', year)
          .select('*');

        if (fallbackError) {
          console.error('Fallback update hours error:', fallbackError);
        } else {
          updateData = fallbackData;
        }
      }

      console.log('UPDATE hours successful (with possible fallback):', updateData);

      // FIX 1: Po UPDATE/INSERT vždy potvrď pravdu cíleným dotazem pro hodiny
      const { data: verifyRow, error: verifyError } = await supabase
        .from('planning_entries')
        .select('engineer_id,cw,year,projekt,mh_tyden,updated_at')
        .eq('engineer_id', engineerId)
        .eq('cw', cwBase)          // POZOR: cw bez roku (např. 'CW31')
        .eq('year', year)          // rok zvlášť
        .maybeSingle();

      if (!verifyError && verifyRow) {
        console.log('SINGLE_ROW_VERIFY_HOURS:', verifyRow);
        // FIX 2: Patchni přes primární klíč (engineer_id, cw, year), ne přes jméno/cw_full
        setPlanningData(prev => {
          const sameRow = (e: any) => e.engineer_id === verifyRow.engineer_id && 
                                      e.cw === `${verifyRow.cw}-${verifyRow.year}`;
          
          const exists = prev.some(sameRow);
          
          if (exists) {
            return prev.map(entry =>
              sameRow(entry)
                ? { ...entry, projekt: verifyRow.projekt, mhTyden: verifyRow.mh_tyden }
                : entry
            );
          } else {
            // Add new entry if not exists
            const newEntry: PlanningEntry = {
              engineer_id: verifyRow.engineer_id,
              konstrukter,
              cw: `${verifyRow.cw}-${verifyRow.year}`,
              mesic: new Date().toLocaleDateString('cs-CZ', { month: 'long' }),
              projekt: verifyRow.projekt,
              mhTyden: verifyRow.mh_tyden
            };
            return [...prev, newEntry];
          }
        });
      } else {
        console.warn('Single-row verify hours failed:', verifyError);
        // Fallback to optimistic update
        setPlanningData(prev => prev.map(entry =>
          entry.engineer_id === engineerId && entry.cw === `${cwBase}-${year}`
            ? { ...entry, mhTyden: hours }
            : entry
        ));
      }

      toast({
        title: "Hodiny aktualizovány",
        description: `${konstrukter}: ${cw} → ${hours}h`,
      });

    } catch (error) {
      console.error('Unexpected error in updatePlanningHours:', error);
      toast({
        title: "Neočekávaná chyba",
        description: "Kontaktujte podporu",
        variant: "destructive",
      });
    }
  }, [setPlanningData]);

  return {
    updatePlanningEntry,
    updatePlanningHours,
  };
}