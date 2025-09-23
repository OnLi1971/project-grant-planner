import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EngineerInfo {
  jmeno: string;
  orgVedouci: string;
  spolecnost: string;
}

// Convert database employee to EngineerInfo format
const mapEmployeeToEngineer = (employee: any): EngineerInfo => ({
  jmeno: employee.name,
  orgVedouci: employee.organizational_leader,
  spolecnost: employee.company
});

export const useEngineers = () => {
  const [engineers, setEngineers] = useState<EngineerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEngineers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('employees')
          .select('name, organizational_leader, company')
          .order('name');

        if (error) {
          throw error;
        }

        const mappedEngineers = data.map(mapEmployeeToEngineer);
        setEngineers(mappedEngineers);
        setError(null);
      } catch (err) {
        console.error('Error fetching engineers:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch engineers');
      } finally {
        setLoading(false);
      }
    };

    fetchEngineers();
  }, []);

  return { engineers, loading, error };
};