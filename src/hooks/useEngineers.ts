import { useToast } from '@/hooks/use-toast';
import { ACTIVE_ENGINEER_STATUSES } from '@/constants/statuses';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchEngineers } from '@/services/engineersApi';
import type { DatabaseEngineer } from '@/services/engineersApi';
import { supabase } from '@/integrations/supabase/client';

// Re-export for backwards compatibility
export type { DatabaseEngineer } from '@/services/engineersApi';

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

// Organizational mapping for compatibility (temporary)
const ORG_MAPPING: Record<string, { company: string; leader: string }> = {
  'fuchs-pavel': { company: 'SBD', leader: 'Fuchs Pavel' },
  'novak-jan': { company: 'SBD', leader: 'Novák Jan' },
  'svoboda-petr': { company: 'SBD', leader: 'Svoboda Petr' },
  'dvorak-martin': { company: 'AERTEC', leader: 'Dvořák Martin' },
  'novotny-tomas': { company: 'AERTEC', leader: 'Novotný Tomáš' },
  // Add more mappings as needed
};

const STATUSES = ACTIVE_ENGINEER_STATUSES.join(',');
export const ENGINEERS_QK = ['engineers', STATUSES] as const;

export function useEngineers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ENGINEERS_QK,
    queryFn: () => fetchEngineers(ACTIVE_ENGINEER_STATUSES),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    gcTime: 300_000,
    select: (rows: DatabaseEngineer[]): UIEngineer[] => {
      return rows.map((engineer) => {
        const orgInfo = ORG_MAPPING[engineer.slug] || { company: engineer.company || 'Unknown', leader: 'Unknown' };
        return {
          id: engineer.id,
          jmeno: engineer.display_name,
          slug: engineer.slug,
          status: engineer.status,
          spolecnost: engineer.company,
          orgVedouci: orgInfo.leader,
          hourlyRate: engineer.hourly_rate,
          currency: engineer.currency,
        };
      });
    },
    retry: 1,
  });

  const createEngineer = async (
    displayName: string,
    email?: string,
    status?: DatabaseEngineer['status'],
    company?: string,
    hourlyRate?: number,
    currency?: 'EUR' | 'CZK'
  ) => {
    try {
      const { data, error } = await supabase.rpc('engineers_create', {
        p_display_name: displayName,
        p_email: email,
        p_status: status ?? 'active',
        p_fte: 100,
        p_company: company || 'TM CZ',
        p_hourly_rate: hourlyRate,
        p_currency: currency,
      });
      if (error) throw error;

      toast({ title: 'Engineer created', description: `${displayName} has been added successfully.` });
      await queryClient.invalidateQueries({ queryKey: ENGINEERS_QK });
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create engineer';
      toast({ title: 'Error creating engineer', description: errorMessage, variant: 'destructive' });
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
        p_currency: updates.currency,
      });
      if (error) throw error;

      toast({ title: 'Engineer updated', description: 'Changes have been saved successfully.' });
      await queryClient.invalidateQueries({ queryKey: ENGINEERS_QK });
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update engineer';
      toast({ title: 'Error updating engineer', description: errorMessage, variant: 'destructive' });
      throw err;
    }
  };

  return {
    engineers: (data as UIEngineer[]) || [],
    isLoading,
    error: error ? (error as Error).message : null,
    createEngineer,
    updateEngineer,
    refetch: () => queryClient.invalidateQueries({ queryKey: ENGINEERS_QK }),
  };
}

// Utility function to find engineer by various identifiers
export const findEngineerByName = (engineers: UIEngineer[], targetName: string): UIEngineer | undefined => {
  const normalizedTarget = targetName.toLowerCase().trim();
  return engineers.find((engineer) =>
    engineer.jmeno.toLowerCase() === normalizedTarget ||
    engineer.slug === normalizedTarget ||
    engineer.jmeno.toLowerCase().includes(normalizedTarget)
  );
};

// Utility to create name mapping for legacy compatibility
export const createNameMapping = (engineers: UIEngineer[]): Map<string, string> => {
  const mapping = new Map<string, string>();
  engineers.forEach((engineer) => {
    mapping.set(engineer.slug, engineer.jmeno);
    mapping.set(engineer.jmeno.toLowerCase(), engineer.jmeno);
  });
  return mapping;
};