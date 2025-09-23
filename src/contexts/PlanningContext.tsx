import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PlanningEntry, PlanningContextType } from '@/types/planning';
import { usePlanningData } from '@/hooks/usePlanningData';
import { usePlanningMutations } from '@/hooks/usePlanningMutations';

const PlanningContext = createContext<PlanningContextType | undefined>(undefined);

export const usePlanning = () => {
  const context = useContext(PlanningContext);
  if (!context) {
    throw new Error('usePlanning must be used within a PlanningProvider');
  }
  return context;
};

export const PlanningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { planningData, engineers, setPlanningData, loadPlanningData, fetchTimeline, fetchTimelineRef } = usePlanningData();
  const { updatePlanningEntry: updateEntry, updatePlanningHours: updateHours } = usePlanningMutations({ setPlanningData });
  
  const [isRealtimeEnabled, setIsRealtimeEnabled] = React.useState(true);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const DEBOUNCE_MS = 200;

  // Debug log engineers state
  React.useEffect(() => {
    console.log('Engineers state updated in PlanningProvider:', engineers?.length, 'engineers');
    if (engineers?.length > 0) {
      console.log('First engineer:', engineers[0]);
    }
  }, [engineers]);

  // Initial data load
  useEffect(() => {
    loadPlanningData('initial');
  }, [loadPlanningData]);

  // Realtime subscription setup
  useEffect(() => {
    if (isRealtimeEnabled) {
      console.log('Setting up realtime subscription for planning_entries');
      
      const debouncedRealtimeHandler = (payload: any) => {
        console.log('Realtime change detected:', payload);
        
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        
        debounceTimeoutRef.current = setTimeout(() => {
          console.log(`Debounced realtime revalidation after ${DEBOUNCE_MS}ms`);
          loadPlanningData('realtime_debounced');
          debounceTimeoutRef.current = null;
        }, DEBOUNCE_MS);
      };

      const subscription = supabase
        .channel('planning_entries_changes_unique')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'planning_entries' },
          debouncedRealtimeHandler
        )
        .subscribe();

      console.log('Realtime subscription created with debouncing');

      return () => {
        console.log('Cleaning up realtime subscription');
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
          debounceTimeoutRef.current = null;
        }
        subscription.unsubscribe();
      };
    }
  }, [loadPlanningData, isRealtimeEnabled]);

  // Wrapper functions to maintain backwards compatibility
  const updatePlanningEntry = useCallback(async (konstrukter: string, cw: string, projekt: string) => {
    // Find engineer_id from konstrukter name
    const engineer = engineers.find(e => e.display_name === konstrukter);
    const engineerId = engineer?.id || '';
    await updateEntry(engineerId, konstrukter, cw, projekt);
  }, [updateEntry, engineers]);

  const updatePlanningHours = useCallback(async (konstrukter: string, cw: string, hours: number) => {
    // Find engineer_id from konstrukter name
    const engineer = engineers.find(e => e.display_name === konstrukter);
    const engineerId = engineer?.id || '';
    await updateHours(engineerId, konstrukter, cw, hours);
  }, [updateHours, engineers]);

  const disableRealtime = () => setIsRealtimeEnabled(false);
  const enableRealtime = () => setIsRealtimeEnabled(true);

  const manualRefetch = useCallback(() => {
    console.log('=== MANUAL REFETCH TRIGGERED ===');
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => {
      console.log(`Manual refetch coalesced via debounce (${DEBOUNCE_MS}ms)`);
      loadPlanningData('manual_refetch_debounced');
    }, DEBOUNCE_MS);
  }, [loadPlanningData]);

  const performStep1Test = useCallback(async () => {
    console.log('=== STEP 1 TEST: ISOLATION WITHOUT REALTIME ===');
    console.log('Current Realtime status:', isRealtimeEnabled ? 'ENABLED' : 'DISABLED');
    
    await updatePlanningEntry('Fuchs Pavel', 'CW31-2026', 'ST_BLAVA');
    
    setTimeout(() => {
      manualRefetch();
      
      setTimeout(() => {
        const fuchsCW31 = planningData.find(entry => 
          entry.konstrukter === 'Fuchs Pavel' && entry.cw === 'CW31-2026'
        );
        console.log('=== STEP 1 RESULTS ===');
        console.log('FINAL UI_CELL_VALUE:', fuchsCW31?.projekt || 'FREE');
        console.log('EVALUATION:', fuchsCW31?.projekt === 'ST_BLAVA' ? 'Realtime/race condition issue' : 'Mapping/filter issue');
      }, 1500);
    }, 1000);
  }, [updatePlanningEntry, manualRefetch, planningData, isRealtimeEnabled]);

  const checkWeekAxis = useCallback(() => {
    console.log('=== STEP 3: WEEK AXIS DIAGNOSTIC ===');
    const fuchsCW31 = planningData.find(entry => 
      entry.konstrukter === 'Fuchs Pavel' && entry.cw === 'CW31-2026'
    );
    console.log('MAPPING_KEY_SAMPLE = konstrukter: "Fuchs Pavel", cw: "CW31-2026"');
    console.log('Entry found:', !!fuchsCW31, 'Project:', fuchsCW31?.projekt);
    return {
      weekAxisHasCW31_2026: !!fuchsCW31,
      mappingKey: { konstrukter: 'Fuchs Pavel', cw: 'CW31-2026' }
    };
  }, [planningData]);

  return (
    <PlanningContext.Provider
      value={{
        planningData,
        engineers,
        updatePlanningEntry,
        updatePlanningHours,
        realtimeStatus: isRealtimeEnabled ? 'ENABLED' : 'DISABLED',
        disableRealtime,
        enableRealtime,
        manualRefetch,
        checkWeekAxis,
        performStep1Test,
        fetchTimeline,
        getCurrentTimeline: () => fetchTimelineRef.current
      }}
    >
      {children}
    </PlanningContext.Provider>
  );
};