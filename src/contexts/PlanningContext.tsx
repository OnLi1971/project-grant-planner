import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface PlanningEntry {
  konstrukter: string;
  cw: string;
  mesic: string;
  mhTyden?: number;
  projekt: string;
}

interface PlanningContextType {
  planningData: PlanningEntry[];
  updatePlanningEntry: (konstrukter: string, cw: string, projekt: string) => Promise<void>;
  realtimeStatus: string;
  disableRealtime: () => void;
  enableRealtime: () => void;
  manualRefetch: () => void;
  checkWeekAxis: () => any;
  performStep1Test: () => void;
  fetchTimeline: Array<{id: number, startAt: string, endAt?: string, applied: boolean, source: string}>;
  getCurrentTimeline: () => Array<{id: number, startAt: string, endAt?: string, applied: boolean, source: string}>;
}

const PlanningContext = createContext<PlanningContextType | undefined>(undefined);

export const usePlanning = () => {
  const context = useContext(PlanningContext);
  if (!context) {
    throw new Error('usePlanning must be used within a PlanningProvider');
  }
  return context;
};

export const PlanningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [planningData, setPlanningData] = useState<PlanningEntry[]>([]);
  const [isRealtimeEnabled, setIsRealtimeEnabled] = useState(true);
  
  // Step 2: Race condition protection
  const [requestId, setRequestId] = useState(0);
  const [fetchTimeline, setFetchTimeline] = useState<Array<{id: number, startAt: string, endAt?: string, applied: boolean, source: string}>>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchTimelineRef = useRef<Array<{id: number, startAt: string, endAt?: string, applied: boolean, source: string}>>([]);
  const currentFetchIdRef = useRef<number>(0);
  
  // Step 4: Single revalidation mechanism with debouncing
  const revalidationModeRef = useRef<'A' | 'B'>('B'); // B = Realtime only with debounce
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const DEBOUNCE_MS = 200;

  // Load data from Supabase using the new planning_matrix view
  const loadPlanningData = useCallback(async (source = 'manual') => {
      // Step 2: Abort previous request and increment requestId
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      const currentRequestId = Date.now(); // Use timestamp for unique ID
      
      const startAt = new Date().toISOString();
      const timelineEntry = { id: currentRequestId, startAt, applied: false, source };
      
      // Set current fetch id to guard against stale applies
      currentFetchIdRef.current = currentRequestId;
      
      // Update both state and ref
      setFetchTimeline(prev => {
        const newTimeline = [...prev.slice(-5), timelineEntry];
        fetchTimelineRef.current = newTimeline;
        return newTimeline;
      });
      
      console.log(`Starting fetch ${currentRequestId} from ${source}`);
      
      try {
        // Robust pagination to bypass 1000 row cap from PostgREST
        const pageSize = 1000;
        let page = 0;
        let allRows: any[] = [];
        while (true) {
          const from = page * pageSize;
          const to = from + pageSize - 1;
          const { data: batch, error: pageError } = await supabase
            .from('planning_matrix')
            .select('*')
            .order('konstrukter', { ascending: true })
            .order('year', { ascending: true })
            .order('cw_full', { ascending: true })
            .range(from, to);

          if (pageError) {
            throw pageError;
          }

          if (!batch || batch.length === 0) {
            break; // No more rows
          }

          allRows = allRows.concat(batch);
          page++;
        }

        const data = allRows;
        
        // Check if this response is stale by comparing with current abortController
        if (abortControllerRef.current.signal.aborted) {
          console.log(`Ignoring aborted response ${currentRequestId}`);
          setFetchTimeline(prev => {
            const newTimeline = prev.map(entry => 
              entry.id === currentRequestId 
                ? { ...entry, endAt: new Date().toISOString(), applied: false }
                : entry
            );
            fetchTimelineRef.current = newTimeline;
            return newTimeline;
          });
          return;
        }

        // Pagination diagnostics
        const cwValues = data.map((r: any) => r.cw_full).filter(Boolean);
        console.log('PAGINATION_DEBUG:', {
          pages: page,
          pageSize,
          totalRows: data.length,
          cw_head: cwValues[0],
          cw_tail: cwValues[cwValues.length - 1],
        });
        
        // Mapování a deduplikace z view planning_matrix na PlanningEntry interface
        const dedupMap = new Map<string, any>();
        (data || []).forEach((e: any) => {
          const key = `${e.konstrukter}::${e.cw_full}`;
          const existing = dedupMap.get(key);
          if (!existing) {
            dedupMap.set(key, e);
          } else {
            // Preferovat záznam s ne-FREE projektem, jinak novější updated_at
            const choose = () => {
              if (existing.projekt !== 'FREE' && e.projekt === 'FREE') return existing;
              if (e.projekt !== 'FREE' && existing.projekt === 'FREE') return e;
              return (new Date(e.updated_at) > new Date(existing.updated_at)) ? e : existing;
            };
            dedupMap.set(key, choose());
          }
        });

        const mappedData = Array.from(dedupMap.values()).map((entry: any) => ({
          konstrukter: entry.konstrukter,
          cw: entry.cw_full, // Používat plný formát CW s rokem
          mesic: entry.mesic,
          mhTyden: entry.mh_tyden,
          projekt: entry.projekt,
        }));

        // Stale response check: only latest fetch may apply results
        if (currentFetchIdRef.current !== currentRequestId) {
          console.log(`Ignoring stale response ${currentRequestId}, latest is ${currentFetchIdRef.current}`);
          setFetchTimeline(prev => {
            const newTimeline = prev.map(entry => 
              entry.id === currentRequestId 
                ? { ...entry, endAt: new Date().toISOString(), applied: false }
                : entry
            );
            fetchTimelineRef.current = newTimeline;
            return newTimeline;
          });
          return;
        }

        setPlanningData(mappedData);
        console.log(`Planning data loaded: ${mappedData.length} entries`);
        
        // DIAGNOSTIC: Log specific Fuchs Pavel CW31-2026 data
        const fuchsCW31 = mappedData.find(entry => 
          entry.konstrukter === 'Fuchs Pavel' && entry.cw === 'CW31-2026'
        );
        console.log('DB_ROW_AFTER_UPDATE - Fuchs Pavel CW31-2026:', fuchsCW31);
        
        // DIAGNOSTIC: Network response summary
        console.log('NETWORK_RESPONSE_ROWS:', {
          totalRows: mappedData.length,
          fuchsEntries: mappedData.filter(e => e.konstrukter === 'Fuchs Pavel').length,
          fuchsCW31Data: fuchsCW31
        });
        
        // Mark this fetch as applied
        const endAt = new Date().toISOString();
        console.log(`Fetch ${currentRequestId} completed successfully`);
        setFetchTimeline(prev => {
          const newTimeline = prev.map(entry => 
            entry.id === currentRequestId 
              ? { ...entry, endAt, applied: true }
              : entry
          );
          fetchTimelineRef.current = newTimeline;
          return newTimeline;
        });
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log(`Fetch ${currentRequestId} was aborted`);
        } else {
          console.error('Error loading planning data:', error);
        }
        setFetchTimeline(prev => {
          const newTimeline = prev.map(entry => 
            entry.id === currentRequestId 
              ? { ...entry, endAt: new Date().toISOString(), applied: false }
              : entry
          );
          fetchTimelineRef.current = newTimeline;
          return newTimeline;
        });
      }
    }, [toast]);

    // Initial data load - always load data on mount
    useEffect(() => {
      loadPlanningData('initial');
    }, [loadPlanningData]);

    // Realtime subscription setup
    useEffect(() => {
      if (isRealtimeEnabled) {
        console.log('Realtime subscription temporarily disabled for testing');
        
        // Step 4: Debounced realtime handler - only revalidation mechanism
        const debouncedRealtimeHandler = (payload: any) => {
          console.log('Realtime change detected:', payload);
          
          // Clear any existing debounce timeout
          if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
            console.log('Cleared existing debounce timeout');
          }
          
          // Set new debounced revalidation
          debounceTimeoutRef.current = setTimeout(() => {
            console.log(`Debounced realtime revalidation after ${DEBOUNCE_MS}ms`);
            loadPlanningData('realtime_debounced');
            debounceTimeoutRef.current = null; // Clear ref after execution
          }, DEBOUNCE_MS);
        };

        const subscription = supabase
          .channel('planning_entries_changes_unique') // Unique channel name
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

    const updatePlanningEntry = useCallback(async (konstrukter: string, cw: string, projekt: string) => {
      try {
        // Step 4: Optimistically update local state immediately
        setPlanningData(prev => 
          prev.map(entry => {
            const sameRow = entry.konstrukter === konstrukter && entry.cw === cw;
            return sameRow ? { ...entry, projekt: projekt } : entry;
          })
        );

        // Rozparsujeme CW a rok (očekává se formát "CW45-2025")
        let cwBase: string, year: number;
        
        if (cw.includes('-')) {
          // CW obsahuje rok ve formátu "CW32-2026"
          [cwBase, ] = cw.split('-');
          const yearPart = cw.split('-')[1];
          year = parseInt(yearPart);
        } else {
          // Starý formát bez roku - potřeba určit rok podle kontextu
          cwBase = cw;
          const cwNum = parseInt(cwBase.replace('CW', ''));
          // Nyní všechny týdny by měly používat přesné CW-rok formáty z DB
          // Odstraněna heuristika roku - vždy preferujeme rok z CW formátu
          year = 2026; // Default pro nové záznamy bez explicitního roku
        }

        // Zkontrolujeme existenci záznamu pro daného konstruktéra, CW a rok
        const { data: existingData, error: selectError } = await supabase
          .from('planning_entries')
          .select('*')
          .eq('konstrukter', konstrukter)
          .eq('cw', cwBase)
          .eq('year', year)
          .maybeSingle();

        if (selectError) {
          console.error('Error checking existing entry:', selectError);
          toast({
            title: "Chyba při kontrole dat",
            description: "Nepodařilo se zkontrolovat existující záznam.",
            variant: "destructive",
          });
          return;
        }

        if (existingData) {
          // Update existujícího záznamu
          const { error } = await supabase
            .from('planning_entries')
            .update({ projekt: projekt })
            .eq('konstrukter', konstrukter)
            .eq('cw', cwBase)
            .eq('year', year);

          if (error) {
            console.error('Error updating planning entry:', error);
            toast({
              title: "Chyba při ukládání",
              description: "Nepodařilo se uložit změnu.",
              variant: "destructive",
            });
            return;
          }
        } else {
          // Záznam neexistuje, vytvoříme nový
          // Určíme měsíc na základě roku a týdne
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
            konstrukter,
            cw: cwBase, // v DB stále bez roku
            year,
            mesic,
            projekt: projekt,
            mh_tyden: 36,
          };

          const { error: insertError } = await supabase
            .from('planning_entries')
            .insert(newEntry);

          if (insertError) {
            console.error('Error inserting planning entry:', insertError);
            toast({
              title: "Chyba při vytváření záznamu",
              description: "Nepodařilo se vytvořit nový záznam.",
              variant: "destructive",
            });
            return;
          }

          // Přidáme do lokálního stavu s původním CW (s rokem) - už bylo uděláno optimisticky výše
        }

        console.log(`REVALIDATION_MODE: ${revalidationModeRef.current}, DEBOUNCE_MS: ${DEBOUNCE_MS}`);
        console.log('Step 4: Relying on debounced Realtime for revalidation, no manual refetch');

        toast({
          title: "Změna uložena",
          description: `Hodnota byla úspěšně aktualizována.`,
        });

      } catch (error) {
        console.error('Error in updatePlanningEntry:', error);
        toast({
          title: "Neočekávaná chyba",
          description: "Došlo k neočekávané chybě při ukládání.",
          variant: "destructive",
        });
      }
    }, [toast]);

  const disableRealtime = () => setIsRealtimeEnabled(false);
  const enableRealtime = () => setIsRealtimeEnabled(true);

  const manualRefetch = useCallback(() => {
    console.log('=== MANUAL REFETCH TRIGGERED ===');
    if (revalidationModeRef.current === 'B') {
      // Coalesce manual refetch via same debounce as realtime
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = setTimeout(() => {
        console.log(`Manual refetch coalesced via debounce (${DEBOUNCE_MS}ms)`);
        loadPlanningData('manual_refetch_debounced');
      }, DEBOUNCE_MS);
      return;
    }
    loadPlanningData('manual_refetch');
  }, [loadPlanningData]);

  const performStep1Test = useCallback(async () => {
    console.log('=== STEP 1 TEST: ISOLATION WITHOUT REALTIME ===');
    console.log('Current Realtime status:', isRealtimeEnabled ? 'ENABLED' : 'DISABLED');
    
    // Update Fuchs Pavel CW31-2026 to ST_BLAVA
    await updatePlanningEntry('Fuchs Pavel', 'CW31-2026', 'ST_BLAVA');
    
    // Wait a moment, then manual refetch
    setTimeout(() => {
      manualRefetch();
      
      // Check final UI state after a delay
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
    // This would be implemented based on the week generation logic in PlanningEditor
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
        updatePlanningEntry,
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