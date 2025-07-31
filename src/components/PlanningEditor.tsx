import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Edit, Save, X, Plus } from 'lucide-react';
import { planningData } from '@/data/planningData';

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

// Transformace importovaných dat do formátu editoru
const generatePlanningDataForEditor = (): { [key: string]: WeekPlan[] } => {
  const result: { [key: string]: WeekPlan[] } = {};
  
  // Skupina konstruktérů podle jmen
  planningData.forEach(entry => {
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
  const realPlanningData = useMemo(() => generatePlanningDataForEditor(), []);
  const konstrukteri = useMemo(() => Object.keys(realPlanningData).sort(), [realPlanningData]);
  
  const [planData, setPlanData] = useState<{ [key: string]: WeekPlan[] }>(realPlanningData);
  const [editingCell, setEditingCell] = useState<EditableCell | null>(null);
  const [selectedKonstrukter, setSelectedKonstrukter] = useState<string>(konstrukteri[0] || '');

  const updateCell = (konstrukter: string, cw: string, field: 'projekt' | 'mhTyden', value: string | number) => {
    setPlanData(prev => ({
      ...prev,
      [konstrukter]: prev[konstrukter].map(week => 
        week.cw === cw 
          ? { ...week, [field]: value }
          : week
      )
    }));
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
      const weeks = ['CW32', 'CW33', 'CW34', 'CW35', 'CW36', 'CW37', 'CW38', 'CW39', 'CW40', 'CW41', 'CW42', 'CW43', 'CW44', 'CW45', 'CW46', 'CW47', 'CW48', 'CW49', 'CW50', 'CW51', 'CW52'];
      const months = ['August', 'August', 'August', 'August', 'September', 'September', 'September', 'September', 'October', 'October', 'October', 'October', 'October', 'November', 'November', 'November', 'November', 'December', 'December', 'December', 'December'];
      
      const newPlan = weeks.map((week, index) => ({
        cw: week,
        mesic: months[index],
        mhTyden: 0,
        projekt: 'FREE'
      }));
      
      setPlanData(prev => ({
        ...prev,
        [newName]: newPlan
      }));
      
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
            <Button variant="secondary" onClick={addNewEngineer} className="bg-white/10 hover:bg-white/20">
              <Plus className="h-4 w-4 mr-2" />
              Přidat konstruktéra
            </Button>
            <Button variant="secondary" className="bg-white/10 hover:bg-white/20">
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

      {/* Selector konstruktéra */}
      <Card className="p-4 shadow-card-custom">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Konstruktér:</label>
          <Select value={selectedKonstrukter} onValueChange={setSelectedKonstrukter}>
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
              {currentPlan.map((week, index) => (
                <tr 
                  key={week.cw}
                  className={`
                    border-b transition-colors hover:bg-planning-cell-hover
                    ${index % 2 === 0 ? 'bg-planning-cell' : 'bg-planning-stripe'}
                  `}
                >
                  <td className="p-3 font-mono font-medium">{week.cw}</td>
                  <td className="p-3 text-muted-foreground">{week.mesic}</td>
                  
                  {/* Editovatelné MH/týden */}
                  <td className="p-3">
                    {editingCell?.konstrukter === selectedKonstrukter && 
                     editingCell?.cw === week.cw && 
                     editingCell?.field === 'mhTyden' ? (
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
                        className="cursor-pointer hover:bg-muted p-1 rounded flex items-center gap-2"
                        onClick={() => setEditingCell({ konstrukter: selectedKonstrukter, cw: week.cw, field: 'mhTyden' })}
                      >
                        <span className={`font-medium ${
                          week.mhTyden >= 40 ? 'text-success' :
                          week.mhTyden >= 20 ? 'text-warning' :
                          week.mhTyden > 0 ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {week.mhTyden}h
                        </span>
                        <Edit className="h-3 w-3 opacity-50" />
                      </div>
                    )}
                  </td>
                  
                  {/* Editovatelný projekt */}
                  <td className="p-3">
                    {editingCell?.konstrukter === selectedKonstrukter && 
                     editingCell?.cw === week.cw && 
                     editingCell?.field === 'projekt' ? (
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
                        className="cursor-pointer hover:bg-muted p-1 rounded flex items-center gap-2"
                        onClick={() => setEditingCell({ konstrukter: selectedKonstrukter, cw: week.cw, field: 'projekt' })}
                      >
                        <span className="font-medium">{week.projekt || 'FREE'}</span>
                        <Edit className="h-3 w-3 opacity-50" />
                      </div>
                    )}
                  </td>
                  
                  {/* Status badge */}
                  <td className="p-3">
                    {getProjectBadge(week.projekt)}
                  </td>
                </tr>
              ))}
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