import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
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
  loading: boolean;
  updatePlanningEntry: (konstrukter: string, cw: string, field: 'projekt' | 'mhTyden', value: string | number) => Promise<void>;
  addEngineer: (name: string) => Promise<void>;
  savePlan: () => void;
  resetToOriginal: () => void;
}

const PlanningContext = createContext<PlanningContextType | undefined>(undefined);

export const usePlanning = () => {
  const context = useContext(PlanningContext);
  if (!context) {
    throw new Error('usePlanning must be used within a PlanningProvider');
  }
  return context;
};

const STORAGE_KEY = 'planning-data';

export const PlanningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [planningData, setPlanningData] = useState<PlanningEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from Supabase
  useEffect(() => {
    const loadPlanningData = async () => {
      try {
        const { data, error } = await supabase
          .from('planning_entries')
          .select('*')
          .order('konstrukter')
          .order('cw');

        if (error) {
          console.error('Error loading planning data:', error);
          toast({
            title: "Chyba při načítání dat",
            description: "Nepodařilo se načíst data z databáze.",
            variant: "destructive",
          });
          return;
        }

        setPlanningData(data || []);
      } catch (error) {
        console.error('Error loading planning data:', error);
        toast({
          title: "Chyba při načítání dat",
          description: "Nepodařilo se načíst data z databáze.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPlanningData();
  }, [toast]);

  const updatePlanningEntry = useCallback(async (konstrukter: string, cw: string, field: 'projekt' | 'mhTyden', value: string | number) => {
    try {
      // Nejdříve zkusíme aktualizovat existující záznam
      const { data: existingData, error: selectError } = await supabase
        .from('planning_entries')
        .select('*')
        .eq('konstrukter', konstrukter)
        .eq('cw', cw)
        .single();

      if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error checking existing entry:', selectError);
        toast({
          title: "Chyba při kontrole dat",
          description: "Nepodařilo se zkontrolovat existující záznam.",
          variant: "destructive",
        });
        return;
      }

      if (existingData) {
        // Záznam existuje, aktualizujeme ho
        const { error } = await supabase
          .from('planning_entries')
          .update({ [field === 'mhTyden' ? 'mh_tyden' : field]: value })
          .eq('konstrukter', konstrukter)
          .eq('cw', cw);

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
        const cwNum = parseInt(cw.replace('CW', ''));
        let mesic = 'August';
        
        if (cwNum <= 35) mesic = 'August';
        else if (cwNum <= 39) mesic = 'září';
        else if (cwNum <= 43) mesic = 'říjen';
        else if (cwNum <= 47) mesic = 'listopad';
        else mesic = 'prosinec';

        const newEntry = {
          konstrukter,
          cw,
          mesic,
          mh_tyden: field === 'mhTyden' ? (typeof value === 'number' ? value : parseInt(value.toString())) : 36,
          projekt: field === 'projekt' ? value.toString() : 'FREE'
        };

        const { error } = await supabase
          .from('planning_entries')
          .insert([newEntry]);

        if (error) {
          console.error('Error creating planning entry:', error);
          toast({
            title: "Chyba při vytváření",
            description: "Nepodařilo se vytvořit nový záznam.",
            variant: "destructive",
          });
          return;
        }

        // Přidáme záznam do lokálního stavu
        const newLocalEntry: PlanningEntry = { 
          konstrukter: newEntry.konstrukter,
          cw: newEntry.cw,
          mesic: newEntry.mesic,
          mhTyden: newEntry.mh_tyden,
          projekt: newEntry.projekt
        };
        setPlanningData(prev => [...prev, newLocalEntry]);
      }

      // Aktualizujeme lokální stav
      setPlanningData(prev => 
        prev.map(entry => 
          entry.konstrukter === konstrukter && entry.cw === cw
            ? { ...entry, [field]: value }
            : entry
        )
      );

      toast({
        title: "Změna uložena",
        description: "Vaše změna byla úspěšně uložena.",
      });
    } catch (error) {
      console.error('Error updating planning entry:', error);
      toast({
        title: "Chyba při ukládání",
        description: "Nepodařilo se uložit změnu.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const addEngineer = useCallback(async (name: string) => {
    const weeks = ['CW32', 'CW33', 'CW34', 'CW35', 'CW36', 'CW37', 'CW38', 'CW39', 'CW40', 'CW41', 'CW42', 'CW43', 'CW44', 'CW45', 'CW46', 'CW47', 'CW48', 'CW49', 'CW50', 'CW51', 'CW52'];
    const months = ['August', 'August', 'August', 'August', 'září', 'září', 'září', 'září', 'říjen', 'říjen', 'říjen', 'říjen', 'říjen', 'listopad', 'listopad', 'listopad', 'listopad', 'prosinec', 'prosinec', 'prosinec', 'prosinec'];
    
    const newEntries = weeks.map((week, index) => ({
      konstrukter: name,
      cw: week,
      mesic: months[index],
      mh_tyden: 36, // Defaultní hodnota 36 hodin
      projekt: 'FREE'
    }));

    try {
      const { error } = await supabase
        .from('planning_entries')
        .insert(newEntries);

      if (error) {
        console.error('Error adding engineer:', error);
        toast({
          title: "Chyba při přidávání",
          description: "Nepodařilo se přidat nového konstruktéra.",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setPlanningData(prev => [...prev, ...newEntries.map(entry => ({ 
        ...entry, 
        mhTyden: entry.mh_tyden 
      }))]);

      toast({
        title: "Konstruktér přidán",
        description: `Konstruktér ${name} byl úspěšně přidán.`,
      });
    } catch (error) {
      console.error('Error adding engineer:', error);
      toast({
        title: "Chyba při přidávání",
        description: "Nepodařilo se přidat nového konstruktéra.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const savePlan = useCallback(() => {
    toast({
      title: "Plán uložen",
      description: "Změny jsou automaticky ukládány do databáze.",
    });
  }, [toast]);

  const resetToOriginal = useCallback(async () => {
    try {
      // This would reset to original data if needed
      toast({
        title: "Reset není dostupný",
        description: "Data jsou načítána z databáze a nelze je resetovat.",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Chyba při resetu",
        description: "Nepodařilo se obnovit data.",
        variant: "destructive",
      });
    }
  }, [toast]);

  return (
    <PlanningContext.Provider value={{
      planningData,
      loading,
      updatePlanningEntry,
      addEngineer,
      savePlan,
      resetToOriginal
    }}>
      {children}
    </PlanningContext.Provider>
  );
};