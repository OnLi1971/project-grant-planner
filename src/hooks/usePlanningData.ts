import { useState, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PlanningEntry, EngineerInfo } from '@/types/planning';
import { useToast } from '@/hooks/use-toast';
import { useEngineers } from '@/hooks/useEngineers';

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

  // No-op loader for backwards compatibility; engineers come from React Query cache
  const loadEngineers = useCallback(async (): Promise<EngineerInfo[]> => {
    return engineers;
  }, [engineers]);

  // Load planning data with race condition protection
  const loadPlanningData = useCallback(async () => {
    // Abort previous fetch and apply only the latest
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    const myFetchId = ++latestFetchIdRef.current;
    
    try {
      // Use engineers from cache (React Query)
      const engineersData = engineers;
      
      // Check if this request was aborted or superseded
      if (abortControllerRef.current?.signal.aborted || latestFetchIdRef.current !== myFetchId) {
        return;
      }
      
      const engineerMap = new Map<string, EngineerInfo>();
      engineersData.forEach(eng => {
        engineerMap.set(eng.display_name, eng);
        engineerMap.set(eng.slug, eng);
      });

      // Load data from planning_matrix view with pagination
      let page = 0;
      const pageSize = 1000;
      let allRows: any[] = [];
      
      while (true) {
        // Check abort before each page
        if (abortControllerRef.current?.signal.aborted || latestFetchIdRef.current !== myFetchId) {
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
        return;
      }

      // Process and deduplicate data using engineer_id + cw + year as primary key
      const seenEntries = new Map<string, any>();
      const deduplicatedRows: any[] = [];

      allRows.forEach(row => {
        if (!row.konstrukter || !row.cw_full) return;
        
        const engineer = engineerMap.get(row.konstrukter);
        // Primary key: engineer_id + cw + year (clean approach)
        const key = engineer?.id && row.cw && row.year 
          ? `${engineer.id}-${row.cw}-${row.year}` 
          : `${row.konstrukter}-${row.cw_full}`; // fallback for unmapped data
        
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
          projekt: row.projekt || 'FREE',
          is_tentative: row.is_tentative || false
        };
      });

      // Final race condition check before applying data
      if (latestFetchIdRef.current !== myFetchId) {
        return;
      }
      
      setPlanningData(planningEntries);
    } catch (error: any) {
      console.error('loadPlanningData error:', error);
      
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        return;
      }
      
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
  };
}
