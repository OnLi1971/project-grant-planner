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

// Funkce pro zjištění aktuálního týdne
const getCurrentWeek = (): number => {
  return getWeek(new Date(), { weekStartsOn: 1 });
};

// Funkce pro generování týdnů od aktuálního týdne do konce roku
const generateAllWeeks = (): WeekPlan[] => {
  const weeks: WeekPlan[] = [];
  const months = [
    'leden', 'únor', 'březen', 'duben', 'květen', 'červen',
    'červenec', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const currentWeek = getCurrentWeek();
  const startWeek = Math.max(32, currentWeek); // Začneme od aktuálního týdne, ale minimálně od CW32
  
  // Začínáme od aktuálního týdne do CW52
  for (let cw = startWeek; cw <= 52; cw++) {
    // CW32 je obvykle srpen, CW52 je prosinec
    let monthIndex;
    if (cw <= 35) monthIndex = 7; // August
    else if (cw <= 39) monthIndex = 8; // September  
    else if (cw <= 43) monthIndex = 9; // October
    else if (cw <= 47) monthIndex = 10; // November
    else monthIndex = 11; // December
    
    const mesic = months[monthIndex];
    
    weeks.push({
      cw: `CW${cw.toString().padStart(2, '0')}`,
      mesic,
      mhTyden: 36, // Defaultní hodnota 36 hodin
      projekt: 'FREE'
    });
  }
  
  return weeks;
};

// Transformace dat z contextu do formátu editoru
const generatePlanningDataForEditor = (data: any[]): { [key: string]: WeekPlan[] } => {
  const result: { [key: string]: WeekPlan[] } = {};
  
  // Vytvoříme mapu existujících dat
  const existingDataMap: { [key: string]: { [key: string]: WeekPlan } } = {};
  data.forEach(entry => {
    if (!existingDataMap[entry.konstrukter]) {
      existingDataMap[entry.konstrukter] = {};
    }
    existingDataMap[entry.konstrukter][entry.cw] = {
      cw: entry.cw,
      mesic: entry.mesic,
      mhTyden: entry.mhTyden,
      projekt: entry.projekt
    };
  });
  
  // Získáme seznam všech konstruktérů
  const allKonstrukteri = [...new Set(data.map(entry => entry.konstrukter))];
  
  // Pro každého konstruktéra vytvoříme týdny od aktuálního týdne do konce roku
  allKonstrukteri.forEach(konstrukter => {
    const allWeeks = generateAllWeeks();
    const currentWeek = getCurrentWeek();
    
    // Filtrujeme pouze existující data pro aktuální a budoucí týdny
    const relevantExistingData = Object.keys(existingDataMap[konstrukter] || {})
      .filter(cw => {
        const cwNum = parseInt(cw.replace('CW', ''));
        return cwNum >= Math.max(32, currentWeek);
      })
      .reduce((acc, cw) => {
        acc[cw] = existingDataMap[konstrukter][cw];
        return acc;
      }, {} as { [key: string]: WeekPlan });
    
    result[konstrukter] = allWeeks.map(week => {
      // Pokud máme existující data pro tento týden, použijeme je
      if (relevantExistingData[week.cw]) {
        return relevantExistingData[week.cw];
      }
      // Jinak použijeme default hodnoty
      return week;
    });
  });
  
  return result;
};

export const PlanningEditor: React.FC = () => {
  const { planningData, updatePlanningEntry, addEngineer, copyPlan, savePlan, resetToOriginal } = usePlanning();
  
  const [projects, setProjects] = useState<DatabaseProject[]>([]);
  const [loading, setLoading] = useState(true);
  
  const planData = useMemo(() => generatePlanningDataForEditor(planningData), [planningData]);
  const konstrukteri = useMemo(() => Object.keys(planData).sort(), [planData]);
  
  const [editingCell, setEditingCell] = useState<EditableCell | null>(null);
  const [selectedKonstrukter, setSelectedKonstrukter] = useState<string>(konstrukteri[0] || '');
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false);
  const [selectedWeeks, setSelectedWeeks] = useState<Set<string>>(new Set());
  const [availableProjectsLocal, setAvailableProjectsLocal] = useState<string[]>(availableProjects);
  const [copyFromKonstrukter, setCopyFromKonstrukter] = useState<string>('');

  // Načteme projekty z databáze
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('status', 'active');
        
        if (error) {
          console.error('Error fetching projects:', error);
        } else {
          setProjects(data || []);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Dynamicky aktualizujeme seznam projektů
  const allProjectCodes = useMemo(() => {
    const staticProjects = availableProjects;
    const dynamicProjects = projects.map(p => p.code);
    return Array.from(new Set([...staticProjects, ...dynamicProjects]));
  }, [projects]);

  const handleProjectCreated = (newProject: DatabaseProject) => {
    setProjects(prev => [...prev, newProject]);
    setAvailableProjectsLocal(prev => {
      if (!prev.includes(newProject.code)) {
        return [...prev, newProject.code];
      }
      return prev;
    });
  };

  const updateCell = (konstrukter: string, cw: string, field: 'projekt' | 'mhTyden', value: string | number) => {
    updatePlanningEntry(konstrukter, cw, field, value);
  };

  const toggleWeekSelection = (cw: string) => {
    if (!isMultiSelectMode) return;
    
    const newSelectedWeeks = new Set(selectedWeeks);
    if (newSelectedWeeks.has(cw)) {
      newSelectedWeeks.delete(cw);
    } else {
      newSelectedWeeks.add(cw);
    }
    setSelectedWeeks(newSelectedWeeks);
  };

  const clearSelection = () => {
    setSelectedWeeks(new Set());
  };

  const bulkUpdateProject = (projekt: string) => {
    selectedWeeks.forEach(cw => {
      updateCell(selectedKonstrukter, cw, 'projekt', projekt);
    });
    clearSelection();
  };

  const bulkUpdateHours = (hours: number) => {
    selectedWeeks.forEach(cw => {
      updateCell(selectedKonstrukter, cw, 'mhTyden', hours);
    });
    clearSelection();
  };

  const getProjectBadge = (projekt: string) => {
    if (!projekt || projekt === 'FREE') return <Badge variant="secondary">Volný</Badge>;
    if (projekt === 'DOVOLENÁ') return <Badge variant="outline" className="border-accent">Dovolená</Badge>;
    if (projekt === 'NEMOC') return <Badge variant="outline" className="border-destructive text-destructive">Nemoc</Badge>;
    if (projekt === 'OVER') return <Badge variant="outline" className="border-warning text-warning">Režie</Badge>;
    
    const customer = getCustomerByProjectCode(projekt);
    if (customer) {
      return (
        <Badge 
          style={{
            backgroundColor: getProjectColor(projekt),
            color: 'white',
            border: 'none'
          }}
        >
          {customer.name}
        </Badge>
      );
    }
    return <Badge variant="outline">{projekt}</Badge>;
  };

  const currentPlan = planData[selectedKonstrukter] || [];

  const addNewEngineer = () => {
    const newName = prompt('Zadejte jméno nového konstruktéra:');
    if (newName && !konstrukteri.includes(newName)) {
      addEngineer(newName);
      setSelectedKonstrukter(newName);
    }
  };

  const handleCopyPlan = () => {
    if (!copyFromKonstrukter || !selectedKonstrukter) {
      return;
    }
    
    if (copyFromKonstrukter === selectedKonstrukter) {
      alert('Nelze kopírovat plán sám do sebe!');
      return;
    }
    
    const confirmed = confirm(
      `Opravdu chcete zkopírovat plán konstruktéra "${copyFromKonstrukter}" do "${selectedKonstrukter}"? Tento krok přepíše celý stávající plán konstruktéra "${selectedKonstrukter}".`
    );
    
    if (confirmed) {
      copyPlan(copyFromKonstrukter, selectedKonstrukter);
      setCopyFromKonstrukter('');
    }
  };

  return (
    <div className="space-y-6 p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="bg-gradient-header text-white p-6 rounded-lg shadow-planning">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Plánování konstruktérů - Editor</h1>
              <p className="text-primary-foreground/80">Editovatelný týdenní plán projektů</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={isMultiSelectMode ? "default" : "outline"} 
              onClick={() => {
                setIsMultiSelectMode(!isMultiSelectMode);
                if (isMultiSelectMode) clearSelection();
              }}
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50"
            >
              <MousePointer2 className="h-4 w-4 mr-2" />
              {isMultiSelectMode ? 'Ukončit výběr' : 'Vybrat více týdnů'}
            </Button>
            <Button variant="outline" onClick={savePlan} className="bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50">
              <Save className="h-4 w-4 mr-2" />
              Uložit plán
            </Button>
            <Button variant="outline" onClick={resetToOriginal} className="bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50">
              <X className="h-4 w-4 mr-2" />
              Obnovit původní
            </Button>
          </div>
        </div>
      </div>


      {/* Bulk Edit Panel */}
      {isMultiSelectMode && selectedWeeks.size > 0 && (
        <Card className="p-4 shadow-card-custom border-primary">
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium">
              Vybráno {selectedWeeks.size} týdnů pro {selectedKonstrukter}
            </div>
            <div className="flex gap-2">
              <Select onValueChange={bulkUpdateProject}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Nastavit projekt pro všechny" />
                </SelectTrigger>
                <SelectContent>
                  {allProjectCodes.map(projekt => (
                    <SelectItem key={projekt} value={projekt}>{projekt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Hodiny"
                className="w-24"
                onChange={(e) => e.target.value && bulkUpdateHours(parseInt(e.target.value) || 0)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLInputElement;
                    if (target.value) {
                      bulkUpdateHours(parseInt(target.value) || 0);
                      target.value = '';
                    }
                  }
                }}
              />
              <Button variant="outline" onClick={clearSelection}>
                <X className="h-4 w-4 mr-2" />
                Zrušit výběr
              </Button>
            </div>
          </div>
        </Card>
      )}


      {/* Selector konstruktéra */}
      <Card className="p-4 shadow-card-custom">
        <div className="flex items-center gap-4 flex-wrap">
          <label className="text-sm font-medium">Konstruktér:</label>
          <Select value={selectedKonstrukter} onValueChange={(value) => {
            setSelectedKonstrukter(value);
            clearSelection(); // Clear selection when changing engineer
          }}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {konstrukteri.map(konstrukter => (
                <SelectItem key={konstrukter} value={konstrukter}>{konstrukter}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground">
            {konstrukteri.length} konstruktérů k dispozici
          </div>
          {isMultiSelectMode && (
            <Badge variant="outline" className="border-primary text-primary">
              Režim výběru více týdnů
            </Badge>
          )}
        </div>
      </Card>

      {/* Kopírování plánu */}
      <Card className="p-4 shadow-card-custom">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Copy className="h-4 w-4" />
            <label className="text-sm font-medium">Převzít plán od:</label>
          </div>
          <Select value={copyFromKonstrukter} onValueChange={setCopyFromKonstrukter}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Vyberte konstruktéra" />
            </SelectTrigger>
            <SelectContent>
              {konstrukteri
                .filter(k => k !== selectedKonstrukter)
                .map(konstrukter => (
                  <SelectItem key={konstrukter} value={konstrukter}>{konstrukter}</SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleCopyPlan}
            disabled={!copyFromKonstrukter || !selectedKonstrukter}
            variant="outline"
          >
            <Copy className="h-4 w-4 mr-2" />
            Zkopírovat plán
          </Button>
          <div className="text-xs text-muted-foreground max-w-md">
            Zkopíruje celý plán vybraného konstruktéra do aktuálně editovaného konstruktéra. <strong>Přepíše všechny stávající data!</strong>
          </div>
        </div>
      </Card>

      {/* Planning Table */}
      <Card className="shadow-planning overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-planning-header text-white">
              <tr>
                <th className="p-3 text-left font-medium">CW</th>
                <th className="p-3 text-left font-medium">Měsíc</th>
                <th className="p-3 text-left font-medium">MH/týden</th>
                <th className="p-3 text-left font-medium">Projekt</th>
                <th className="p-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {currentPlan.map((week, index) => {
                const isSelected = selectedWeeks.has(week.cw);
                return (
                <tr 
                  key={week.cw}
                  className={`
                    border-b transition-colors cursor-pointer
                    ${isSelected ? 'bg-primary/10 border-primary' : 
                      index % 2 === 0 ? 'bg-planning-cell hover:bg-planning-cell-hover' : 
                      'bg-planning-stripe hover:bg-planning-cell-hover'}
                    ${isMultiSelectMode ? 'hover:bg-primary/5' : ''}
                  `}
                  onClick={() => isMultiSelectMode && toggleWeekSelection(week.cw)}
                >
                  <td className="p-3 font-mono font-medium relative">
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 rounded" />
                    )}
                    <span className="relative z-10">{week.cw}</span>
                  </td>
                  <td className="p-3 text-muted-foreground relative">
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 rounded" />
                    )}
                    <span className="relative z-10">{week.mesic}</span>
                  </td>
                  
                  {/* Editovatelné MH/týden */}
                  <td className="p-3 relative">
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 rounded" />
                    )}
                    <div className="relative z-10">
                    {editingCell?.konstrukter === selectedKonstrukter && 
                     editingCell?.cw === week.cw && 
                     editingCell?.field === 'mhTyden' && !isMultiSelectMode ? (
                      <Input
                        type="number"
                        value={week.mhTyden}
                        onChange={(e) => updateCell(selectedKonstrukter, week.cw, 'mhTyden', parseInt(e.target.value) || 0)}
                        onBlur={() => setEditingCell(null)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingCell(null)}
                        className="w-20 h-8"
                        autoFocus
                      />
                      ) : (
                        <div 
                          className={`cursor-pointer hover:bg-muted p-1 rounded flex items-center gap-2 ${
                            isMultiSelectMode ? 'pointer-events-none' : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isMultiSelectMode) {
                              setEditingCell({ konstrukter: selectedKonstrukter, cw: week.cw, field: 'mhTyden' });
                            }
                          }}
                        >
                          <span className={`font-medium ${
                            week.mhTyden >= 40 ? 'text-success' :
                            week.mhTyden >= 20 ? 'text-warning' :
                            week.mhTyden >= 0 ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {week.mhTyden || 0}h
                          </span>
                          {!isMultiSelectMode && <Edit className="h-3 w-3 opacity-50" />}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  {/* Editovatelný projekt */}
                  <td className="p-3 relative">
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 rounded" />
                    )}
                    <div className="relative z-10">
                    {editingCell?.konstrukter === selectedKonstrukter && 
                     editingCell?.cw === week.cw && 
                     editingCell?.field === 'projekt' && !isMultiSelectMode ? (
                      <Select
                        value={week.projekt || 'FREE'}
                        onValueChange={(value) => {
                          updateCell(selectedKonstrukter, week.cw, 'projekt', value);
                          setEditingCell(null);
                        }}
                      >
                        <SelectTrigger className="w-48 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {allProjectCodes.map(projekt => (
                            <SelectItem key={projekt} value={projekt}>{projekt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      ) : (
                        <div 
                          className={`cursor-pointer hover:bg-muted p-1 rounded flex items-center gap-2 ${
                            isMultiSelectMode ? 'pointer-events-none' : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isMultiSelectMode) {
                              setEditingCell({ konstrukter: selectedKonstrukter, cw: week.cw, field: 'projekt' });
                            }
                          }}
                        >
                          <span className="font-medium">{week.projekt || 'FREE'}</span>
                          {!isMultiSelectMode && <Edit className="h-3 w-3 opacity-50" />}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  {/* Status badge */}
                  <td className="p-3 relative">
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/20 rounded" />
                    )}
                    <div className="relative z-10">
                      {getProjectBadge(week.projekt)}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {currentPlan.length === 0 && (
        <Card className="p-8 text-center shadow-card-custom">
          <div className="text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Žádná data pro vybraného konstruktéra</p>
            <p className="text-sm">Vyberte jiného konstruktéra nebo přidejte nového</p>
          </div>
        </Card>
      )}
    </div>
  );
};