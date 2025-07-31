import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Edit, Save, X, Plus } from 'lucide-react';

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

// Reálná data z vašeho plánu
const realPlanningData: { [key: string]: WeekPlan[] } = {
  'Hlavan Martin': [
    { cw: 'CW32', mesic: 'August', mhTyden: 36, projekt: 'ST_BLAVA' },
    { cw: 'CW33', mesic: 'August', mhTyden: 36, projekt: 'ST_BLAVA' },
    { cw: 'CW34', mesic: 'August', mhTyden: 36, projekt: 'ST_BLAVA' },
    { cw: 'CW35', mesic: 'August', mhTyden: 36, projekt: 'ST_BLAVA' },
    { cw: 'CW36', mesic: 'September', mhTyden: 36, projekt: 'ST_BLAVA' },
    { cw: 'CW37', mesic: 'September', mhTyden: 36, projekt: 'ST_BLAVA' },
    { cw: 'CW38', mesic: 'September', mhTyden: 36, projekt: 'ST_BLAVA' },
    { cw: 'CW39', mesic: 'September', mhTyden: 36, projekt: 'ST_BLAVA' },
    { cw: 'CW40', mesic: 'October', mhTyden: 36, projekt: 'ST_BLAVA' },
    { cw: 'CW41', mesic: 'October', mhTyden: 36, projekt: 'ST_BLAVA' },
    { cw: 'CW42', mesic: 'October', mhTyden: 36, projekt: 'ST_BLAVA' },
    { cw: 'CW43', mesic: 'October', mhTyden: 36, projekt: 'ST_BLAVA' },
    { cw: 'CW44', mesic: 'October', mhTyden: 36, projekt: 'ST_BLAVA' },
    { cw: 'CW45', mesic: 'November', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW46', mesic: 'November', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW47', mesic: 'November', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW48', mesic: 'November', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW49', mesic: 'December', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW50', mesic: 'December', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW51', mesic: 'December', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW52', mesic: 'December', mhTyden: 36, projekt: 'ST_MAINZ' }
  ],
  'Fica Ladislav': [
    { cw: 'CW32', mesic: 'August', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW33', mesic: 'August', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW34', mesic: 'August', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW35', mesic: 'August', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW36', mesic: 'September', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW37', mesic: 'September', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW38', mesic: 'September', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW39', mesic: 'September', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW40', mesic: 'October', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW41', mesic: 'October', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW42', mesic: 'October', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW43', mesic: 'October', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW44', mesic: 'October', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW45', mesic: 'November', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW46', mesic: 'November', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW47', mesic: 'November', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW48', mesic: 'November', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW49', mesic: 'December', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW50', mesic: 'December', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW51', mesic: 'December', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW52', mesic: 'December', mhTyden: 36, projekt: 'ST_MAINZ' }
  ],
  'Ambrož David': [
    { cw: 'CW32', mesic: 'August', mhTyden: 36, projekt: 'DOVOLENÁ' },
    { cw: 'CW33', mesic: 'August', mhTyden: 36, projekt: 'ST_BLAVA' },
    { cw: 'CW34', mesic: 'August', mhTyden: 36, projekt: 'DOVOLENÁ' },
    { cw: 'CW35', mesic: 'August', mhTyden: 36, projekt: 'DOVOLENÁ' },
    { cw: 'CW36', mesic: 'September', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW37', mesic: 'September', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW38', mesic: 'September', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW39', mesic: 'September', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW40', mesic: 'October', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW41', mesic: 'October', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW42', mesic: 'October', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW43', mesic: 'October', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW44', mesic: 'October', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW45', mesic: 'November', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW46', mesic: 'November', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW47', mesic: 'November', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW48', mesic: 'November', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW49', mesic: 'December', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW50', mesic: 'December', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW51', mesic: 'December', mhTyden: 36, projekt: 'ST_MAINZ' },
    { cw: 'CW52', mesic: 'December', mhTyden: 36, projekt: 'ST_MAINZ' }
  ],
  'Slavík Ondřej': [
    { cw: 'CW32', mesic: 'August', mhTyden: 36, projekt: 'ST_EMU_INT' },
    { cw: 'CW33', mesic: 'August', mhTyden: 36, projekt: 'ST_EMU_INT' },
    { cw: 'CW34', mesic: 'August', mhTyden: 36, projekt: 'ST_EMU_INT' },
    { cw: 'CW35', mesic: 'August', mhTyden: 36, projekt: 'ST_EMU_INT' },
    { cw: 'CW36', mesic: 'September', mhTyden: 36, projekt: 'ST_EMU_INT' },
    { cw: 'CW37', mesic: 'September', mhTyden: 36, projekt: 'ST_EMU_INT' },
    { cw: 'CW38', mesic: 'September', mhTyden: 36, projekt: 'ST_EMU_INT' },
    { cw: 'CW39', mesic: 'September', mhTyden: 36, projekt: 'ST_EMU_INT' },
    { cw: 'CW40', mesic: 'October', mhTyden: 36, projekt: 'ST_EMU_INT' },
    { cw: 'CW41', mesic: 'October', mhTyden: 36, projekt: 'ST_EMU_INT' },
    { cw: 'CW42', mesic: 'October', mhTyden: 36, projekt: 'ST_EMU_INT' },
    { cw: 'CW43', mesic: 'October', mhTyden: 36, projekt: 'ST_EMU_INT' },
    { cw: 'CW44', mesic: 'October', mhTyden: 36, projekt: 'ST_EMU_INT' },
    { cw: 'CW45', mesic: 'November', mhTyden: 36, projekt: 'ST_EMU_INT' },
    { cw: 'CW46', mesic: 'November', mhTyden: 36, projekt: 'ST_EMU_INT' },
    { cw: 'CW47', mesic: 'November', mhTyden: 36, projekt: 'ST_EMU_INT' },
    { cw: 'CW48', mesic: 'November', mhTyden: 36, projekt: 'ST_EMU_INT' },
    { cw: 'CW49', mesic: 'December', mhTyden: 36, projekt: 'ST_EMU_INT' },
    { cw: 'CW50', mesic: 'December', mhTyden: 36, projekt: 'ST_EMU_INT' },
    { cw: 'CW51', mesic: 'December', mhTyden: 36, projekt: 'ST_EMU_INT' },
    { cw: 'CW52', mesic: 'December', mhTyden: 0, projekt: 'FREE' }
  ],
  'Friedlová Jiřina': [
    { cw: 'CW32', mesic: 'August', mhTyden: 36, projekt: 'ST_BLAVA' },
    { cw: 'CW33', mesic: 'August', mhTyden: 36, projekt: 'ST_POZAR' },
    { cw: 'CW34', mesic: 'August', mhTyden: 36, projekt: 'ST_EMU_INT' },
    { cw: 'CW35', mesic: 'August', mhTyden: 36, projekt: 'ST_TRAM_INT' },
    { cw: 'CW36', mesic: 'September', mhTyden: 36, projekt: 'DOVOLENÁ' },
    { cw: 'CW37', mesic: 'September', mhTyden: 36, projekt: 'ST_TRAM_HS' },
    { cw: 'CW38', mesic: 'September', mhTyden: 36, projekt: 'ST_EMU_INT' },
    { cw: 'CW39', mesic: 'September', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW40', mesic: 'October', mhTyden: 36, projekt: 'ST_POZAR' },
    { cw: 'CW41', mesic: 'October', mhTyden: 36, projekt: 'ST_TRAM_HS' },
    { cw: 'CW42', mesic: 'October', mhTyden: 36, projekt: 'ST_TRAM_INT' },
    { cw: 'CW43', mesic: 'October', mhTyden: 36, projekt: 'ST_POZAR' },
    { cw: 'CW44', mesic: 'October', mhTyden: 36, projekt: 'ST_EMU_INT' },
    { cw: 'CW45', mesic: 'November', mhTyden: 36, projekt: 'ST_BLAVA' },
    { cw: 'CW46', mesic: 'November', mhTyden: 36, projekt: 'ST_POZAR' },
    { cw: 'CW47', mesic: 'November', mhTyden: 36, projekt: 'ST_EMU_INT' },
    { cw: 'CW48', mesic: 'November', mhTyden: 36, projekt: 'ST_TRAM_INT' },
    { cw: 'CW49', mesic: 'December', mhTyden: 36, projekt: 'ST_POZAR' },
    { cw: 'CW50', mesic: 'December', mhTyden: 36, projekt: 'ST_TRAM_HS' },
    { cw: 'CW51', mesic: 'December', mhTyden: 36, projekt: 'ST_EMU_INT' },
    { cw: 'CW52', mesic: 'December', mhTyden: 0, projekt: 'FREE' }
  ],
  'Madanský Peter': [
    { cw: 'CW32', mesic: 'August', mhTyden: 36, projekt: 'NU_CRAIN' },
    { cw: 'CW33', mesic: 'August', mhTyden: 36, projekt: 'NU_CRAIN' },
    { cw: 'CW34', mesic: 'August', mhTyden: 36, projekt: 'NU_CRAIN' },
    { cw: 'CW35', mesic: 'August', mhTyden: 36, projekt: 'NU_CRAIN' },
    { cw: 'CW36', mesic: 'September', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW37', mesic: 'September', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW38', mesic: 'September', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW39', mesic: 'September', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW40', mesic: 'October', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW41', mesic: 'October', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW42', mesic: 'October', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW43', mesic: 'October', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW44', mesic: 'October', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW45', mesic: 'November', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW46', mesic: 'November', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW47', mesic: 'November', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW48', mesic: 'November', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW49', mesic: 'December', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW50', mesic: 'December', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW51', mesic: 'December', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW52', mesic: 'December', mhTyden: 0, projekt: 'FREE' }
  ],
  'Nedavaška Petr': [
    { cw: 'CW32', mesic: 'August', mhTyden: 36, projekt: 'ST_BLAVA' },
    { cw: 'CW33', mesic: 'August', mhTyden: 36, projekt: 'ST_BLAVA' },
    { cw: 'CW34', mesic: 'August', mhTyden: 36, projekt: 'ST_BLAVA' },
    { cw: 'CW35', mesic: 'August', mhTyden: 36, projekt: 'ST_BLAVA' },
    { cw: 'CW36', mesic: 'September', mhTyden: 36, projekt: 'SAF_FEM' },
    { cw: 'CW37', mesic: 'September', mhTyden: 36, projekt: 'SAF_FEM' },
    { cw: 'CW38', mesic: 'September', mhTyden: 36, projekt: 'SAF_FEM' },
    { cw: 'CW39', mesic: 'September', mhTyden: 36, projekt: 'SAF_FEM' },
    { cw: 'CW40', mesic: 'October', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW41', mesic: 'October', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW42', mesic: 'October', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW43', mesic: 'October', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW44', mesic: 'October', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW45', mesic: 'November', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW46', mesic: 'November', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW47', mesic: 'November', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW48', mesic: 'November', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW49', mesic: 'December', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW50', mesic: 'December', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW51', mesic: 'December', mhTyden: 0, projekt: 'FREE' },
    { cw: 'CW52', mesic: 'December', mhTyden: 0, projekt: 'FREE' }
  ]
};

// Seznam konstruktérů podle reálných dat
const konstrukteri = Object.keys(realPlanningData);

export const PlanningEditor: React.FC = () => {
  const [planData, setPlanData] = useState<{ [key: string]: WeekPlan[] }>(realPlanningData);
  const [editingCell, setEditingCell] = useState<EditableCell | null>(null);
  const [selectedKonstrukter, setSelectedKonstrukter] = useState<string>(konstrukteri[0]);

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
    if (projekt === 'FREE') return <Badge variant="secondary">Volný</Badge>;
    if (projekt === 'DOVOLENÁ') return <Badge variant="outline" className="border-accent">Dovolená</Badge>;
    if (projekt.startsWith('ST_')) return <Badge className="bg-primary">ST Projekt</Badge>;
    if (projekt.startsWith('NU_')) return <Badge className="bg-warning text-warning-foreground">NUVIA</Badge>;
    if (projekt.startsWith('WA_')) return <Badge className="bg-success">WABTEC</Badge>;
    if (projekt.startsWith('SAF_')) return <Badge style={{backgroundColor: 'hsl(280 100% 70%)', color: 'white'}}>SAFRAN</Badge>;
    return <Badge variant="outline">{projekt}</Badge>;
  };

  const currentPlan = planData[selectedKonstrukter] || [];

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
            <Button variant="secondary" className="bg-white/10 hover:bg-white/20">
              <Save className="h-4 w-4 mr-2" />
              Uložit plán
            </Button>
          </div>
        </div>
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
                  
                  <td className="p-3">
                    {getProjectBadge(week.projekt || 'FREE')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Sumarizace */}
      <Card className="p-4 shadow-card-custom">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {currentPlan.reduce((sum, week) => sum + week.mhTyden, 0)}h
            </div>
            <div className="text-sm text-muted-foreground">Celkem hodin</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">
              {currentPlan.filter(week => week.mhTyden >= 36).length}
            </div>
            <div className="text-sm text-muted-foreground">Plně vytížené týdny</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">
              {currentPlan.filter(week => (week.projekt || 'FREE') === 'FREE').length}
            </div>
            <div className="text-sm text-muted-foreground">Volné týdny</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent">
              {currentPlan.filter(week => week.projekt === 'DOVOLENÁ').length}
            </div>
            <div className="text-sm text-muted-foreground">Týdny dovolené</div>
          </div>
        </div>
      </Card>
    </div>
  );
};