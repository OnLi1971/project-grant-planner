import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Edit, Save, X, Plus, MousePointer, MousePointer2, FolderPlus, Copy } from 'lucide-react';
import { usePlanning } from '@/contexts/PlanningContext';
import { getProjectColor, getCustomerByProjectCode } from '@/utils/colorSystem';
import { getWeek } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { normalizeName, findEngineerByName } from '@/utils/nameNormalization';
import { useEngineers } from '@/hooks/useEngineers';

interface WeekPlan {
  cw: string;
  mesic: string;
  mhTyden: number;
  projekt: string;
}

interface DatabaseProject {
  id: string;
  name: string;
  code: string;
  customer_id: string;
  project_manager_id: string;
  program_id: string;
  start_date?: string;
  end_date?: string;
  status: string;
  hourly_rate?: number;
  project_type: string;
  budget?: number;
  average_hourly_rate?: number;
  project_status?: string;
  probability?: number;
}

interface EditableCell {
  konstrukter: string;
  cw: string;
  field: 'projekt' | 'mhTyden';
}

// Dostupné projekty
const availableProjects = [
  'ST_EMU_INT', 'ST_TRAM_INT', 'ST_MAINZ', 'ST_KASSEL', 'ST_BLAVA', 'ST_FEM', 'ST_POZAR', 
  'NU_CRAIN', 'WA_HVAC', 'ST_JIGS', 'ST_TRAM_HS', 'SAF_FEM', 'FREE', 'DOVOLENÁ', 'NEMOC', 'OVER'
];

// Funkce pro výpočet aktuálního kalendářního týdne
const getCurrentWeek = (): number => {
  return getWeek(new Date(), { weekStartsOn: 1 });
};

// Generovat všechny týdny (2025-2026)
const generateAllWeeks = (): WeekPlan[] => {
  const weeks: WeekPlan[] = [];
  const currentWeek = getCurrentWeek();
  
  // 2025: CW32 to CW52
  for (let cw = Math.max(32, currentWeek); cw <= 52; cw++) {
    weeks.push({
      cw: `CW${cw.toString().padStart(2, '0')}-2025`,
      mesic: getMonthForWeek(`CW${cw.toString().padStart(2, '0')}-2025`),
      mhTyden: 0,
      projekt: 'FREE'
    });
  }
  
  // 2026: CW01 to CW52
  for (let cw = 1; cw <= 52; cw++) {
    weeks.push({
      cw: `CW${cw.toString().padStart(2, '0')}-2026`,
      mesic: getMonthForWeek(`CW${cw.toString().padStart(2, '0')}-2026`),
      mhTyden: 0,
      projekt: 'FREE'
    });
  }
  
  return weeks;
};

// Pomocná funkce pro mapování týdnů na měsíce
const getMonthForWeek = (cw: string): string => {
  const monthMapping: { [key: string]: string } = {
    // 2025
    'CW32-2025': 'Srp', 'CW33-2025': 'Srp', 'CW34-2025': 'Srp', 'CW35-2025': 'Zář',
    'CW36-2025': 'Zář', 'CW37-2025': 'Zář', 'CW38-2025': 'Zář', 'CW39-2025': 'Říj',
    'CW40-2025': 'Říj', 'CW41-2025': 'Říj', 'CW42-2025': 'Říj', 'CW43-2025': 'Lis',
    'CW44-2025': 'Lis', 'CW45-2025': 'Lis', 'CW46-2025': 'Lis', 'CW47-2025': 'Pro',
    'CW48-2025': 'Pro', 'CW49-2025': 'Pro', 'CW50-2025': 'Pro', 'CW51-2025': 'Pro',
    'CW52-2025': 'Pro',
    
    // 2026
    'CW01-2026': 'Led', 'CW02-2026': 'Led', 'CW03-2026': 'Led', 'CW04-2026': 'Led',
    'CW05-2026': 'Úno', 'CW06-2026': 'Úno', 'CW07-2026': 'Úno', 'CW08-2026': 'Úno',
    'CW09-2026': 'Bře', 'CW10-2026': 'Bře', 'CW11-2026': 'Bře', 'CW12-2026': 'Bře',
    'CW13-2026': 'Dub', 'CW14-2026': 'Dub', 'CW15-2026': 'Dub', 'CW16-2026': 'Dub',
    'CW17-2026': 'Kvě', 'CW18-2026': 'Kvě', 'CW19-2026': 'Kvě', 'CW20-2026': 'Kvě',
    'CW21-2026': 'Čvn', 'CW22-2026': 'Čvn', 'CW23-2026': 'Čvn', 'CW24-2026': 'Čvn',
    'CW25-2026': 'Čvc', 'CW26-2026': 'Čvc', 'CW27-2026': 'Čvc', 'CW28-2026': 'Čvc',
    'CW29-2026': 'Srp', 'CW30-2026': 'Srp', 'CW31-2026': 'Srp', 'CW32-2026': 'Srp'
  };
  return monthMapping[cw] || 'Neznámý';
};

// Funkce pro generování plánových dat
const generatePlanningDataForEditor = (data: any[]): { [konstrukter: string]: { [cw: string]: WeekPlan } } => {
  const result: { [konstrukter: string]: { [cw: string]: WeekPlan } } = {};

  data.forEach(entry => {
    if (!result[entry.konstrukter]) {
      result[entry.konstrukter] = {};
    }

    result[entry.konstrukter][entry.cw] = {
      cw: entry.cw,
      mesic: entry.mesic,
      mhTyden: entry.mhTyden || 0,
      projekt: entry.projekt || 'FREE'
    };
  });

  return result;
};

export const PlanningEditor: React.FC = () => {
  const { planningData, updatePlanningEntry, updatePlanningHours } = usePlanning();
  const { engineers: allKonstrukteri, loading: engineersLoading } = useEngineers();
  
  const [projects, setProjects] = useState<DatabaseProject[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Vytvořím plánová data pro všechny konstruktéry, včetně těch bez dat
  const planningDataForEditor = useMemo(() => {
    if (engineersLoading || allKonstrukteri.length === 0) return {};
    
    const generatedData = generatePlanningDataForEditor(planningData);
    
    // Ujistím se, že všichni konstruktéři z seznamu jsou k dispozici
    allKonstrukteri.forEach(konstrukter => {
      if (!generatedData[konstrukter.jmeno]) {
        // Pokud konstruktér nemá data, vytvoř pro něj prázdný plán
        const emptyPlan: { [cw: string]: WeekPlan } = {};
        generateAllWeeks().forEach(week => {
          emptyPlan[week.cw] = week;
        });
        generatedData[konstrukter.jmeno] = emptyPlan;
      }
    });
    
    return generatedData;
  }, [planningData, allKonstrukteri, engineersLoading]);

  // Get all unique engineer names from the data
  const allEngineers = useMemo(() => {
    if (engineersLoading || allKonstrukteri.length === 0) return [];
    
    return Array.from(new Set(
      Object.keys(planningDataForEditor)
        .filter(name => planningDataForEditor[name] && Object.keys(planningDataForEditor[name]).length > 0)
    )).sort();
  }, [planningDataForEditor, allKonstrukteri, engineersLoading]);

  const konstrukteri = useMemo(() => {
    if (engineersLoading || allKonstrukteri.length === 0) return [];
    return allKonstrukteri.map(k => k.jmeno).sort();
  }, [allKonstrukteri, engineersLoading]);
  
  const [editingCell, setEditingCell] = useState<EditableCell | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [selectedKonstrukter, setSelectedKonstrukter] = useState<string>('');
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false);
  const [selectedWeeks, setSelectedWeeks] = useState<Set<string>>(new Set());
  const [availableProjectsLocal, setAvailableProjectsLocal] = useState<string[]>(availableProjects);
  const [copyFromKonstrukter, setCopyFromKonstrukter] = useState<string>('');
  const [bulkProject, setBulkProject] = useState<string>('');
  const [bulkHours, setBulkHours] = useState<string>('');

  // Set initial selected engineer
  useEffect(() => {
    if (konstrukteri.length > 0 && !selectedKonstrukter) {
      setSelectedKonstrukter(konstrukteri[0]);
    }
  }, [konstrukteri, selectedKonstrukter]);

  // Načteme projekty z databáze
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('status', 'active')
          .order('name');

        if (error) {
          console.error('Error fetching projects:', error);
          return;
        }

        setProjects(data || []);
        
        // Přidáme projekty z databáze do dostupných projektů
        const dbProjectCodes = data?.map(p => p.code) || [];
        const allProjectCodes = [...new Set([...availableProjects, ...dbProjectCodes])];
        setAvailableProjectsLocal(allProjectCodes);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Get weeks for selected engineer
  const selectedEngineerWeeks = useMemo(() => {
    if (!selectedKonstrukter || !planningDataForEditor[selectedKonstrukter]) {
      return generateAllWeeks();
    }
    
    const engineerData = planningDataForEditor[selectedKonstrukter];
    return generateAllWeeks().map(week => 
      engineerData[week.cw] || week
    );
  }, [selectedKonstrukter, planningDataForEditor]);

  const handleCellEdit = (konstrukter: string, cw: string, field: 'projekt' | 'mhTyden') => {
    if (isMultiSelectMode) {
      // V multi-select režimu označujeme týdny
      const newSelectedWeeks = new Set(selectedWeeks);
      if (newSelectedWeeks.has(cw)) {
        newSelectedWeeks.delete(cw);
      } else {
        newSelectedWeeks.add(cw);
      }
      setSelectedWeeks(newSelectedWeeks);
      return;
    }

    setEditingCell({ konstrukter, cw, field });
    const currentValue = planningDataForEditor[konstrukter]?.[cw]?.[field] || '';
    setEditingValue(String(currentValue));
  };

  const handleSaveEdit = async () => {
    if (!editingCell) return;

    try {
      if (editingCell.field === 'projekt') {
        await updatePlanningEntry(editingCell.konstrukter, editingCell.cw, editingValue);
      } else if (editingCell.field === 'mhTyden') {
        const hours = parseInt(editingValue) || 0;
        await updatePlanningHours(editingCell.konstrukter, editingCell.cw, hours);
      }
    } catch (error) {
      console.error('Error saving edit:', error);
    }

    setEditingCell(null);
    setEditingValue('');
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditingValue('');
  };

  const getProjectBadge = (projekt: string) => {
    const color = getProjectColor(projekt);
    const customer = getCustomerByProjectCode(projekt);
    
    return (
      <Badge 
        style={{ backgroundColor: color, color: '#fff' }}
        className="text-xs font-medium border-0"
      >
        {projekt}
        {customer && ` (${customer})`}
      </Badge>
    );
  };

  if (engineersLoading || loading) {
    return (
      <Card className="p-6">
        <div className="text-center">Načítání dat...</div>
      </Card>
    );
  }

  if (konstrukteri.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">Žádní konstruktéři nejsou k dispozici.</div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Editor plánování
            </h2>
            <div className="flex items-center gap-4">
              <Select value={selectedKonstrukter} onValueChange={setSelectedKonstrukter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Vyberte konstruktéra" />
                </SelectTrigger>
                <SelectContent>
                  {konstrukteri.map(name => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                variant={isMultiSelectMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setIsMultiSelectMode(!isMultiSelectMode);
                  setSelectedWeeks(new Set());
                }}
              >
                <MousePointer2 className="h-4 w-4 mr-2" />
                {isMultiSelectMode ? 'Ukončit výběr' : 'Vícenásobný výběr'}
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4">
          {selectedKonstrukter && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Týden</th>
                    <th className="text-left p-2 font-medium">Měsíc</th>
                    <th className="text-left p-2 font-medium">Projekt</th>
                    <th className="text-left p-2 font-medium">Hodiny</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedEngineerWeeks.map((week) => (
                    <tr 
                      key={week.cw} 
                      className={`border-b hover:bg-muted/50 ${
                        selectedWeeks.has(week.cw) ? 'bg-primary/10' : ''
                      }`}
                    >
                      <td className="p-2 font-mono">{week.cw}</td>
                      <td className="p-2">{week.mesic}</td>
                      <td className="p-2">
                        {editingCell?.konstrukter === selectedKonstrukter && 
                         editingCell?.cw === week.cw && 
                         editingCell?.field === 'projekt' ? (
                          <div className="flex items-center gap-2">
                            <Select value={editingValue} onValueChange={setEditingValue}>
                              <SelectTrigger className="w-48 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availableProjectsLocal.map(project => (
                                  <SelectItem key={project} value={project}>
                                    {project}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button size="sm" onClick={handleSaveEdit}>
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-muted p-1 rounded"
                            onClick={() => handleCellEdit(selectedKonstrukter, week.cw, 'projekt')}
                          >
                            {getProjectBadge(week.projekt)}
                          </div>
                        )}
                      </td>
                      <td className="p-2">
                        {editingCell?.konstrukter === selectedKonstrukter && 
                         editingCell?.cw === week.cw && 
                         editingCell?.field === 'mhTyden' ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="w-20 h-8"
                              min="0"
                              max="168"
                            />
                            <Button size="sm" onClick={handleSaveEdit}>
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-muted p-1 rounded text-center w-12"
                            onClick={() => handleCellEdit(selectedKonstrukter, week.cw, 'mhTyden')}
                          >
                            {week.mhTyden || 0}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};