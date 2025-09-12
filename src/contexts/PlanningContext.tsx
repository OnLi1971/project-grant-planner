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
  copyPlan: (fromKonstrukter: string, toKonstrukter: string) => Promise<void>;
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

  // Load data from Supabase with realtime updates
  useEffect(() => {
    const loadPlanningData = async () => {
      try {
        const pageSize = 1000;
        let offset = 0;
        let allRows: any[] = [];
        let page = 0;

        while (true) {
          const { data, error } = await supabase
            .from('planning_entries')
            .select('*')
            .order('konstrukter')
            .order('cw')
            .range(offset, offset + pageSize - 1);

          if (error) {
            throw error;
          }

          const batch = data || [];
          allRows = allRows.concat(batch);
          page++;

          if (batch.length < pageSize) break;
          offset += pageSize;
        }

        // Mapujeme názvy sloupců z databáze na interface
        const mappedData = allRows.map((entry: any) => ({
          konstrukter: entry.konstrukter,
          cw: entry.cw,
          mesic: entry.mesic,
          mhTyden: entry.mh_tyden, // Mapování z mh_tyden na mhTyden
          projekt: entry.projekt
        }));
        
        setPlanningData(mappedData);
        console.log('Planning data loaded:', mappedData.length, 'entries (paginated)');
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

    // Setup realtime subscription for planning_entries table
    const subscription = supabase
      .channel('planning_entries_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'planning_entries' },
        (payload) => {
          console.log('Realtime change detected:', payload.eventType);
          // Reload data when any change occurs
          loadPlanningData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
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

        // Aktualizujeme lokální stav pro existující záznam
        setPlanningData(prev => 
          prev.map(entry => 
            entry.konstrukter === konstrukter && entry.cw === cw
              ? { ...entry, [field]: value }
              : entry
          )
        );
      } else {
        // Záznam neexistuje, vytvoříme nový
        const cwNum = parseInt(cw.replace('CW', ''));
        
        // Používáme rozšířené mapování týdnů na měsíce (2025-2026)
        const weekToMonthMap: { [key: number]: string } = {
          // Rok 2025 (CW32-52)
          32: 'srpen', 33: 'srpen', 34: 'srpen', 35: 'srpen',
          36: 'září', 37: 'září', 38: 'září', 39: 'září',
          40: 'říjen', 41: 'říjen', 42: 'říjen', 43: 'říjen', 44: 'říjen',
          45: 'listopad', 46: 'listopad', 47: 'listopad', 48: 'listopad',
          49: 'prosinec', 50: 'prosinec', 51: 'prosinec', 52: 'prosinec',
          // Rok 2026 (CW01-26)
          1: 'leden', 2: 'leden', 3: 'leden', 4: 'leden', 5: 'leden',
          6: 'únor', 7: 'únor', 8: 'únor', 9: 'únor',
          10: 'březen', 11: 'březen', 12: 'březen', 13: 'březen', 14: 'březen',
          15: 'duben', 16: 'duben', 17: 'duben', 18: 'duben',
          19: 'květen', 20: 'květen', 21: 'květen', 22: 'květen', 23: 'květen',
          24: 'červen', 25: 'červen', 26: 'červen'
        };
        
        const mesic = weekToMonthMap[cwNum] || 'srpen';

        // Najdeme aktuální hodnoty z lokálního stavu (může být z defaultního plánu)
        const currentEntry = planningData.find(entry => 
          entry.konstrukter === konstrukter && entry.cw === cw
        );

        const newEntry = {
          konstrukter,
          cw,
          mesic,
          mh_tyden: field === 'mhTyden' ? 
            (typeof value === 'number' ? value : parseInt(value.toString())) : 
            (currentEntry?.mhTyden || 36),
          projekt: field === 'projekt' ? 
            value.toString() : 
            (currentEntry?.projekt || 'FREE')
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

        // Přidáme nový záznam do lokálního stavu s aktualizovanou hodnotou
        const newLocalEntry: PlanningEntry = { 
          konstrukter: newEntry.konstrukter,
          cw: newEntry.cw,
          mesic: newEntry.mesic,
          mhTyden: newEntry.mh_tyden,
          projekt: newEntry.projekt
        };
        setPlanningData(prev => [...prev, newLocalEntry]);
      }

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
    // Týdny od CW32 do CW52 (2025) + CW01 do CW26 (2026)
    const weeks2025 = ['CW32', 'CW33', 'CW34', 'CW35', 'CW36', 'CW37', 'CW38', 'CW39', 'CW40', 'CW41', 'CW42', 'CW43', 'CW44', 'CW45', 'CW46', 'CW47', 'CW48', 'CW49', 'CW50', 'CW51', 'CW52'];
    const weeks2026 = ['CW01', 'CW02', 'CW03', 'CW04', 'CW05', 'CW06', 'CW07', 'CW08', 'CW09', 'CW10', 'CW11', 'CW12', 'CW13', 'CW14', 'CW15', 'CW16', 'CW17', 'CW18', 'CW19', 'CW20', 'CW21', 'CW22', 'CW23', 'CW24', 'CW25', 'CW26'];
    const weeks = [...weeks2025, ...weeks2026];
    
    const months2025 = ['srpen', 'srpen', 'srpen', 'srpen', 'září', 'září', 'září', 'září', 'říjen', 'říjen', 'říjen', 'říjen', 'říjen', 'listopad', 'listopad', 'listopad', 'listopad', 'prosinec', 'prosinec', 'prosinec', 'prosinec'];
    const months2026 = ['leden', 'leden', 'leden', 'leden', 'leden', 'únor', 'únor', 'únor', 'únor', 'březen', 'březen', 'březen', 'březen', 'březen', 'duben', 'duben', 'duben', 'duben', 'květen', 'květen', 'květen', 'květen', 'květen', 'červen', 'červen', 'červen'];
    const months = [...months2025, ...months2026];
    
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

  const copyPlan = useCallback(async (fromKonstrukter: string, toKonstrukter: string) => {
    try {
      // Najdeme všechny záznamy pro zdrojového konstruktéra
      const sourcePlan = planningData.filter(entry => entry.konstrukter === fromKonstrukter);
      
      if (sourcePlan.length === 0) {
        toast({
          title: "Chyba při kopírování",
          description: `Nebyl nalezen žádný plán pro konstruktéra ${fromKonstrukter}.`,
          variant: "destructive",
        });
        return;
      }

      // Připravíme nové záznamy pro cílového konstruktéra
      const targetEntries = sourcePlan.map(entry => ({
        konstrukter: toKonstrukter,
        cw: entry.cw,
        mesic: entry.mesic,
        mh_tyden: entry.mhTyden || 36,
        projekt: entry.projekt || 'FREE'
      }));

      // Nejdříve smažeme existující záznamy pro cílového konstruktéra
      const { error: deleteError } = await supabase
        .from('planning_entries')
        .delete()
        .eq('konstrukter', toKonstrukter);

      if (deleteError) {
        console.error('Error deleting existing entries:', deleteError);
        toast({
          title: "Chyba při kopírování",
          description: "Nepodařilo se smazat existující plán.",
          variant: "destructive",
        });
        return;
      }

      // Vložíme nové záznamy
      const { error: insertError } = await supabase
        .from('planning_entries')
        .insert(targetEntries);

      if (insertError) {
        console.error('Error inserting copied entries:', insertError);
        toast({
          title: "Chyba při kopírování",
          description: "Nepodařilo se vložit kopírovaný plán.",
          variant: "destructive",
        });
        return;
      }

      // Aktualizujeme lokální stav
      setPlanningData(prev => {
        // Odstraníme staré záznamy pro cílového konstruktéra
        const filtered = prev.filter(entry => entry.konstrukter !== toKonstrukter);
        // Přidáme nové záznamy
        const newEntries = targetEntries.map(entry => ({
          konstrukter: entry.konstrukter,
          cw: entry.cw,
          mesic: entry.mesic,
          mhTyden: entry.mh_tyden,
          projekt: entry.projekt
        }));
        return [...filtered, ...newEntries];
      });

      toast({
        title: "Plán zkopírován",
        description: `Plán konstruktéra ${fromKonstrukter} byl úspěšně zkopírován do ${toKonstrukter}.`,
      });
    } catch (error) {
      console.error('Error copying plan:', error);
      toast({
        title: "Chyba při kopírování",
        description: "Nepodařilo se zkopírovat plán.",
        variant: "destructive",
      });
    }
  }, [planningData, toast]);

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
      copyPlan,
      savePlan,
      resetToOriginal
    }}>
      {children}
    </PlanningContext.Provider>
  );
};