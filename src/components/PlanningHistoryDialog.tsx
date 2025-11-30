import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PlanningChange {
  id: string;
  konstrukter: string;
  cw: string;
  year: number;
  change_type: string;
  old_value: string;
  new_value: string;
  changed_at: string;
  changed_by: string | null;
  profiles?: {
    full_name: string | null;
    email: string;
  };
}

interface PlanningHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  engineers: Array<{ display_name: string }>;
  projects: string[];
}

export function PlanningHistoryDialog({ 
  open, 
  onOpenChange,
  engineers,
  projects
}: PlanningHistoryDialogProps) {
  const [changes, setChanges] = useState<PlanningChange[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [filterEngineer, setFilterEngineer] = useState<string>('_all');
  const [filterProject, setFilterProject] = useState<string>('_all');
  const [filterChangeType, setFilterChangeType] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<Date>();
  const [filterDateTo, setFilterDateTo] = useState<Date>();

  const loadChanges = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('planning_changes')
        .select(`
          *,
          profiles:changed_by (
            full_name,
            email
          )
        `)
        .order('changed_at', { ascending: false })
        .limit(500);

      if (filterEngineer && filterEngineer !== '_all') {
        query = query.eq('konstrukter', filterEngineer);
      }

      if (filterProject && filterProject !== '_all') {
        if (filterChangeType === 'all' || filterChangeType === 'project') {
          query = query.or(`old_value.eq.${filterProject},new_value.eq.${filterProject}`);
        }
      }

      if (filterChangeType !== 'all') {
        query = query.eq('change_type', filterChangeType);
      }

      if (filterDateFrom) {
        query = query.gte('changed_at', filterDateFrom.toISOString());
      }

      if (filterDateTo) {
        const endOfDay = new Date(filterDateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('changed_at', endOfDay.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setChanges(data || []);
    } catch (error) {
      console.error('Error loading changes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadChanges();
    }
  }, [open, filterEngineer, filterProject, filterChangeType, filterDateFrom, filterDateTo]);

  const clearFilters = () => {
    setFilterEngineer('_all');
    setFilterProject('_all');
    setFilterChangeType('all');
    setFilterDateFrom(undefined);
    setFilterDateTo(undefined);
  };

  const getChangeTypeLabel = (type: string) => {
    switch (type) {
      case 'project': return 'Projekt';
      case 'hours': return 'Hodiny';
      case 'tentative': return 'Předběžná rezervace';
      default: return type;
    }
  };

  const getChangeDescription = (change: PlanningChange) => {
    switch (change.change_type) {
      case 'project':
        return `${change.old_value || 'FREE'} → ${change.new_value || 'FREE'}`;
      case 'hours':
        return `${change.old_value}h → ${change.new_value}h`;
      case 'tentative':
        return change.new_value === 'true' ? 'Označeno jako předběžné' : 'Označeno jako finální';
      default:
        return `${change.old_value} → ${change.new_value}`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Historie změn plánování</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <Select value={filterEngineer} onValueChange={setFilterEngineer}>
              <SelectTrigger>
                <SelectValue placeholder="Konstruktér" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Všichni</SelectItem>
                {engineers.map((eng) => (
                  <SelectItem key={eng.display_name} value={eng.display_name}>
                    {eng.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterProject} onValueChange={setFilterProject}>
              <SelectTrigger>
                <SelectValue placeholder="Projekt" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Všechny</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project} value={project}>
                    {project}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterChangeType} onValueChange={setFilterChangeType}>
              <SelectTrigger>
                <SelectValue placeholder="Typ změny" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny změny</SelectItem>
                <SelectItem value="project">Projekt</SelectItem>
                <SelectItem value="hours">Hodiny</SelectItem>
                <SelectItem value="tentative">Předběžná</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !filterDateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filterDateFrom ? format(filterDateFrom, "dd.MM.yyyy") : "Od"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filterDateFrom}
                  onSelect={setFilterDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !filterDateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filterDateTo ? format(filterDateTo, "dd.MM.yyyy") : "Do"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filterDateTo}
                  onSelect={setFilterDateTo}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Zobrazeno změn: {changes.length}
            </div>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Vymazat filtry
            </Button>
          </div>

          {/* Changes List */}
          <ScrollArea className="h-[500px] rounded-md border">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Načítám...</div>
            ) : changes.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Žádné změny nenalezeny
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {changes.map((change) => (
                  <div
                    key={change.id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{change.konstrukter}</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">
                            {change.cw}-{change.year}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {getChangeTypeLabel(change.change_type)}
                          </span>
                          <span className="text-sm">
                            {getChangeDescription(change)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground space-y-1">
                        <div>{format(new Date(change.changed_at), 'dd.MM.yyyy HH:mm')}</div>
                        {change.profiles && (
                          <div className="text-xs">
                            {change.profiles.full_name || change.profiles.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
