import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

export interface CustomEngineerView {
  id: string;
  name: string;
  engineers: string[];
}

export const useCustomEngineerViews = () => {
  const { user } = useAuth();
  const [customViews, setCustomViews] = useState<CustomEngineerView[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadViews = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_engineer_views')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (error) throw error;
      
      setCustomViews(data?.map(v => ({
        id: v.id,
        name: v.name,
        engineers: v.selected_engineers
      })) || []);
    } catch (error) {
      console.error('Error loading custom views:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadViews();
  }, [loadViews]);

  const saveView = async (name: string, engineers: string[]): Promise<boolean> => {
    if (!user?.id) {
      toast.error('Pro uložení pohledu se musíte přihlásit');
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('custom_engineer_views')
        .insert({
          user_id: user.id,
          name,
          selected_engineers: engineers
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setCustomViews(prev => [...prev, {
        id: data.id,
        name: data.name,
        engineers: data.selected_engineers
      }]);
      
      toast.success(`Pohled "${name}" byl uložen`);
      return true;
    } catch (error) {
      console.error('Error saving view:', error);
      toast.error('Nepodařilo se uložit pohled');
      return false;
    }
  };

  const updateView = async (id: string, name: string, engineers: string[]): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('custom_engineer_views')
        .update({
          name,
          selected_engineers: engineers
        })
        .eq('id', id);
      
      if (error) throw error;
      
      setCustomViews(prev => prev.map(v => 
        v.id === id ? { id, name, engineers } : v
      ));
      
      toast.success(`Pohled "${name}" byl aktualizován`);
      return true;
    } catch (error) {
      console.error('Error updating view:', error);
      toast.error('Nepodařilo se aktualizovat pohled');
      return false;
    }
  };

  const deleteView = async (id: string): Promise<boolean> => {
    try {
      const viewToDelete = customViews.find(v => v.id === id);
      
      const { error } = await supabase
        .from('custom_engineer_views')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setCustomViews(prev => prev.filter(v => v.id !== id));
      
      if (viewToDelete) {
        toast.success(`Pohled "${viewToDelete.name}" byl smazán`);
      }
      return true;
    } catch (error) {
      console.error('Error deleting view:', error);
      toast.error('Nepodařilo se smazat pohled');
      return false;
    }
  };

  return {
    customViews,
    isLoading,
    saveView,
    updateView,
    deleteView,
    refetch: loadViews
  };
};
