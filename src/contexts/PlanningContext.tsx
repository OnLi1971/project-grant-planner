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

export const PlanningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [planningData, setPlanningData] = useState<PlanningEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from Supabase with realtime updates
  useEffect(() => {
    const loadPlanningData = async () => {
      try {
        const pageSize = 5000;
        let offset = 0;
        let allRows: any[] = [];

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

          if (batch.length < pageSize) break;
          offset += pageSize;
        }

        // Mapujeme názvy sloupců z databáze na interface
        // Pro data z databáze přidáme rok k CW a měsíci pokud tam není
        const mappedData = allRows.map((entry: any) => {
          let cwWithYear = entry.cw;
          let mesicWithYear = entry.mesic;
          
          // Pokud CW neobsahuje rok, přidáme ho
          if (!entry.cw.includes('-')) {
            const cwNum = parseInt(entry.cw.replace('CW', ''));
            const year = cwNum >= 32 ? '2025' : '2026';
            cwWithYear = `${entry.cw}-${year}`;
            
            // Přidáme rok k měsíci pokud tam není
            if (!entry.mesic.includes('2025') && !entry.mesic.includes('2026')) {
              mesicWithYear = `${entry.mesic} ${year}`;
            }
          }
          
          return {
            konstrukter: entry.konstrukter,
            cw: cwWithYear,
            mesic: mesicWithYear,
            mhTyden: entry.mh_tyden,
            projekt: entry.projekt
          };
        });
        
        setPlanningData(mappedData);
        console.log('Planning data loaded:', mappedData.length, 'entries');
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
        () => {
          console.log('Realtime change detected, reloading data...');
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
      // CW může být ve formátu "CW45" nebo "CW45-2025" - pro databázi potřebujeme jen "CW45"
      const cwForDatabase = cw.includes('-') ? cw.split('-')[0] : cw;
      
      // Nejdříve zkusíme aktualizovat existující záznam
      const { data: existingData, error: selectError } = await supabase
        .from('planning_entries')
        .select('*')
        .eq('konstrukter', konstrukter)
        .eq('cw', cwForDatabase)
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
          .eq('cw', cwForDatabase);

        if (error) {
          console.error('Error updating planning entry:', error);
          toast({
            title: "Chyba při ukládání",
            description: "Nepodařilo se uložit změnu.",
            variant: "destructive",
          });
          return;
        }

        // Aktualizujeme lokální stav
        setPlanningData(prev => 
          prev.map(entry => {
            const entryMatches = (entry.konstrukter === konstrukter) && 
              (entry.cw === cw || entry.cw.split('-')[0] === cwForDatabase);
            return entryMatches ? { ...entry, [field]: value } : entry;
          })
        );
      } else {
        // Záznam neexistuje, vytvoříme nový
        const cwNum = parseInt(cwForDatabase.replace('CW', ''));
        
        // Určíme měsíc na základě roku a týdne
        let mesic: string;
        const year = cw.includes('-') ? cw.split('-')[1] : (cwNum >= 32 ? '2025' : '2026');
        
        if (year === '2025') {
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

        const newEntry = {
          konstrukter,
          cw: cwForDatabase, // Do databáze uložíme bez roku
          mesic,
          [field === 'mhTyden' ? 'mh_tyden' : field]: value,
          [field === 'mhTyden' ? 'projekt' : 'mh_tyden']: field === 'mhTyden' ? 'FREE' : 36
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

        // Přidáme do lokálního stavu s původním CW (s rokem)
        setPlanningData(prev => [...prev, {
          konstrukter: newEntry.konstrukter,
          cw, // Používáme původní CW s rokem
          mesic: newEntry.mesic,
          mhTyden: typeof newEntry.mh_tyden === 'number' ? newEntry.mh_tyden : 36,
          projekt: typeof newEntry.projekt === 'string' ? newEntry.projekt : 'FREE'
        }]);
      }

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

  const addEngineer = useCallback(async (name: string) => {
    // Generování týdnů pro celý rozsah (CW32-52 pro 2025 + CW01-52 pro 2026)
    const newEntries = [];
    
    // CW32-52 pro 2025
    for (let cw = 32; cw <= 52; cw++) {
      let mesic;
      if (cw <= 35) mesic = 'srpen 2025';
      else if (cw <= 39) mesic = 'září 2025';
      else if (cw <= 43) mesic = 'říjen 2025';
      else if (cw <= 47) mesic = 'listopad 2025';
      else mesic = 'prosinec 2025';
      
      newEntries.push({
        konstrukter: name,
        cw: `CW${cw.toString().padStart(2, '0')}`,
        mesic,
        mh_tyden: 36,
        projekt: cw === 52 ? 'DOVOLENÁ' : 'FREE'
      });
    }
    
    // CW01-52 pro 2026
    for (let cw = 1; cw <= 52; cw++) {
      let mesic;
      if (cw <= 5) mesic = 'leden 2026';
      else if (cw <= 9) mesic = 'únor 2026';
      else if (cw <= 13) mesic = 'březen 2026';
      else if (cw <= 17) mesic = 'duben 2026';
      else if (cw <= 22) mesic = 'květen 2026';
      else if (cw <= 26) mesic = 'červen 2026';
      else if (cw <= 30) mesic = 'červenec 2026';
      else if (cw <= 35) mesic = 'srpen 2026';
      else if (cw <= 39) mesic = 'září 2026';
      else if (cw <= 43) mesic = 'říjen 2026';
      else if (cw <= 47) mesic = 'listopad 2026';
      else mesic = 'prosinec 2026';
      
      newEntries.push({
        konstrukter: name,
        cw: `CW${cw.toString().padStart(2, '0')}`,
        mesic,
        mh_tyden: 36,
        projekt: cw === 52 ? 'DOVOLENÁ' : 'FREE'
      });
    }

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

      // Připravíme nové záznamy pro cílového konstruktéra (bez roku v CW pro databázi)
      const targetEntries = sourcePlan.map(entry => ({
        konstrukter: toKonstrukter,
        cw: entry.cw.includes('-') ? entry.cw.split('-')[0] : entry.cw,
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

  const resetToOriginal = useCallback(() => {
    toast({
      title: "Reset není dostupný",
      description: "Data jsou načítána z databáze a nelze je resetovat.",
      variant: "destructive",
    });
  }, [toast]);

  return (
    <PlanningContext.Provider
      value={{
        planningData,
        loading,
        updatePlanningEntry,
        addEngineer,
        copyPlan,
        savePlan,
        resetToOriginal,
      }}
    >
      {children}
    </PlanningContext.Provider>
  );
};