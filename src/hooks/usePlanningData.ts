import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PlanningEntry, EngineerInfo } from '@/types/planning';
import { useToast } from '@/hooks/use-toast';

export function usePlanningData() {
  const { toast } = useToast();
  const [planningData, setPlanningData] = useState<PlanningEntry[]>([]);
  const [engineers, setEngineers] = useState<EngineerInfo[]>([]);
  const [fetchTimeline, setFetchTimeline] = useState<Array<{id: number, startAt: string, endAt?: string, applied: boolean, source: string}>>([]);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchTimelineRef = useRef<Array<{id: number, startAt: string, endAt?: string, applied: boolean, source: string}>>([]);
  const currentFetchIdRef = useRef<number>(0);

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
    // Abort previous request and increment requestId
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    const currentRequestId = Date.now();
    const startAt = new Date().toISOString();
    const timelineEntry = { id: currentRequestId, startAt, applied: false, source };
    
    currentFetchIdRef.current = currentRequestId;
    
    setFetchTimeline(prev => {
      const newTimeline = [...prev.slice(-5), timelineEntry];
      fetchTimelineRef.current = newTimeline;
      return newTimeline;
    });
    
    console.log(`Starting fetch ${currentRequestId} from ${source}`);
    
    try {
      // Load engineers first to create mapping
      const engineersData = await loadEngineers();
      const engineerMap = new Map<string, EngineerInfo>();
      engineersData.forEach(eng => {
        engineerMap.set(eng.display_name, eng);
        engineerMap.set(eng.slug, eng);
      });

      // Load planning data with pagination
      const pageSize = 1000;
      let page = 0;
      let allRows: any[] = [];
      
      while (true) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        const { data: batch, error: pageError } = await supabase
          .from('planning_entries')
          .select(`
            id,
            engineer_id,
            konstrukter,
            cw,
            year,
            mesic,
            mh_tyden,
            projekt,
            created_at,
            updated_at
          `)
          .order('konstrukter', { ascending: true })
          .order('year', { ascending: true })
          .order('cw', { ascending: true })
          .range(from, to);

        if (pageError) throw pageError;
        if (!batch || batch.length === 0) break;

        allRows = allRows.concat(batch);
        page++;
      }

      // Check if response is stale
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

      console.log('PAGINATION_DEBUG:', {
        pages: page,
        pageSize,
        totalRows: allRows.length,
      });
      
      // Process and deduplicate data
      const dedupMap = new Map<string, any>();
      allRows.forEach((e: any) => {
        const cwFull = `CW${e.cw}-${e.year}`;
        const key = `${e.konstrukter}::${cwFull}`;
        const existing = dedupMap.get(key);
        
        if (!existing) {
          dedupMap.set(key, { ...e, cw_full: cwFull });
        } else {
          const choose = () => {
            if (existing.projekt !== 'FREE' && e.projekt === 'FREE') return existing;
            if (e.projekt !== 'FREE' && existing.projekt === 'FREE') return e;
            return (new Date(e.updated_at) > new Date(existing.updated_at)) ? e : existing;
          };
          dedupMap.set(key, { ...choose(), cw_full: cwFull });
        }
      });

      // Map to PlanningEntry format with engineer resolution
      const mappedData: PlanningEntry[] = Array.from(dedupMap.values()).map((entry: any) => {
        let engineerId = entry.engineer_id;
        
        // If no engineer_id, try to resolve from konstrukter name
        if (!engineerId && entry.konstrukter) {
          const engineer = engineerMap.get(entry.konstrukter);
          engineerId = engineer?.id || null;
        }

        return {
          engineer_id: engineerId,
          konstrukter: entry.konstrukter,
          cw: entry.cw_full, // Full format with year
          mesic: entry.mesic,
          mhTyden: entry.mh_tyden,
          projekt: entry.projekt,
        };
      });

      // Stale response check
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
      
      // Mark fetch as completed
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
        toast({
          title: "Error loading data",
          description: error.message || "Failed to load planning data",
          variant: "destructive",
        });
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
  }, [toast, loadEngineers]);

  return {
    planningData,
    engineers,
    setPlanningData,
    loadPlanningData,
    fetchTimeline,
    fetchTimelineRef,
  };
}