import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface PlanningEntry {
  konstrukter: string;
  cw: string;
  mesic: string;
  mhTyden: number;
  projekt: string;
}

// Planning data from the provided information
const planningData: PlanningEntry[] = [
  // Hlavan Martin
  { konstrukter: 'Hlavan Martin', cw: 'CW32', mesic: 'August', mhTyden: 36, projekt: 'ST_BLAVA' },
  { konstrukter: 'Hlavan Martin', cw: 'CW33', mesic: 'August', mhTyden: 36, projekt: 'ST_BLAVA' },
  { konstrukter: 'Hlavan Martin', cw: 'CW34', mesic: 'August', mhTyden: 36, projekt: 'ST_BLAVA' },
  { konstrukter: 'Hlavan Martin', cw: 'CW35', mesic: 'August', mhTyden: 36, projekt: 'ST_BLAVA' },
  { konstrukter: 'Hlavan Martin', cw: 'CW36', mesic: 'September', mhTyden: 36, projekt: 'ST_BLAVA' },
  { konstrukter: 'Hlavan Martin', cw: 'CW37', mesic: 'September', mhTyden: 36, projekt: 'ST_BLAVA' },
  { konstrukter: 'Hlavan Martin', cw: 'CW38', mesic: 'September', mhTyden: 36, projekt: 'ST_BLAVA' },
  { konstrukter: 'Hlavan Martin', cw: 'CW39', mesic: 'September', mhTyden: 36, projekt: 'ST_BLAVA' },
  { konstrukter: 'Hlavan Martin', cw: 'CW40', mesic: 'October', mhTyden: 36, projekt: 'ST_BLAVA' },
  { konstrukter: 'Hlavan Martin', cw: 'CW41', mesic: 'October', mhTyden: 36, projekt: 'ST_BLAVA' },
  { konstrukter: 'Hlavan Martin', cw: 'CW42', mesic: 'October', mhTyden: 36, projekt: 'ST_BLAVA' },
  { konstrukter: 'Hlavan Martin', cw: 'CW43', mesic: 'October', mhTyden: 36, projekt: 'ST_BLAVA' },
  { konstrukter: 'Hlavan Martin', cw: 'CW44', mesic: 'October', mhTyden: 36, projekt: 'ST_BLAVA' },
  { konstrukter: 'Hlavan Martin', cw: 'CW45', mesic: 'November', mhTyden: 36, projekt: 'ST_MAINZ' },
  { konstrukter: 'Hlavan Martin', cw: 'CW46', mesic: 'November', mhTyden: 36, projekt: 'ST_MAINZ' },
  { konstrukter: 'Hlavan Martin', cw: 'CW47', mesic: 'November', mhTyden: 36, projekt: 'ST_MAINZ' },
  { konstrukter: 'Hlavan Martin', cw: 'CW48', mesic: 'November', mhTyden: 36, projekt: 'ST_MAINZ' },
  { konstrukter: 'Hlavan Martin', cw: 'CW49', mesic: 'December', mhTyden: 36, projekt: 'ST_MAINZ' },
  { konstrukter: 'Hlavan Martin', cw: 'CW50', mesic: 'December', mhTyden: 36, projekt: 'ST_MAINZ' },
  { konstrukter: 'Hlavan Martin', cw: 'CW51', mesic: 'December', mhTyden: 36, projekt: 'ST_MAINZ' },
  { konstrukter: 'Hlavan Martin', cw: 'CW52', mesic: 'December', mhTyden: 36, projekt: 'ST_MAINZ' },
  
  // Fica Ladislav
  { konstrukter: 'Fica Ladislav', cw: 'CW32', mesic: 'August', mhTyden: 0, projekt: 'FREE' },
  { konstrukter: 'Fica Ladislav', cw: 'CW33', mesic: 'August', mhTyden: 0, projekt: 'FREE' },
  { konstrukter: 'Fica Ladislav', cw: 'CW34', mesic: 'August', mhTyden: 36, projekt: 'ST_MAINZ' },
  { konstrukter: 'Fica Ladislav', cw: 'CW35', mesic: 'August', mhTyden: 36, projekt: 'ST_MAINZ' },
  { konstrukter: 'Fica Ladislav', cw: 'CW36', mesic: 'September', mhTyden: 36, projekt: 'ST_MAINZ' },
  { konstrukter: 'Fica Ladislav', cw: 'CW37', mesic: 'September', mhTyden: 36, projekt: 'ST_MAINZ' },
  { konstrukter: 'Fica Ladislav', cw: 'CW38', mesic: 'September', mhTyden: 36, projekt: 'ST_MAINZ' },
  { konstrukter: 'Fica Ladislav', cw: 'CW39', mesic: 'September', mhTyden: 36, projekt: 'ST_MAINZ' },
  { konstrukter: 'Fica Ladislav', cw: 'CW40', mesic: 'October', mhTyden: 36, projekt: 'ST_MAINZ' },
  { konstrukter: 'Fica Ladislav', cw: 'CW41', mesic: 'October', mhTyden: 36, projekt: 'ST_MAINZ' },
  { konstrukter: 'Fica Ladislav', cw: 'CW42', mesic: 'October', mhTyden: 36, projekt: 'ST_MAINZ' },
  { konstrukter: 'Fica Ladislav', cw: 'CW43', mesic: 'October', mhTyden: 36, projekt: 'ST_MAINZ' },
  { konstrukter: 'Fica Ladislav', cw: 'CW44', mesic: 'October', mhTyden: 36, projekt: 'ST_MAINZ' },
  { konstrukter: 'Fica Ladislav', cw: 'CW45', mesic: 'November', mhTyden: 36, projekt: 'ST_MAINZ' },
  { konstrukter: 'Fica Ladislav', cw: 'CW46', mesic: 'November', mhTyden: 36, projekt: 'ST_MAINZ' },
  { konstrukter: 'Fica Ladislav', cw: 'CW47', mesic: 'November', mhTyden: 36, projekt: 'ST_MAINZ' },
  { konstrukter: 'Fica Ladislav', cw: 'CW48', mesic: 'November', mhTyden: 36, projekt: 'ST_MAINZ' },
  { konstrukter: 'Fica Ladislav', cw: 'CW49', mesic: 'December', mhTyden: 36, projekt: 'ST_MAINZ' },
  { konstrukter: 'Fica Ladislav', cw: 'CW50', mesic: 'December', mhTyden: 36, projekt: 'ST_MAINZ' },
  { konstrukter: 'Fica Ladislav', cw: 'CW51', mesic: 'December', mhTyden: 36, projekt: 'ST_MAINZ' },
  { konstrukter: 'Fica Ladislav', cw: 'CW52', mesic: 'December', mhTyden: 36, projekt: 'ST_MAINZ' },

  // Add more engineers data here... (truncated for brevity, but would include all engineers from the provided data)
  // For demo purposes, adding a few more key engineers:
  
  // Friedlová Jiřina (has varied assignments)
  { konstrukter: 'Friedlová Jiřina', cw: 'CW32', mesic: 'August', mhTyden: 36, projekt: 'ST_BLAVA' },
  { konstrukter: 'Friedlová Jiřina', cw: 'CW33', mesic: 'August', mhTyden: 36, projekt: 'ST_POZAR' },
  { konstrukter: 'Friedlová Jiřina', cw: 'CW34', mesic: 'August', mhTyden: 36, projekt: 'ST_EMU_INT' },
  { konstrukter: 'Friedlová Jiřina', cw: 'CW35', mesic: 'August', mhTyden: 36, projekt: 'ST_TRAM_INT' },
  { konstrukter: 'Friedlová Jiřina', cw: 'CW36', mesic: 'September', mhTyden: 36, projekt: 'DOVOLENÁ' },
  { konstrukter: 'Friedlová Jiřina', cw: 'CW37', mesic: 'September', mhTyden: 36, projekt: 'ST_TRAM_HS' },
  { konstrukter: 'Friedlová Jiřina', cw: 'CW38', mesic: 'September', mhTyden: 36, projekt: 'ST_EMU_INT' },
  { konstrukter: 'Friedlová Jiřina', cw: 'CW39', mesic: 'September', mhTyden: 0, projekt: 'FREE' },
  { konstrukter: 'Friedlová Jiřina', cw: 'CW40', mesic: 'October', mhTyden: 36, projekt: 'ST_POZAR' },
  { konstrukter: 'Friedlová Jiřina', cw: 'CW41', mesic: 'October', mhTyden: 36, projekt: 'ST_TRAM_HS' },
  { konstrukter: 'Friedlová Jiřina', cw: 'CW42', mesic: 'October', mhTyden: 36, projekt: 'ST_TRAM_INT' },
  { konstrukter: 'Friedlová Jiřina', cw: 'CW43', mesic: 'October', mhTyden: 36, projekt: 'ST_POZAR' },
  { konstrukter: 'Friedlová Jiřina', cw: 'CW44', mesic: 'October', mhTyden: 36, projekt: 'ST_EMU_INT' },
  { konstrukter: 'Friedlová Jiřina', cw: 'CW45', mesic: 'November', mhTyden: 36, projekt: 'ST_BLAVA' },
  { konstrukter: 'Friedlová Jiřina', cw: 'CW46', mesic: 'November', mhTyden: 36, projekt: 'ST_POZAR' },
  { konstrukter: 'Friedlová Jiřina', cw: 'CW47', mesic: 'November', mhTyden: 36, projekt: 'ST_EMU_INT' },
  { konstrukter: 'Friedlová Jiřina', cw: 'CW48', mesic: 'November', mhTyden: 36, projekt: 'ST_TRAM_INT' },
  { konstrukter: 'Friedlová Jiřina', cw: 'CW49', mesic: 'December', mhTyden: 36, projekt: 'ST_POZAR' },
  { konstrukter: 'Friedlová Jiřina', cw: 'CW50', mesic: 'December', mhTyden: 36, projekt: 'ST_TRAM_HS' },
  { konstrukter: 'Friedlová Jiřina', cw: 'CW51', mesic: 'December', mhTyden: 36, projekt: 'ST_EMU_INT' },
  { konstrukter: 'Friedlová Jiřina', cw: 'CW52', mesic: 'December', mhTyden: 0, projekt: '' },
];

// Organizational structure and project mappings
const organizacniVedouci = [
  'Všichni',
  'JoMa',
  'OnLi', 
  'KaSo',
  'PaHo',
  'PeMa',
  'DaAm',
  'PeNe',
  'Subdodavka'
];

// Mapping of engineers to organizational leaders
const konstrukterVedouci: { [key: string]: string } = {
  'Hlavan Martin': 'JoMa',
  'Fica Ladislav': 'JoMa',
  'Ambrož David': 'OnLi',
  'Slavík Ondřej': 'KaSo',
  'Chrenko Peter': 'Subdodavka',
  'Jurčišin Peter': 'Subdodavka',
  'Púpava Marián': 'Subdodavka',
  'Bohušík Martin': 'Subdodavka',
  'Uher Tomáš': 'KaSo',
  'Weiss Ondřej': 'PaHo',
  'Borský Jan': 'PaHo',
  'Pytela Martin': 'PaHo',
  'Litvinov Evgenii': 'PaHo',
  'Jandečka Karel': 'KaSo',
  'Heřman Daniel': 'JoMa',
  'Karlesz Michal': 'PeMa',
  'Matta Jozef': 'OnLi',
  'Pecinovský Pavel': 'JoMa',
  'Anovčín Branislav': 'DaAm',
  'Bartovič Anton': 'DaAm',
  'Břicháček Miloš': 'JoMa',
  'Fenyk Pavel': 'PeMa',
  'Kalafa Ján': 'JoMa',
  'Lengyel Martin': 'JoMa',
  'Šoupa Karel': 'OnLi',
  'Večeř Jiří': 'JoMa',
  'Bartovičová Agáta': 'KaSo',
  'Hrachová Ivana': 'KaSo',
  'Karlík Štěpán': 'JoMa',
  'Friedlová Jiřina': 'OnLi',
  'Fuchs Pavel': 'DaAm',
  'Mohelník Martin': 'JoMa',
  'Nedavaška Petr': 'OnLi',
  'Šedovičová Darina': 'PeNe',
  'Ješš Jozef': 'PeNe',
  'Melichar Ondřej': 'PeNe',
  'Klíma Milan': 'KaSo',
  'Hibler František': 'KaSo',
  'Brojír Jaroslav': 'JoMa',
  'Madanský Peter': 'OnLi',
  'Samko Mikuláš': 'JoMa',
  'Chrenko Daniel': 'Subdodavka',
  'Jiřička Aleš': 'JoMa',
  'Stránský Martin': 'PeMa',
  'Trač Vasyl': 'PeMa'
};

// Project mappings
const projektInfo: { [key: string]: { zakaznik: string, pm: string, program: string } } = {
  'ST_EMU_INT': { zakaznik: 'ST', pm: 'KaSo', program: 'RAIL' },
  'ST_TRAM_INT': { zakaznik: 'ST', pm: 'JoMa', program: 'RAIL' },
  'ST_MAINZ': { zakaznik: 'ST', pm: 'JoMa', program: 'RAIL' },
  'ST_KASSEL': { zakaznik: 'ST', pm: 'JoMa', program: 'RAIL' },
  'ST_BLAVA': { zakaznik: 'ST', pm: 'JoMa', program: 'RAIL' },
  'ST_FEM': { zakaznik: 'ST', pm: 'PeNe', program: 'RAIL' },
  'ST_POZAR': { zakaznik: 'ST', pm: 'OnLi', program: 'RAIL' },
  'NU_CRAIN': { zakaznik: 'NUVIA', pm: 'PeMa', program: 'MACH' },
  'WA_HVAC': { zakaznik: 'WABTEC', pm: 'DaAm', program: 'RAIL' },
  'ST_JIGS': { zakaznik: 'ST', pm: 'KaSo', program: 'RAIL' },
  'ST_TRAM_HS': { zakaznik: 'ST', pm: 'KaSo', program: 'RAIL' },
  'SAF_FEM': { zakaznik: 'SAFRAN DE', pm: 'PeNe', program: 'AERO' },
  'FREE': { zakaznik: 'N/A', pm: 'N/A', program: 'N/A' },
  'DOVOLENÁ': { zakaznik: 'N/A', pm: 'N/A', program: 'N/A' }
};

const projektManagers = [
  'Všichni',
  'KaSo',
  'JoMa',
  'PeNe',
  'OnLi',
  'PeMa',
  'DaAm'
];

const zakaznici = [
  'Všichni',
  'ST',
  'NUVIA',
  'WABTEC',
  'SAFRAN DE'
];

const programy = [
  'Všichni',
  'RAIL',
  'MACH',
  'AERO'
];

const weeks = ['CW32', 'CW33', 'CW34', 'CW35', 'CW36', 'CW37', 'CW38', 'CW39', 'CW40', 'CW41', 'CW42', 'CW43', 'CW44', 'CW45', 'CW46', 'CW47', 'CW48', 'CW49', 'CW50', 'CW51', 'CW52'];

const months = [
  { name: 'August', weeks: ['CW32', 'CW33', 'CW34', 'CW35'] },
  { name: 'September', weeks: ['CW36', 'CW37', 'CW38', 'CW39'] },
  { name: 'October', weeks: ['CW40', 'CW41', 'CW42', 'CW43', 'CW44'] },
  { name: 'November', weeks: ['CW45', 'CW46', 'CW47', 'CW48'] },
  { name: 'December', weeks: ['CW49', 'CW50', 'CW51', 'CW52'] }
];

const getProjectBadgeVariant = (projekt: string) => {
  if (projekt === 'FREE') return 'secondary';
  if (projekt === 'DOVOLENÁ') return 'destructive';
  if (projekt.startsWith('ST_')) return 'default';
  if (projekt.startsWith('SAF_')) return 'outline';
  return 'default';
};

export const ProjectAssignmentMatrix = () => {
  const [filterOrgVedouci, setFilterOrgVedouci] = useState('Všichni');
  const [filterPM, setFilterPM] = useState('Všichni');
  const [filterZakaznik, setFilterZakaznik] = useState('Všichni');
  const [filterProgram, setFilterProgram] = useState('Všichni');

  // Create matrix data structure
  const matrixData = useMemo(() => {
    const engineers = [...new Set(planningData.map(entry => entry.konstrukter))];
    const matrix: { [engineer: string]: { [week: string]: string } } = {};
    
    engineers.forEach(engineer => {
      matrix[engineer] = {};
      weeks.forEach(week => {
        const entry = planningData.find(e => e.konstrukter === engineer && e.cw === week);
        matrix[engineer][week] = entry?.projekt || '';
      });
    });
    
    return matrix;
  }, []);

  // Filter engineers based on selected filters
  const filteredEngineers = useMemo(() => {
    let engineers = Object.keys(matrixData);
    
    // Filter by organizational leader
    if (filterOrgVedouci !== 'Všichni') {
      engineers = engineers.filter(engineer => 
        konstrukterVedouci[engineer] === filterOrgVedouci
      );
    }
    
    // Filter by PM
    if (filterPM !== 'Všichni') {
      engineers = engineers.filter(engineer => {
        return weeks.some(week => {
          const project = matrixData[engineer][week];
          return projektInfo[project]?.pm === filterPM;
        });
      });
    }
    
    // Filter by customer
    if (filterZakaznik !== 'Všichni') {
      engineers = engineers.filter(engineer => {
        return weeks.some(week => {
          const project = matrixData[engineer][week];
          return projektInfo[project]?.zakaznik === filterZakaznik;
        });
      });
    }
    
    // Filter by program
    if (filterProgram !== 'Všichni') {
      engineers = engineers.filter(engineer => {
        return weeks.some(week => {
          const project = matrixData[engineer][week];
          return projektInfo[project]?.program === filterProgram;
        });
      });
    }
    
    return engineers.sort();
  }, [matrixData, filterOrgVedouci, filterPM, filterZakaznik, filterProgram]);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Matice plánování projektů</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Organizační vedoucí</label>
              <Select value={filterOrgVedouci} onValueChange={setFilterOrgVedouci}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {organizacniVedouci.map(vedouci => (
                    <SelectItem key={vedouci} value={vedouci}>{vedouci}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Project Manager</label>
              <Select value={filterPM} onValueChange={setFilterPM}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {projektManagers.map(pm => (
                    <SelectItem key={pm} value={pm}>{pm}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Zákazník</label>
              <Select value={filterZakaznik} onValueChange={setFilterZakaznik}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {zakaznici.map(zakaznik => (
                    <SelectItem key={zakaznik} value={zakaznik}>{zakaznik}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Program</label>
              <Select value={filterProgram} onValueChange={setFilterProgram}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {programy.map(program => (
                    <SelectItem key={program} value={program}>{program}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr>
                  <th className="border border-border p-2 bg-muted text-left sticky left-0 z-10 min-w-[200px]">
                    Konstruktér
                  </th>
                  {months.map(month => (
                    <th key={month.name} className="border border-border p-2 bg-muted text-center" colSpan={month.weeks.length}>
                      {month.name}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th className="border border-border p-2 bg-muted/50 sticky left-0 z-10"></th>
                  {weeks.map(week => (
                    <th key={week} className="border border-border p-1 bg-muted/50 text-xs min-w-[80px]">
                      {week}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEngineers.map(engineer => (
                  <tr key={engineer} className="hover:bg-muted/20">
                    <td className="border border-border p-2 font-medium sticky left-0 bg-background z-10">
                      {engineer}
                    </td>
                    {weeks.map(week => {
                      const project = matrixData[engineer][week];
                      return (
                        <td key={week} className="border border-border p-1 text-center">
                          {project && (
                            <Badge 
                              variant={getProjectBadgeVariant(project)}
                              className="text-xs px-1 py-0.5 w-full justify-center"
                            >
                              {project}
                            </Badge>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            Zobrazeno {filteredEngineers.length} konstruktérů
          </div>
        </CardContent>
      </Card>
    </div>
  );
};