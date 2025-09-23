import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PlanningEntry, EngineerInfo } from '@/types/planning';
import { useToast } from '@/hooks/use-toast';

export function usePlanningData() {
  const { toast } = useToast();
  const [planningData, setPlanningData] = useState<PlanningEntry[]>([]);
  const [engineers, setEngineers] = useState<EngineerInfo[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const latestFetchIdRef = useRef(0); // FIX 3: Rename for clarity
  const [fetchTimeline, setFetchTimeline] = useState<Array<{id: number, startAt: string, endAt?: string, applied: boolean, source: string}>>([]);
  const fetchTimelineRef = useRef(fetchTimeline);

  const loadEngineers = useCallback(async () => {
    try {
      console.log('Loading engineers from database...');
      const { data, error } = await supabase
        .from('engineers')
        .select('id, display_name, slug, status')
        .eq('status', 'active')
        .order('display_name');

      if (error) {
        console.error('Error loading engineers:', error);
        throw error;
      }

      console.log('Engineers loaded successfully:', data?.length, 'engineers');
      console.log('Sample engineer data:', data?.[0]);
      setEngineers(data || []);
      return data || [];
    } catch (error) {
      console.error('Error loading engineers:', error);
      return [];
    }
  }, []);

  const loadPlanningData = useCallback(async (source = 'manual') => {
    // FIX 3: Zastav předešlé fetch(e) a aplikuj jen poslední
    if (abortControllerRef.current) {
      console.log('Aborting previous fetch request');
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    const myFetchId = ++latestFetchIdRef.current; // Increment for unique ID
    const startAt = new Date().toISOString();
    const timelineEntry = { id: myFetchId, startAt, applied: false, source };
    
    console.log(`Starting fetch ${myFetchId} from ${source}, aborting any previous`);
    
    setFetchTimeline(prev => {
      const newTimeline = [...prev.slice(-5), timelineEntry];
      fetchTimelineRef.current = newTimeline;
      return newTimeline;
    });
    
    try {
      // Load engineers first to create mapping
      const engineersData = await loadEngineers();
      
      // Check if this request was aborted or superseded
      if (abortControllerRef.current?.signal.aborted || latestFetchIdRef.current !== myFetchId) {
        console.log(`Fetch ${myFetchId} aborted during engineers load, latest is ${latestFetchIdRef.current}`);
        return;
      }
      
      const engineerMap = new Map<string, EngineerInfo>();
      engineersData.forEach(eng => {
        engineerMap.set(eng.display_name, eng);
        engineerMap.set(eng.slug, eng);
      });

      // FIX 5: Load data from planning_matrix view (already implemented) 
      let page = 0;
      const pageSize = 1000;
      let allRows: any[] = [];
      
      while (true) {
        // Check abort before each page
        if (abortControllerRef.current?.signal.aborted || latestFetchIdRef.current !== myFetchId) {
          console.log(`Fetch ${myFetchId} aborted during page ${page}, latest is ${latestFetchIdRef.current}`);
          return;
        }
        
        const from = page * pageSize;
        const to = from + pageSize - 1;
        const { data: batch, error: pageError } = await supabase
          .from('planning_matrix')  // FIX 5: Use view as recommended
          .select('*')
          .range(from, to)
          .abortSignal(abortControllerRef.current.signal);

        if (pageError) {
          if (pageError.message?.includes('AbortError') || pageError.message?.includes('aborted')) {
            console.log(`Fetch ${myFetchId} aborted via signal`);
            return;
          }
          console.error(`Page ${page} error:`, pageError);
          throw pageError;
        }

        if (!batch || batch.length === 0) {
          break;
        }

        allRows.push(...batch);
        
        if (batch.length < pageSize) {
          break;
        }
        
        page++;
      }

      // Final abort check before processing - aplikuj jen pokud je to stále nejnovější fetch
      if (myFetchId !== latestFetchIdRef.current) {
        console.log(`Stale fetch ignored ${myFetchId}, latest is ${latestFetchIdRef.current}`);
        setFetchTimeline(prev => {
          const newTimeline = prev.map(entry => 
            entry.id === myFetchId 
              ? { ...entry, endAt: new Date().toISOString(), applied: false }
              : entry
          );
          fetchTimelineRef.current = newTimeline;
          return newTimeline;
        });
        return;
      }

      // Process and deduplicate data
      const seenEntries = new Map<string, any>();
      const deduplicatedRows: any[] = [];

      allRows.forEach(row => {
        if (!row.konstrukter || !row.cw_full) return;
        
        // FIX 2: Striktní klíčování záznamů v UI - use engineer_id + cw + year for deduplication
        const engineer = engineerMap.get(row.konstrukter);
        const key = engineer?.id && row.cw && row.year 
          ? `${engineer.id}-${row.cw}-${row.year}` 
          : `${row.konstrukter}-${row.cw_full}`; // fallback
        
        const existing = seenEntries.get(key);
        
        if (!existing) {
          seenEntries.set(key, row);
          deduplicatedRows.push(row);
        } else {
          // Keep non-FREE projects over FREE, or more recent updates
          const shouldReplace = 
            (existing.projekt === 'FREE' && row.projekt !== 'FREE') ||
            (existing.projekt === row.projekt && new Date(row.updated_at || 0) > new Date(existing.updated_at || 0));
          
          if (shouldReplace) {
            seenEntries.set(key, row);
            const existingIndex = deduplicatedRows.findIndex(r => {
              const existingEng = engineerMap.get(r.konstrukter);
              return existingEng?.id === engineer?.id && r.cw === existing.cw && r.year === existing.year;
            });
            if (existingIndex >= 0) {
              deduplicatedRows[existingIndex] = row;
            }
          }
        }
      });

      // Convert to PlanningEntry format
      const planningEntries: PlanningEntry[] = deduplicatedRows.map(row => {
        const engineer = engineerMap.get(row.konstrukter);
        return {
          engineer_id: engineer?.id || null,
          konstrukter: row.konstrukter,
          cw: row.cw_full,
          mesic: row.mesic || '',
          mhTyden: row.mh_tyden || 0,
          projekt: row.projekt || 'FREE'
        };
      });

      console.log(`Fetch ${myFetchId} processed ${allRows.length} rows → ${planningEntries.length} entries`);
      
      setPlanningData(planningEntries);
      
      // Mark as applied
      setFetchTimeline(prev => {
        const newTimeline = prev.map(entry => 
          entry.id === myFetchId 
            ? { ...entry, endAt: new Date().toISOString(), applied: true }
            : entry
        );
        fetchTimelineRef.current = newTimeline;
        return newTimeline;
      });
    } catch (error: any) {
      console.error('loadPlanningData error:', error);
      
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        console.log(`Fetch ${myFetchId} was aborted`);
        setFetchTimeline(prev => {
          const newTimeline = prev.map(entry => 
            entry.id === myFetchId 
              ? { ...entry, endAt: new Date().toISOString(), applied: false }
              : entry
          );
          fetchTimelineRef.current = newTimeline;
          return newTimeline;
        });
        return;
      }
      
      // Mark as failed
      setFetchTimeline(prev => {
        const newTimeline = prev.map(entry => 
          entry.id === myFetchId 
            ? { ...entry, endAt: new Date().toISOString(), applied: false }
            : entry
        );
        fetchTimelineRef.current = newTimeline;
        return newTimeline;
      });
      
      toast({
        title: "Chyba při načítání dat",
        description: error.message || "Neznámá chyba",
        variant: "destructive",
      });
    }
  }, [loadEngineers, setPlanningData]);

  return {
    planningData,
    engineers,
    setPlanningData,
    loadPlanningData,
    loadEngineers, // Export loadEngineers separately
    fetchTimeline,
    fetchTimelineRef,
  };
}