import { useState, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PlanningEntry, EngineerInfo } from '@/types/planning';
import { useToast } from '@/hooks/use-toast';
import { useEngineers } from '@/hooks/useEngineers';

const PLANNING_MATRIX_COLUMNS =
  'engineer_id,konstrukter,cw,year,cw_full,mesic,projekt,mh_tyden,is_tentative,updated_at,leave_days,projekt_2,mh_tyden_2,is_tentative_2';
const PAGE_SIZE = 1000;
const PARALLEL_PAGES = 6;

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
    end_date: e.endDate || null,
  })), [uiEngineers]);
  
  // Refs to prevent race conditions
  const abortControllerRef = useRef<AbortController | null>(null);
  const latestFetchIdRef = useRef(0);
  const engineersRef = useRef<EngineerInfo[]>(engineers);
  engineersRef.current = engineers;
  const toastRef = useRef(toast);
  toastRef.current = toast;

  // No-op loader for backwards compatibility; engineers come from React Query cache
  const loadEngineers = useCallback(async (): Promise<EngineerInfo[]> => {
    return engineersRef.current;
  }, []);

  // Load planning data with race condition protection
  const loadPlanningData = useCallback(async () => {
    // Abort previous fetch and apply only the latest
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const myFetchId = ++latestFetchIdRef.current;

    try {
      if (controller.signal.aborted || latestFetchIdRef.current !== myFetchId) {
        return;
      }

      // Load data from planning_matrix view in parallel page batches (skips expensive SQL normalize_name)
      let page = 0;
      const allRows: any[] = [];

      while (true) {
        if (controller.signal.aborted || latestFetchIdRef.current !== myFetchId) {
          return;
        }

        const pageIndices = Array.from({ length: PARALLEL_PAGES }, (_, i) => page + i);
        const results = await Promise.all(
          pageIndices.map((p) => {
            const from = p * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;
            return supabase
              .from('planning_matrix')
              .select(PLANNING_MATRIX_COLUMNS)
              .range(from, to)
              .abortSignal(controller.signal);
          })
        );

        let reachedEnd = false;
        for (let i = 0; i < results.length; i++) {
          const { data: batch, error: pageError } = results[i];
          if (pageError) {
            if (pageError.message?.includes('AbortError') || pageError.message?.includes('aborted')) {
              return;
            }
            console.error(`Page ${page + i} error:`, pageError);
            throw pageError;
          }
          if (!batch || batch.length === 0) {
            reachedEnd = true;
            break;
          }
          allRows.push(...batch);
          if (batch.length < PAGE_SIZE) {
            reachedEnd = true;
            break;
          }
        }

        if (reachedEnd) break;
        page += PARALLEL_PAGES;
      }

      // Final abort check before processing - apply only if this is still the latest fetch
      if (myFetchId !== latestFetchIdRef.current) {
        return;
      }

      const engineerMap = new Map<string, EngineerInfo>();
      engineersRef.current.forEach(eng => {
        engineerMap.set(eng.display_name, eng);
        engineerMap.set(eng.slug, eng);
      });

      // Process and deduplicate data using engineer_id + cw + year as primary key (O(1) lookup)
      const seenEntries = new Map<string, { row: any; index: number }>();
      const deduplicatedRows: any[] = [];

      allRows.forEach(row => {
        if (!row.konstrukter || !row.cw_full) return;

        const engineer = engineerMap.get(row.konstrukter);
        const engineerId = row.engineer_id || engineer?.id || null;
        const key = engineerId && row.cw && row.year
          ? `${engineerId}-${row.cw}-${row.year}`
          : `${row.konstrukter}-${row.cw_full}`;

        const existing = seenEntries.get(key);

        if (!existing) {
          seenEntries.set(key, { row, index: deduplicatedRows.length });
          deduplicatedRows.push(row);
        } else {
          // Keep non-FREE projects over FREE, or more recent updates
          const shouldReplace =
            (existing.row.projekt === 'FREE' && row.projekt !== 'FREE') ||
            (existing.row.projekt === row.projekt && new Date(row.updated_at || 0) > new Date(existing.row.updated_at || 0));

          if (shouldReplace) {
            seenEntries.set(key, { row, index: existing.index });
            deduplicatedRows[existing.index] = row;
          }
        }
      });

      // Convert to PlanningEntry format
      const planningEntries: PlanningEntry[] = [];
      const secondaryEntries: PlanningEntry[] = [];

      deduplicatedRows.forEach(row => {
        const engineer = engineerMap.get(row.konstrukter);
        const base: PlanningEntry = {
          engineer_id: row.engineer_id || engineer?.id || null,
          konstrukter: row.konstrukter,
          cw: row.cw_full,
          mesic: row.mesic || '',
          mhTyden: row.mh_tyden || 0,
          projekt: row.projekt || 'FREE',
          is_tentative: row.is_tentative || false,
          leaveDays: row.leave_days || 0,
          projekt2: row.projekt_2 || null,
          mhTyden2: row.mh_tyden_2 || 0,
          is_tentative2: row.is_tentative_2 || false,
        };
        planningEntries.push(base);

        // Synthetic row for the second project so all aggregations count it automatically
        if (base.projekt2 && (base.mhTyden2 || 0) > 0) {
          secondaryEntries.push({
            ...base,
            projekt: base.projekt2,
            mhTyden: base.mhTyden2,
            is_tentative: base.is_tentative2,
            leaveDays: 0,
            projekt2: null,
            mhTyden2: 0,
            is_tentative2: false,
            isSecondary: true,
          });
        }
      });

      planningEntries.push(...secondaryEntries);


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

      toastRef.current({
        title: "Chyba při načítání dat",
        description: error.message || "Neznámá chyba",
        variant: "destructive",
      });
    }
  }, []);

  return {
    planningData,
    engineers,
    setPlanningData,
    loadPlanningData,
    loadEngineers,
  };
}
