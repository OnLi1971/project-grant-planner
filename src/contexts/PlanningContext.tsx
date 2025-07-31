import React, { createContext, useContext, useState, useCallback } from 'react';
import { planningData as initialPlanningData, type PlanningEntry } from '@/data/planningData';

interface PlanningContextType {
  planningData: PlanningEntry[];
  updatePlanningEntry: (konstrukter: string, cw: string, field: 'projekt' | 'mhTyden', value: string | number) => void;
  addEngineer: (name: string) => void;
  savePlan: () => void;
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
  const [planningData, setPlanningData] = useState<PlanningEntry[]>(initialPlanningData);

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
    // Here you could implement saving to localStorage, API, etc.
    console.log('Plan saved:', planningData);
    // For now, just log the data
  }, [planningData]);

  return (
    <PlanningContext.Provider value={{
      planningData,
      updatePlanningEntry,
      addEngineer,
      savePlan
    }}>
      {children}
    </PlanningContext.Provider>
  );
};