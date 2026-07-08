import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RateHistoryRow {
  id: string;
  project_id: string;
  valid_from: string;
  hourly_rate: number | null;
  average_hourly_rate: number | null;
}

interface Props {
  projectId: string;
  projectType: 'WP' | 'Hodinovka';
}

export const ProjectRateHistoryEditor: React.FC<Props> = ({ projectId, projectType }) => {
  const [rows, setRows] = useState<RateHistoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newRate, setNewRate] = useState<string>('');
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('project_rate_history')
      .select('*')
      .eq('project_id', projectId)
      .order('valid_from', { ascending: false });
    if (error) {
      console.error(error);
    } else {
      setRows((data as RateHistoryRow[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (projectId) load();
  }, [projectId]);

  const handleAdd = async () => {
    if (!newDate || !newRate) {
      toast({ title: 'Vyplň datum a sazbu', variant: 'destructive' });
      return;
    }
    const rateNum = parseFloat(newRate.replace(',', '.'));
    if (isNaN(rateNum) || rateNum <= 0) {
      toast({ title: 'Neplatná sazba', variant: 'destructive' });
      return;
    }
    const payload: any = {
      project_id: projectId,
      valid_from: newDate,
    };
    if (projectType === 'WP') payload.average_hourly_rate = rateNum;
    else payload.hourly_rate = rateNum;

    const { error } = await supabase.from('project_rate_history').insert(payload);
    if (error) {
      toast({ title: 'Chyba uložení', description: error.message, variant: 'destructive' });
      return;
    }
    setNewDate('');
    setNewRate('');
    toast({ title: 'Sazba přidána' });
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('project_rate_history').delete().eq('id', id);
    if (error) {
      toast({ title: 'Chyba mazání', description: error.message, variant: 'destructive' });
      return;
    }
    load();
  };

  return (
    <Card className="p-3 space-y-3">
      <div>
        <Label className="text-sm font-semibold">Historie hodinových sazeb</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Sazba platí od zadaného data. Do té doby se používá předchozí sazba (nebo základní z projektu).
        </p>
      </div>

      {/* Add new */}
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
        <div>
          <Label htmlFor="rh-date" className="text-xs">Platí od</Label>
          <Input
            id="rh-date"
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="rh-rate" className="text-xs">Sazba (Kč/hod)</Label>
          <Input
            id="rh-rate"
            type="number"
            value={newRate}
            onChange={(e) => setNewRate(e.target.value)}
            placeholder="1200"
          />
        </div>
        <Button type="button" size="sm" onClick={handleAdd}>
          <Plus className="h-3 w-3 mr-1" /> Přidat
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-xs text-muted-foreground">Načítám…</div>
      ) : rows.length === 0 ? (
        <div className="text-xs text-muted-foreground">Žádné historické sazby — používá se základní sazba projektu.</div>
      ) : (
        <div className="space-y-1">
          {rows.map((r) => {
            const rate = projectType === 'WP' ? r.average_hourly_rate : r.hourly_rate;
            return (
              <div key={r.id} className="flex items-center justify-between text-sm border rounded px-2 py-1">
                <span>
                  <strong>od {r.valid_from}</strong> — {rate?.toLocaleString('cs-CZ')} Kč/hod
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(r.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
