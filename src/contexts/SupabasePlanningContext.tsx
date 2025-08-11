import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase, type PlanningEntry } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { planningData as fallbackData } from '@/data/planningData';

interface SupabasePlanningContextType {
  planningData: PlanningEntry[];
  loading: boolean;
  updatePlanningEntry: (konstrukter: string, cw: string, field: 'projekt' | 'mh_tyden', value: string | number) => Promise<void>;
  addEngineer: (name: string) => Promise<void>;
  refreshData: () => Promise<void>;
  canEdit: boolean;
  canDelete: boolean;
}

const SupabasePlanningContext = createContext<SupabasePlanningContextType | undefined>(undefined);

export const useSupabasePlanning = () => {
  const context = useContext(SupabasePlanningContext);
  if (!context) {
    throw new Error('useSupabasePlanning must be used within a SupabasePlanningProvider');
  }
  return context;
};

export const SupabasePlanningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [planningData, setPlanningData] = useState<PlanningEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Check permissions based on user role
  const canEdit = profile?.role === 'admin' || profile?.role === 'editor';
  const canDelete = profile?.role === 'admin';

  const fetchPlanningData = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('planning_entries')
        .select('*')
        .order('konstrukter', { ascending: true })
        .order('cw', { ascending: true });

      if (error) {
        console.error('Error fetching planning data:', error);
        // Use fallback data if database is not set up yet - transform to match Supabase format
        const transformedFallback = fallbackData.map(entry => ({
          konstrukter: entry.konstrukter,
          cw: entry.cw,
          mesic: entry.mesic,
          mh_tyden: entry.mhTyden,
          projekt: entry.projekt
        }));
        setPlanningData(transformedFallback);
        return;
      }

      // Transform Supabase data to match expected format
      const transformedData = data?.map(entry => ({
        konstrukter: entry.konstrukter,
        cw: entry.cw,
        mesic: entry.mesic,
        mh_tyden: entry.mh_tyden,
        projekt: entry.projekt
      })) || [];

      setPlanningData(transformedData);
    } catch (error) {
      console.error('Error fetching planning data:', error);
      const transformedFallback = fallbackData.map(entry => ({
        konstrukter: entry.konstrukter,
        cw: entry.cw,
        mesic: entry.mesic,
        mh_tyden: entry.mhTyden,
        projekt: entry.projekt
      }));
      setPlanningData(transformedFallback);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePlanningEntry = useCallback(async (
    konstrukter: string, 
    cw: string, 
    field: 'projekt' | 'mh_tyden', 
    value: string | number
  ) => {
    if (!canEdit) {
      toast({
        title: "Nedostatečná oprávnění",
        description: "Nemáte oprávnění k úpravě dat.",
        variant: "destructive",
      });
      return;
    }

    try {
      const updateField = field === 'mh_tyden' ? 'mh_tyden' : 'projekt';
      const { error } = await supabase
        .from('planning_entries')
        .update({ [updateField]: value })
        .eq('konstrukter', konstrukter)
        .eq('cw', cw);

      if (error) {
        throw error;
      }

      // Update local state - need to match field names
      const fieldName = field === 'mh_tyden' ? 'mh_tyden' : 'projekt';
      setPlanningData(prev => 
        prev.map(entry => 
          entry.konstrukter === konstrukter && entry.cw === cw
            ? { ...entry, [fieldName]: value }
            : entry
        )
      );

      toast({
        title: "Aktualizace úspěšná",
        description: "Data byla aktualizována.",
      });
    } catch (error: any) {
      console.error('Error updating planning entry:', error);
      toast({
        title: "Chyba při aktualizaci",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [canEdit, toast]);

  const addEngineer = useCallback(async (name: string) => {
    if (!canEdit) {
      toast({
        title: "Nedostatečná oprávnění",
        description: "Nemáte oprávnění k přidávání konstruktérů.",
        variant: "destructive",
      });
      return;
    }

    try {
      const weeks = ['CW32', 'CW33', 'CW34', 'CW35', 'CW36', 'CW37', 'CW38', 'CW39', 'CW40', 'CW41', 'CW42', 'CW43', 'CW44', 'CW45', 'CW46', 'CW47', 'CW48', 'CW49', 'CW50', 'CW51', 'CW52'];
      const months = ['August', 'August', 'August', 'August', 'September', 'September', 'September', 'September', 'October', 'October', 'October', 'October', 'October', 'November', 'November', 'November', 'November', 'December', 'December', 'December', 'December'];
      
      const newEntries = weeks.map((week, index) => ({
        konstrukter: name,
        cw: week,
        mesic: months[index],
        mh_tyden: 0,
        projekt: 'FREE'
      }));

      const { error } = await supabase
        .from('planning_entries')
        .insert(newEntries);

      if (error) {
        throw error;
      }

      // Refresh data from server
      await fetchPlanningData();

      toast({
        title: "Konstruktér přidán",
        description: `${name} byl úspěšně přidán do plánování.`,
      });
    } catch (error: any) {
      console.error('Error adding engineer:', error);
      toast({
        title: "Chyba při přidávání",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [canEdit, toast, fetchPlanningData]);

  const refreshData = useCallback(async () => {
    await fetchPlanningData();
  }, [fetchPlanningData]);

  // Load data on mount and set up real-time subscription
  useEffect(() => {
    fetchPlanningData();

    // Set up real-time subscription
    const subscription = supabase
      .channel('planning-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'planning_entries' },
        () => {
          fetchPlanningData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchPlanningData]);

  return (
    <SupabasePlanningContext.Provider value={{
      planningData,
      loading,
      updatePlanningEntry,
      addEngineer,
      refreshData,
      canEdit,
      canDelete
    }}>
      {children}
    </SupabasePlanningContext.Provider>
  );
};