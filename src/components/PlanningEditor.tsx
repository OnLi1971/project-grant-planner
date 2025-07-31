import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Edit, Save, X, Plus, MousePointer, MousePointer2 } from 'lucide-react';
import { usePlanning } from '@/contexts/PlanningContext';

interface WeekPlan {
  cw: string;
  mesic: string;
  mhTyden: number;
  projekt: string;
}

interface EditableCell {
  konstrukter: string;
  cw: string;
  field: 'projekt' | 'mhTyden';
}

// Dostupné projekty
const availableProjects = [
  'ST_EMU_INT', 'ST_TRAM_INT', 'ST_MAINZ', 'ST_KASSEL', 'ST_BLAVA', 'ST_FEM', 'ST_POZAR', 
  'NU_CRAIN', 'WA_HVAC', 'ST_JIGS', 'ST_TRAM_HS', 'SAF_FEM', 'FREE', 'DOVOLENÁ'
];

// Transformace dat z contextu do formátu editoru
const generatePlanningDataForEditor = (data: any[]): { [key: string]: WeekPlan[] } => {
  const result: { [key: string]: WeekPlan[] } = {};
  
  // Skupina konstruktérů podle jmen
  data.forEach(entry => {
    if (!result[entry.konstrukter]) {
      result[entry.konstrukter] = [];
    }
    
    result[entry.konstrukter].push({
      cw: entry.cw,
      mesic: entry.mesic,
      mhTyden: entry.mhTyden,
      projekt: entry.projekt
    });
  });
  
  // Seřadí týdny podle CW
  Object.keys(result).forEach(konstrukter => {
    result[konstrukter].sort((a, b) => {
      const aNum = parseInt(a.cw.replace('CW', ''));
      const bNum = parseInt(b.cw.replace('CW', ''));
      return aNum - bNum;
    });
  });
  
  return result;
};

export const PlanningEditor: React.FC = () => {
  const { planningData, updatePlanningEntry, addEngineer, savePlan } = usePlanning();
  
  const planData = useMemo(() => generatePlanningDataForEditor(planningData), [planningData]);
  const konstrukteri = useMemo(() => Object.keys(planData).sort(), [planData]);
  
  const [editingCell, setEditingCell] = useState<EditableCell | null>(null);
  const [selectedKonstrukter, setSelectedKonstrukter] = useState<string>(konstrukteri[0] || '');
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false);
  const [selectedWeeks, setSelectedWeeks] = useState<Set<string>>(new Set());

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
    if (projekt.startsWith('ST_')) return <Badge className="bg-primary">ST Projekt</Badge>;
    if (projekt.startsWith('NU_')) return <Badge className="bg-warning text-warning-foreground">NUVIA</Badge>;
    if (projekt.startsWith('WA_')) return <Badge className="bg-success">WABTEC</Badge>;
    if (projekt.startsWith('SAF_')) return <Badge style={{backgroundColor: 'hsl(280 100% 70%)', color: 'white'}}>SAFRAN</Badge>;
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
              variant={isMultiSelectMode ? "default" : "secondary"} 
              onClick={() => {
                setIsMultiSelectMode(!isMultiSelectMode);
                if (isMultiSelectMode) clearSelection();
              }}
              className="bg-white/10 hover:bg-white/20"
            >
              <MousePointer2 className="h-4 w-4 mr-2" />
              {isMultiSelectMode ? 'Ukončit výběr' : 'Vybrat více týdnů'}
            </Button>
            <Button variant="secondary" onClick={addNewEngineer} className="bg-white/10 hover:bg-white/20">
              <Plus className="h-4 w-4 mr-2" />
              Přidat konstruktéra
            </Button>
            <Button variant="secondary" onClick={savePlan} className="bg-white/10 hover:bg-white/20">
              <Save className="h-4 w-4 mr-2" />
              Uložit plán
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 shadow-card-custom">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{konstrukteri.length}</div>
            <div className="text-sm text-muted-foreground">Celkem konstruktérů</div>
          </div>
        </Card>
        <Card className="p-4 shadow-card-custom">
          <div className="text-center">
            <div className="text-2xl font-bold text-success">
              {currentPlan.filter(w => w.projekt && w.projekt !== 'FREE' && w.projekt !== 'DOVOLENÁ').length}
            </div>
            <div className="text-sm text-muted-foreground">Aktivní týdny</div>
          </div>
        </Card>
        <Card className="p-4 shadow-card-custom">
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">
              {currentPlan.filter(w => w.projekt === 'FREE').length}
            </div>
            <div className="text-sm text-muted-foreground">Volné týdny</div>
          </div>
        </Card>
        <Card className="p-4 shadow-card-custom">
          <div className="text-center">
            <div className="text-2xl font-bold text-accent">
              {currentPlan.reduce((sum, w) => sum + w.mhTyden, 0)}h
            </div>
            <div className="text-sm text-muted-foreground">Celkem hodin</div>
          </div>
        </Card>
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
                  {availableProjects.map(projekt => (
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
        <div className="flex items-center gap-4">
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
                            week.mhTyden > 0 ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {week.mhTyden}h
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
                          {availableProjects.map(projekt => (
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