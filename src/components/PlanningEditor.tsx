// Updated planning editor with engineer_id support
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

// Funkce pro generování týdnů od aktuálního týdne do celého roku 2026
const generateAllWeeks = (): WeekPlan[] => {
  const weeks: WeekPlan[] = [];
  const months = [
    'leden', 'únor', 'březen', 'duben', 'květen', 'červen',
    'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'
  ];
  
  const currentWeek = getCurrentWeek();
  const startWeek = Math.max(1, currentWeek - 4); // Začneme 4 týdny před aktuálním týdnem
  
  // Nejprve generujeme týdny do konce roku 2025
  for (let cw = startWeek; cw <= 52; cw++) {
    let monthIndex;
    if (cw <= 4) monthIndex = 0; // leden
    else if (cw <= 8) monthIndex = 1; // únor
    else if (cw <= 13) monthIndex = 2; // březen
    else if (cw <= 17) monthIndex = 3; // duben
    else if (cw <= 21) monthIndex = 4; // květen
    else if (cw <= 26) monthIndex = 5; // červen
    else if (cw <= 30) monthIndex = 6; // červenec
    else if (cw <= 35) monthIndex = 7; // srpen
    else if (cw <= 39) monthIndex = 8; // září  
    else if (cw <= 43) monthIndex = 9; // říjen
    else if (cw <= 47) monthIndex = 10; // listopad
    else monthIndex = 11; // prosinec
    
    const mesic = months[monthIndex];
    
    weeks.push({
      cw: `CW${cw.toString().padStart(2, '0')}-2025`,
      mesic: `${mesic} 2025`,
      mhTyden: 36, // Defaultní hodnota 36 hodin
      projekt: cw === 52 ? 'DOVOLENÁ' : 'FREE'  // CW52 defaultně "DOVOLENÁ"
    });
  }
  
  // Pak generujeme týdny pro celý rok 2026 (CW01-52)
  for (let cw = 1; cw <= 52; cw++) {
    let monthIndex;
    if (cw <= 5) monthIndex = 0; // leden
    else if (cw <= 9) monthIndex = 1; // únor
    else if (cw <= 13) monthIndex = 2; // březen
    else if (cw <= 17) monthIndex = 3; // duben
    else if (cw <= 22) monthIndex = 4; // květen
    else if (cw <= 26) monthIndex = 5; // červen
    else if (cw <= 30) monthIndex = 6; // červenec
    else if (cw <= 35) monthIndex = 7; // srpen
    else if (cw <= 39) monthIndex = 8; // září
    else if (cw <= 43) monthIndex = 9; // říjen
    else if (cw <= 47) monthIndex = 10; // listopad
    else monthIndex = 11; // prosinec
    
    const mesic = months[monthIndex];
    
    weeks.push({
      cw: `CW${cw.toString().padStart(2, '0')}-2026`,
      mesic: `${mesic} 2026`,
      mhTyden: 36, // Defaultní hodnota 36 hodin
      projekt: cw === 52 ? 'DOVOLENÁ' : 'FREE'  // CW52 defaultně "DOVOLENÁ"
    });
  }
  
  return weeks;
};

// Transformace dat z contextu do formátu editoru
const generatePlanningDataForEditor = (data: any[]): { [key: string]: WeekPlan[] } => {
  const result: { [key: string]: WeekPlan[] } = {};
  
  // Vytvoříme mapu existujících dat - data už přicházejí z planning_matrix s plným CW formátem
  const existingDataMap: { [key: string]: { [key: string]: WeekPlan } } = {};
  data.forEach(entry => {
    if (!existingDataMap[entry.konstrukter]) {
      existingDataMap[entry.konstrukter] = {};
    }
    
    // Data už přicházejí s plným CW formátem z planning_matrix view
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
    
    // Filtrujeme pouze relevantní týdny (CW32-52 pro 2025 + CW01-52 pro 2026)
    const relevantExistingData = Object.keys(existingDataMap[konstrukter] || {})
      .filter(cw => {
        // Nový formát obsahuje rok, takže můžeme filtrovat přímo
        return cw.includes('-2025') || cw.includes('-2026');
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
  const { 
    planningData,
    engineers,
    updatePlanningEntry, 
    updatePlanningHours
  } = usePlanning();
  
  // Convert engineers to the format expected by existing code
  const allKonstrukteri = engineers.map(eng => ({
    jmeno: eng.display_name,
    slug: eng.slug,
    id: eng.id
  }));
  
  const [projects, setProjects] = useState<DatabaseProject[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Vytvořím plánová data pro všechny konstruktéry, včetně těch bez dat
  const planData = useMemo(() => {
    const generatedData = generatePlanningDataForEditor(planningData);
    
    // Ujistím se, že všichni konstruktéři z seznamu jsou k dispozici
    allKonstrukteri.forEach(konstrukter => {
      if (!generatedData[konstrukter.jmeno]) {
        // Pokud konstruktér nemá data, vytvoř pro něj prázdný plán
        generatedData[konstrukter.jmeno] = generateAllWeeks();
      }
    });
    
    return generatedData;
  }, [planningData, allKonstrukteri]);
  
  const konstrukteri = useMemo(() => allKonstrukteri.map(k => k.jmeno).sort(), [allKonstrukteri]);
  
  const [editingCell, setEditingCell] = useState<EditableCell | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [selectedKonstrukter, setSelectedKonstrukter] = useState<string>(konstrukteri[0] || '');
  useEffect(() => {
    if ((!selectedKonstrukter || !konstrukteri.includes(selectedKonstrukter)) && konstrukteri.length > 0) {
      setSelectedKonstrukter(konstrukteri[0]);
    }
  }, [konstrukteri, selectedKonstrukter]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false);
  const [selectedWeeks, setSelectedWeeks] = useState<Set<string>>(new Set());
  const [availableProjectsLocal, setAvailableProjectsLocal] = useState<string[]>(availableProjects);
  const [copyFromKonstrukter, setCopyFromKonstrukter] = useState<string>('');
  const [bulkProject, setBulkProject] = useState<string>('');  // vybraný projekt (čeká na potvrzení)
  const [bulkHours, setBulkHours] = useState<string>('');      // hodiny v textu (kvůli prázdné hodnotě)

  // Načteme projekty z databáze
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('status', 'active')
          .eq('project_status', 'Realizace');
        
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
    const allCodes = Array.from(new Set([...staticProjects, ...dynamicProjects]));
    
    // Speciální položky na konec
    const specialItems = ['FREE', 'DOVOLENÁ', 'NEMOC', 'OVER'];
    const regularProjects = allCodes.filter(code => !specialItems.includes(code)).sort();
    const specialProjects = allCodes.filter(code => specialItems.includes(code));
    
    return [...regularProjects, ...specialProjects];
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
    if (field === 'projekt') {
      updatePlanningEntry(konstrukter, cw, value as string);
    } else if (field === 'mhTyden') {
      updatePlanningHours(konstrukter, cw, value as number);
    }
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

  const applyBulkChanges = async () => {
    if (selectedWeeks.size === 0) {
      alert('Nejsou vybrané žádné týdny.');
      return;
    }
    if (!bulkProject) {
      alert('Vyber projekt.');
      return;
    }
    const hoursNum = parseInt(bulkHours, 10);
    if (Number.isNaN(hoursNum)) {
      alert('Zadej počet hodin na týden (číslo).');
      return;
    }

    // Zapisuj pro každý vybraný týden – nejdřív projekt, pak hodiny
    for (const cw of selectedWeeks) {
      await updateCell(selectedKonstrukter, cw, 'projekt', bulkProject);
      await updateCell(selectedKonstrukter, cw, 'mhTyden', hoursNum);
    }

    // úklid
    setBulkProject('');
    setBulkHours('');
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
      setSelectedKonstrukter(newName);
    }
  };

  const copyPlan = async (from: string, to: string) => {
    console.log('Copying plan from:', from, 'to:', to);
    
    // Find all weeks for the source constructor
    const sourceWeeks = planningData.filter(entry => 
      normalizeName(entry.konstrukter) === normalizeName(from)
    );
    
    if (sourceWeeks.length === 0) {
      alert(`Žádný plán nebyl nalezen pro konstruktéra ${from}`);
      return;
    }
    
    // Copy each week's data to the target constructor
    for (const sourceWeek of sourceWeeks) {
      try {
        await updatePlanningEntry(to, sourceWeek.cw, sourceWeek.projekt || 'FREE');
        await updatePlanningHours(to, sourceWeek.cw, sourceWeek.mhTyden || 0);
      } catch (error) {
        console.error('Error copying week:', sourceWeek.cw, error);
      }
    }
    
    console.log('Plan copy completed');
    alert(`Plán byl úspěšně zkopírován z ${from} do ${to}`);
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
          </div>
        </div>
      </div>


      {/* Bulk Edit Panel */}
      {isMultiSelectMode && selectedWeeks.size > 0 && (
        <Card className="p-4 shadow-card-custom border-primary">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-sm font-medium whitespace-nowrap">
              Vybráno {selectedWeeks.size} týdnů pro {selectedKonstrukter}
            </div>

            <div className="flex gap-2 items-center flex-wrap">
              {/* 1) Projekt – jen uložit do stavu, nic neaplikovat */}
              <Select value={bulkProject} onValueChange={setBulkProject}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Vyber projekt" />
                </SelectTrigger>
                <SelectContent>
                  {allProjectCodes.map((projekt) => (
                    <SelectItem key={projekt} value={projekt}>
                      {projekt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 2) Hodiny – jen uložit do stavu */}
              <Input
                type="number"
                inputMode="numeric"
                placeholder="Hodiny / týden"
                className="w-32"
                value={bulkHours}
                onChange={(e) => setBulkHours(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault(); // zabraň „implicitnímu submitu"
                    applyBulkChanges();
                  }
                }}
              />

              {/* 3) Tlačítka – POTVRDIT / ZRUŠIT */}
              <Button
                onClick={applyBulkChanges}
                disabled={!bulkProject || bulkHours.trim() === '' || selectedWeeks.size === 0}
              >
                Použít
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setBulkProject('');
                  setBulkHours('');
                  clearSelection();
                }}
              >
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
            <SelectContent className="max-h-[300px] overflow-y-auto">
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
            <SelectContent className="max-h-[300px] overflow-y-auto">
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
                         value={editingValue}
                         onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => {
                            const numValue = parseInt(editingValue) || 0;
                            console.log('HOURS_EDIT_DEBUG:', { editingValue, numValue, konstrukter: selectedKonstrukter, cw: week.cw });
                            setEditingCell(null);
                            setEditingValue('');
                            updateCell(selectedKonstrukter, week.cw, 'mhTyden', numValue);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const numValue = parseInt(editingValue) || 0;
                              console.log('HOURS_EDIT_DEBUG:', { editingValue, numValue, konstrukter: selectedKonstrukter, cw: week.cw });
                              setEditingCell(null);
                              setEditingValue('');
                              updateCell(selectedKonstrukter, week.cw, 'mhTyden', numValue);
                            }
                          }}
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
                               setEditingValue(week.mhTyden?.toString() || '0');
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