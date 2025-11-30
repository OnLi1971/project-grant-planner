import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X, TrendingUp, TrendingDown } from 'lucide-react';
import { format, subDays, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
  const [statsTimeRange, setStatsTimeRange] = useState<'week' | 'month'>('week');

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

  // Calculate statistics
  const statistics = useMemo(() => {
    const now = new Date();
    const startDate = statsTimeRange === 'week' 
      ? startOfWeek(subDays(now, 7), { weekStartsOn: 1 })
      : startOfMonth(subMonths(now, 1));
    const endDate = statsTimeRange === 'week'
      ? endOfWeek(subDays(now, 7), { weekStartsOn: 1 })
      : endOfMonth(subMonths(now, 1));

    const relevantChanges = changes.filter(change => {
      const changeDate = new Date(change.changed_at);
      return change.change_type === 'project' && 
             changeDate >= startDate && 
             changeDate <= endDate;
    });

    const freeToProject = relevantChanges.filter(c => 
      (c.old_value === 'FREE' || c.old_value === null) && 
      c.new_value !== 'FREE' && 
      c.new_value !== 'DOVOLENÁ' &&
      c.new_value !== 'OVER'
    );

    const projectToFree = relevantChanges.filter(c => 
      c.old_value !== 'FREE' && 
      c.old_value !== 'DOVOLENÁ' &&
      c.old_value !== 'OVER' &&
      (c.new_value === 'FREE' || c.new_value === null)
    );

    // Calculate hours (assuming 36h per week per engineer)
    const freeToProjectHours = freeToProject.length * 36;
    const projectToFreeHours = projectToFree.length * 36;

    // Group by engineer
    const engineerStats = new Map<string, { allocated: number, deallocated: number }>();
    
    freeToProject.forEach(change => {
      const current = engineerStats.get(change.konstrukter) || { allocated: 0, deallocated: 0 };
      engineerStats.set(change.konstrukter, { ...current, allocated: current.allocated + 1 });
    });

    projectToFree.forEach(change => {
      const current = engineerStats.get(change.konstrukter) || { allocated: 0, deallocated: 0 };
      engineerStats.set(change.konstrukter, { ...current, deallocated: current.deallocated + 1 });
    });

    return {
      startDate,
      endDate,
      freeToProject: freeToProject.length,
      freeToProjectHours,
      projectToFree: projectToFree.length,
      projectToFreeHours,
      netChange: freeToProject.length - projectToFree.length,
      netChangeHours: freeToProjectHours - projectToFreeHours,
      engineerStats: Array.from(engineerStats.entries()).map(([name, stats]) => ({
        name,
        allocated: stats.allocated,
        deallocated: stats.deallocated,
        net: stats.allocated - stats.deallocated
      })).sort((a, b) => Math.abs(b.net) - Math.abs(a.net))
    };
  }, [changes, statsTimeRange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Historie změn plánování</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history">Historie změn</TabsTrigger>
            <TabsTrigger value="stats">Statistiky</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4 mt-4">
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
          </TabsContent>

          <TabsContent value="stats" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <Select value={statsTimeRange} onValueChange={(value: 'week' | 'month') => setStatsTimeRange(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Minulý týden</SelectItem>
                  <SelectItem value="month">Minulý měsíc</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-muted-foreground">
                {format(statistics.startDate, 'dd.MM.yyyy')} - {format(statistics.endDate, 'dd.MM.yyyy')}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Alokace (FREE → Projekt)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.freeToProject}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {statistics.freeToProjectHours}h celkem
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    Dealokace (Projekt → FREE)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.projectToFree}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {statistics.projectToFreeHours}h celkem
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Čistá změna
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={cn(
                    "text-2xl font-bold",
                    statistics.netChange > 0 ? "text-green-600" : statistics.netChange < 0 ? "text-red-600" : ""
                  )}>
                    {statistics.netChange > 0 ? '+' : ''}{statistics.netChange}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {statistics.netChangeHours > 0 ? '+' : ''}{statistics.netChangeHours}h
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Změny podle konstruktéra</CardTitle>
                <CardDescription>Top 10 konstruktérů s největšími změnami</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {statistics.engineerStats.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      Žádné změny v tomto období
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {statistics.engineerStats.slice(0, 10).map((stat) => (
                        <div
                          key={stat.name}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{stat.name}</div>
                            <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3 text-green-500" />
                                {stat.allocated} alokací ({stat.allocated * 36}h)
                              </span>
                              <span className="flex items-center gap-1">
                                <TrendingDown className="h-3 w-3 text-red-500" />
                                {stat.deallocated} dealokací ({stat.deallocated * 36}h)
                              </span>
                            </div>
                          </div>
                          <div className={cn(
                            "text-lg font-bold px-3",
                            stat.net > 0 ? "text-green-600" : stat.net < 0 ? "text-red-600" : ""
                          )}>
                            {stat.net > 0 ? '+' : ''}{stat.net}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
