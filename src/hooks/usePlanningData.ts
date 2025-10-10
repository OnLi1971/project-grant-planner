import { useState, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PlanningEntry, EngineerInfo } from '@/types/planning';
import { useToast } from '@/hooks/use-toast';
import { useEngineers } from '@/hooks/useEngineers';
import { normalizeName } from '@/utils/nameNormalization';

// Re-export for backwards compatibility
export { ACTIVE_ENGINEER_STATUSES } from '@/constants/statuses';

export function usePlanningData() {
  const { toast } = useToast();
  const [planningData, setPlanningData] = useState<PlanningEntry[]>([]);
  const { engineers: uiEngineers = [] } = useEngineers() as any;
  const engineers: EngineerInfo[] = useMemo(() => (uiEngineers as any[]).map((e: any) => ({
    id: e.id,
    display_name: e.jmeno,
    slug: e.slug,
    status: e.status,
  })), [uiEngineers]);
  
  // Refs to prevent race conditions
  const abortControllerRef = useRef<AbortController | null>(null);
  const latestFetchIdRef = useRef(0);
  const [fetchTimeline, setFetchTimeline] = useState<Array<{id: number, startAt: string, endAt?: string, applied: boolean, source: string}>>([]);
  const fetchTimelineRef = useRef(fetchTimeline);

  // No-op loader for backwards compatibility; engineers come from React Query cache
  const loadEngineers = useCallback(async (): Promise<EngineerInfo[]> => {
    return engineers;
  }, [engineers]);

  // Load planning data with race condition protection
  const loadPlanningData = useCallback(async (source = 'manual') => {
    // Abort previous fetch and apply only the latest
    if (abortControllerRef.current) {
      console.log('Aborting previous fetch request');
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    const myFetchId = ++latestFetchIdRef.current;
    const startAt = new Date().toISOString();
    const timelineEntry = { id: myFetchId, startAt, applied: false, source };
    
    console.log(`Starting fetch ${myFetchId} from ${source}, aborting any previous`);
    
    setFetchTimeline(prev => {
      const newTimeline = [...prev.slice(-5), timelineEntry];
      fetchTimelineRef.current = newTimeline;
      return newTimeline;
    });
    
    try {
      // Use engineers from cache (React Query)
      const engineersData = engineers;
      
      // Check if this request was aborted or superseded
      if (abortControllerRef.current?.signal.aborted || latestFetchIdRef.current !== myFetchId) {
        console.log(`Fetch ${myFetchId} aborted during engineers load, latest is ${latestFetchIdRef.current}`);
        return;
      }
      
      const engineerMap = new Map<string, EngineerInfo>();
      engineersData.forEach(eng => {
        const raw = eng.display_name ?? '';
        const norm = normalizeName(raw);
        engineerMap.set(raw, eng);    // legacy lookup
        engineerMap.set(eng.slug, eng); // slug lookup
        engineerMap.set(norm, eng);   // normalized lookup (PRIMARY)
      });

      // Load data from planning_matrix view with pagination
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
          .from('planning_matrix')
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

      // Final abort check before processing - apply only if this is still the latest fetch
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

      // Process and deduplicate data using engineer_id + cw + year as primary key
      const seenEntries = new Map<string, any>();
      const deduplicatedRows: any[] = [];

      allRows.forEach(row => {
        if (!row.konstrukter || !row.cw_full) return;
        
        // PRIORITY 1: Use engineer_id from DB if present
        // PRIORITY 2: Lookup by normalized name
        let engineer: EngineerInfo | undefined;
        
        if (row.engineer_id) {
          engineer = engineersData.find(e => e.id === row.engineer_id);
        }
        
        if (!engineer) {
          const rawName = row.konstrukter ?? '';
          const normName = normalizeName(rawName);
          engineer = engineerMap.get(normName) || engineerMap.get(rawName);
        }
        
        // Primary key: engineer_id + cw + year (clean approach)
        const normName = normalizeName(row.konstrukter ?? '');
        const key = engineer?.id && row.cw && row.year 
          ? `${engineer.id}-${row.cw}-${row.year}` 
          : `${normName}-${row.cw_full}`; // fallback uses normalized name
        
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
              const rNorm = normalizeName(r.konstrukter ?? '');
              const existingEng = engineerMap.get(rNorm) || engineerMap.get(r.konstrukter);
              return existingEng?.id === engineer?.id && r.cw === existing.cw && r.year === existing.year;
            });
            if (existingIndex >= 0) {
              deduplicatedRows[existingIndex] = row;
            }
          }
        }
      });

      // Convert to PlanningEntry format with diagnostic logging for contractors
      const planningEntries: PlanningEntry[] = deduplicatedRows.map(row => {
        // PRIORITY 1: Use engineer_id from DB if present
        // PRIORITY 2: Lookup by normalized name
        let engineer: EngineerInfo | undefined;
        
        if (row.engineer_id) {
          engineer = engineersData.find(e => e.id === row.engineer_id);
        }
        
        if (!engineer) {
          const rawName = row.konstrukter ?? '';
          const normName = normalizeName(rawName);
          engineer = engineerMap.get(normName) || engineerMap.get(rawName);
        }
        
        return {
          engineer_id: engineer?.id || null,
          konstrukter: row.konstrukter, // Keep original for display
          cw: row.cw_full,
          mesic: row.mesic || '',
          mhTyden: row.mh_tyden || 0,
          projekt: row.projekt || 'FREE'
        };
      });
      
      // Diagnostic: Log contractor mappings for CW41-2025
      const contractorDebug = planningEntries
        .filter(e => e.cw === 'CW41-2025')
        .map(e => {
          const eng = engineersData.find(en => en.id === e.engineer_id);
          return {
            konstrukter: e.konstrukter,
            normalized: normalizeName(e.konstrukter),
            engineer_id: e.engineer_id,
            status: eng?.status || 'NOT_FOUND',
            projekt: e.projekt
          };
        })
        .filter(d => d.status === 'contractor' || d.status === 'NOT_FOUND');
      
      if (contractorDebug.length > 0) {
        console.log('=== Contractor mapping debug (CW41-2025) ===');
        console.table(contractorDebug);
      }

      console.log(`Fetch ${myFetchId} processed ${allRows.length} rows → ${planningEntries.length} entries`);
      
      // Final race condition check before applying data
      if (latestFetchIdRef.current !== myFetchId) {
        console.log(`Fetch ${myFetchId} superseded before applying data, latest is ${latestFetchIdRef.current}`);
        return;
      }
      
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
  }, [engineers, setPlanningData, toast]);

  return {
    planningData,
    engineers,
    setPlanningData,
    loadPlanningData,
    loadEngineers,
    fetchTimeline,
    fetchTimelineRef,
  };
}
