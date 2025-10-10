import React, { createContext, useContext, useCallback, useEffect, useRef } from 'react';
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
  const { planningData, engineers, setPlanningData, loadPlanningData, loadEngineers, fetchTimeline, fetchTimelineRef } = usePlanningData();
  const { updatePlanningEntry: updateEntry, updatePlanningHours: updateHours } = usePlanningMutations({ setPlanningData, engineers });
  
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

  // Engineers are now loaded via React Query in usePlanningData -> useEngineers
  // No need for separate mount effect - data comes from cache

  // Initial data load
  useEffect(() => {
    console.log('PlanningProvider: Loading planning data...');
    loadPlanningData('initial');
  }, [loadPlanningData]);

  // FIX 4: Realtime jen "nakopává" – žádné paralelní refetch
  const debouncedRealtimeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const debouncedRealtime = useCallback(() => {
    if (debouncedRealtimeRef.current) {
      clearTimeout(debouncedRealtimeRef.current);
    }
    debouncedRealtimeRef.current = setTimeout(() => {
      console.log('Debounced realtime trigger - calling loadPlanningData');
      loadPlanningData('realtime');
    }, 250); // 250ms debounce
  }, [loadPlanningData]);

  // Realtime subscription setup
  useEffect(() => {
    if (isRealtimeEnabled) {
      console.log('Setting up realtime subscription for planning_entries');
      
      const subscription = supabase
        .channel('planning_entries_changes_unique')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'planning_entries' },
          (payload) => {
            console.log('Realtime change detected:', payload);
            // FIX 4: Use debounced handler instead of manual timeout
            debouncedRealtime();
          }
        )
        .subscribe();

      console.log('Realtime subscription created with debouncing');

      return () => {
        console.log('Cleaning up realtime subscription');
        if (debouncedRealtimeRef.current) {
          clearTimeout(debouncedRealtimeRef.current);
        }
        subscription.unsubscribe();
      };
    }
  }, [isRealtimeEnabled, debouncedRealtime]);

  // Wrapper functions to maintain backwards compatibility
  const updatePlanningEntry = useCallback(async (konstrukter: string, cw: string, projekt: string) => {
    // Find engineer_id from konstrukter name using normalization to handle diacritics
    const normalizedKonstrukter = normalizeName(konstrukter);
    const engineer = engineers.find(e => 
      normalizeName(e.display_name) === normalizedKonstrukter || 
      e.slug === normalizedKonstrukter
    );
    
    if (!engineer) {
      console.error('❌ Engineer not found:', {
        input: konstrukter,
        normalized: normalizedKonstrukter,
        availableEngineers: engineers.slice(0, 50).map(e => ({
          display_name: e.display_name,
          normalized: normalizeName(e.display_name),
          slug: e.slug,
          status: e.status
        }))
      });
      throw new Error(`Engineer not found: ${konstrukter}`);
    }
    
    console.log('✅ Engineer found:', { konstrukter, engineer_id: engineer.id, status: engineer.status });
    await updateEntry(engineer.id, konstrukter, cw, projekt);
  }, [updateEntry, engineers]);

  const updatePlanningHours = useCallback(async (konstrukter: string, cw: string, hours: number) => {
    // Find engineer_id from konstrukter name using normalization to handle diacritics
    const normalizedKonstrukter = normalizeName(konstrukter);
    const engineer = engineers.find(e => 
      normalizeName(e.display_name) === normalizedKonstrukter || 
      e.slug === normalizedKonstrukter
    );
    
    if (!engineer) {
      console.error('❌ Engineer not found:', {
        input: konstrukter,
        normalized: normalizedKonstrukter,
        availableEngineers: engineers.slice(0, 50).map(e => ({
          display_name: e.display_name,
          normalized: normalizeName(e.display_name),
          slug: e.slug,
          status: e.status
        }))
      });
      throw new Error(`Engineer not found: ${konstrukter}`);
    }
    
    console.log('✅ Engineer found:', { konstrukter, engineer_id: engineer.id, status: engineer.status });
    await updateHours(engineer.id, konstrukter, cw, hours);
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