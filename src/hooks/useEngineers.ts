import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type UIEngineer = {
  id: string;
  jmeno: string;       // display_name for compatibility
  slug: string;
  status: string;
  spolecnost?: string; // company field
  orgVedouci?: string; // will be derived from org structure
  hourlyRate?: number;
  currency?: 'EUR' | 'CZK';
};

export type DatabaseEngineer = {
  id: string;
  display_name: string;
  slug: string;
  email?: string;
  status: 'active' | 'inactive' | 'contractor' | 'on_leave';
  fte_percent: number;
  department_id?: string;
  manager_id?: string;
  company: string;
  hourly_rate?: number;
  currency?: 'EUR' | 'CZK';
  created_at: string;
  updated_at: string;
};

// Organizational mapping for compatibility (temporary)
const ORG_MAPPING: Record<string, { company: string; leader: string }> = {
  'fuchs-pavel': { company: 'SBD', leader: 'Fuchs Pavel' },
  'novak-jan': { company: 'SBD', leader: 'Novák Jan' },
  'svoboda-petr': { company: 'SBD', leader: 'Svoboda Petr' },
  'dvorak-martin': { company: 'AERTEC', leader: 'Dvořák Martin' },
  'novotny-tomas': { company: 'AERTEC', leader: 'Novotný Tomáš' },
  // Add more mappings as needed
};

export function useEngineers() {
  const [engineers, setEngineers] = useState<UIEngineer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEngineers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('engineers')
        .select('*')
        .neq('status', 'inactive')
        .order('display_name');

      if (fetchError) {
        throw fetchError;
      }

      // Transform DB format to UI format for compatibility
      const uiEngineers: UIEngineer[] = (data as DatabaseEngineer[]).map(engineer => {
        const orgInfo = ORG_MAPPING[engineer.slug] || { company: 'Unknown', leader: 'Unknown' };
        
        return {
          id: engineer.id,
          jmeno: engineer.display_name,
          slug: engineer.slug,
          status: engineer.status,
          spolecnost: engineer.company, // Use actual company from DB
          orgVedouci: orgInfo.leader,
          hourlyRate: engineer.hourly_rate,
          currency: engineer.currency,
        };
      });

      setEngineers(uiEngineers);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch engineers';
      setError(errorMessage);
      console.error('Error fetching engineers:', err);
      toast({
        title: "Error loading engineers",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createEngineer = async (displayName: string, email?: string, status?: DatabaseEngineer['status'], company?: string, hourlyRate?: number, currency?: 'EUR' | 'CZK') => {
    try {
      const { data, error } = await supabase.rpc('engineers_create', {
        p_display_name: displayName,
        p_email: email,
        p_status: status ?? 'active',
        p_fte: 100,
        p_company: company || 'TM CZ',
        p_hourly_rate: hourlyRate,
        p_currency: currency
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Engineer created",
        description: `${displayName} has been added successfully.`,
      });

      // Refresh the list
      await fetchEngineers();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create engineer';
      toast({
        title: "Error creating engineer",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateEngineer = async (id: string, updates: Partial<DatabaseEngineer>) => {
    try {
      const { data, error } = await supabase.rpc('engineers_update', {
        p_id: id,
        p_display_name: updates.display_name,
        p_email: updates.email,
        p_status: updates.status,
        p_fte: updates.fte_percent,
        p_company: updates.company,
        p_hourly_rate: updates.hourly_rate,
        p_currency: updates.currency
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Engineer updated",
        description: "Changes have been saved successfully.",
      });

      // Refresh the list
      await fetchEngineers();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update engineer';
      toast({
        title: "Error updating engineer",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchEngineers();
  }, []);

  return {
    engineers,
    isLoading,
    error,
    createEngineer,
    updateEngineer,
    refetch: fetchEngineers,
  };
}

// Utility function to find engineer by various identifiers
export const findEngineerByName = (engineers: UIEngineer[], targetName: string): UIEngineer | undefined => {
  const normalizedTarget = targetName.toLowerCase().trim();
  return engineers.find(engineer => 
    engineer.jmeno.toLowerCase() === normalizedTarget ||
    engineer.slug === normalizedTarget ||
    engineer.jmeno.toLowerCase().includes(normalizedTarget)
  );
};

// Utility to create name mapping for legacy compatibility
export const createNameMapping = (engineers: UIEngineer[]): Map<string, string> => {
  const mapping = new Map<string, string>();
  engineers.forEach(engineer => {
    mapping.set(engineer.slug, engineer.jmeno);
    mapping.set(engineer.jmeno.toLowerCase(), engineer.jmeno);
  });
  return mapping;
};