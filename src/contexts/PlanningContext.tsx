import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PlanningEntry, PlanningContextType } from '@/types/planning';
import { usePlanningData } from '@/hooks/usePlanningData';
import { usePlanningMutations } from '@/hooks/usePlanningMutations';
import { normalizeName } from '@/utils/nameNormalization';

const PlanningContext = createContext<PlanningContextType | undefined>(undefined);

export const usePlanning = () => {
  const context = useContext(PlanningContext);
  if (!context) {
    throw new Error('usePlanning must be used within a PlanningProvider');
  }
  return context;
};

export const PlanningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { planningData, engineers, setPlanningData, loadPlanningData } = usePlanningData();
  const { updatePlanningEntry: updateEntry, updatePlanningHours: updateHours } = usePlanningMutations({ setPlanningData, engineers });

  // Initial data load
  useEffect(() => {
    loadPlanningData();
  }, [loadPlanningData]);

  // Realtime subscription for live updates
  useEffect(() => {
    const subscription = supabase
      .channel('planning_entries_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'planning_entries' },
        () => {
          loadPlanningData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [loadPlanningData]);

  // Wrapper functions to maintain backwards compatibility
  const updatePlanningEntry = useCallback(async (konstrukter: string, cw: string, projekt: string, isTentative?: boolean) => {
    // Find engineer_id from konstrukter name using normalization to handle diacritics
    const normalizedKonstrukter = normalizeName(konstrukter);
    const engineer = engineers.find(e => 
      normalizeName(e.display_name) === normalizedKonstrukter || 
      e.slug === normalizedKonstrukter
    );
    
    if (!engineer) {
      console.error('Engineer not found:', konstrukter, 'normalized:', normalizedKonstrukter);
      console.log('Available engineers:', engineers.map(e => ({ name: e.display_name, slug: e.slug })));
      throw new Error(`Engineer not found: ${konstrukter}`);
    }
    
    await updateEntry(engineer.id, konstrukter, cw, projekt, isTentative);
  }, [updateEntry, engineers]);

  const updatePlanningHours = useCallback(async (konstrukter: string, cw: string, hours: number) => {
    // Find engineer_id from konstrukter name using normalization to handle diacritics
    const normalizedKonstrukter = normalizeName(konstrukter);
    const engineer = engineers.find(e => 
      normalizeName(e.display_name) === normalizedKonstrukter || 
      e.slug === normalizedKonstrukter
    );
    
    if (!engineer) {
      console.error('Engineer not found:', konstrukter, 'normalized:', normalizedKonstrukter);
      throw new Error(`Engineer not found: ${konstrukter}`);
    }
    
    await updateHours(engineer.id, konstrukter, cw, hours);
  }, [updateHours, engineers]);

  return (
    <PlanningContext.Provider
      value={{
        planningData,
        engineers,
        updatePlanningEntry,
        updatePlanningHours
      }}
    >
      {children}
    </PlanningContext.Provider>
  );
};