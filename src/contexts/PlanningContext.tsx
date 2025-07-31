import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { planningData as initialPlanningData, type PlanningEntry } from '@/data/planningData';
import { useToast } from '@/hooks/use-toast';

interface PlanningContextType {
  planningData: PlanningEntry[];
  updatePlanningEntry: (konstrukter: string, cw: string, field: 'projekt' | 'mhTyden', value: string | number) => void;
  addEngineer: (name: string) => void;
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
  
  // Load data from localStorage or use initial data
  const [planningData, setPlanningData] = useState<PlanningEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : initialPlanningData;
    } catch {
      return initialPlanningData;
    }
  });

  const updatePlanningEntry = useCallback((konstrukter: string, cw: string, field: 'projekt' | 'mhTyden', value: string | number) => {
    setPlanningData(prev => 
      prev.map(entry => 
        entry.konstrukter === konstrukter && entry.cw === cw
          ? { ...entry, [field]: value }
          : entry
      )
    );
  }, []);

  const addEngineer = useCallback((name: string) => {
    const weeks = ['CW32', 'CW33', 'CW34', 'CW35', 'CW36', 'CW37', 'CW38', 'CW39', 'CW40', 'CW41', 'CW42', 'CW43', 'CW44', 'CW45', 'CW46', 'CW47', 'CW48', 'CW49', 'CW50', 'CW51', 'CW52'];
    const months = ['August', 'August', 'August', 'August', 'September', 'September', 'September', 'September', 'October', 'October', 'October', 'October', 'October', 'November', 'November', 'November', 'November', 'December', 'December', 'December', 'December'];
    
    const newEntries = weeks.map((week, index) => ({
      konstrukter: name,
      cw: week,
      mesic: months[index],
      mhTyden: 0,
      projekt: 'FREE'
    }));

    setPlanningData(prev => [...prev, ...newEntries]);
  }, []);

  const savePlan = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(planningData));
      toast({
        title: "Plán uložen",
        description: "Vaše změny byly úspěšně uloženy.",
      });
    } catch (error) {
      toast({
        title: "Chyba při ukládání",
        description: "Nepodařilo se uložit změny.",
        variant: "destructive",
      });
    }
  }, [planningData, toast]);

  const resetToOriginal = useCallback(() => {
    setPlanningData(initialPlanningData);
    localStorage.removeItem(STORAGE_KEY);
    toast({
      title: "Plán obnoven",
      description: "Data byla obnovena na původní stav.",
    });
  }, [toast]);

  return (
    <PlanningContext.Provider value={{
      planningData,
      updatePlanningEntry,
      addEngineer,
      savePlan,
      resetToOriginal
    }}>
      {children}
    </PlanningContext.Provider>
  );
};