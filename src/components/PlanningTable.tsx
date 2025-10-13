import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Filter, Users } from 'lucide-react';
import { usePlanning } from '@/contexts/PlanningContext';
import { getWeek } from 'date-fns';
import { normalizeName } from '@/utils/nameNormalization';

interface EngineerOverview {
  konstrukter: string;
  spolecnost: string;
  orgVedouci: string;
  planDoKonceRoku: Array<{ cw: string; projekt: string }>;
  status: string;
}

// Funkce pro výpočet aktuálního kalendářního týdne
const getCurrentWeek = (): number => {
  return getWeek(new Date(), { weekStartsOn: 1 });
};

// Funkce pro generování týdnů od aktuálního týdne do celého roku 2026
const getAllWeeksToEndOfYear = (): string[] => {
  const currentWeek = getCurrentWeek();
  const startWeek = Math.max(32, currentWeek); // Začneme od aktuálního týdne, ale minimálně od CW32
  
  const weeks = [];
  // CW32-52 pro rok 2025
  for (let cw = startWeek; cw <= 52; cw++) {
    weeks.push(`CW${cw.toString().padStart(2, '0')}-2025`);
  }
  // CW01-52 pro rok 2026 (celý rok)
  for (let cw = 1; cw <= 52; cw++) {
    weeks.push(`CW${cw.toString().padStart(2, '0')}-2026`);
  }
  return weeks;
};

export const PlanningTable: React.FC = () => {
  const { planningData, engineers } = usePlanning();
  
  // Transformace engineers z databáze do formátu kompatibilního se starým kódem
  const engineersData = useMemo(() => {
    return engineers.map(eng => ({
      jmeno: eng.display_name,
      spolecnost: 'TM CZ', // Default, bude později nahrazeno skutečnou hodnotou z databáze
      orgVedouci: 'Unknown' // Default, bude později nahrazeno skutečnou hodnotou z organizační struktury
    }));
  }, [engineers]);
  
  const overviewData = useMemo(() => {
    const allWeeksToEndOfYear = getAllWeeksToEndOfYear();
    
    return engineersData
      .sort((a, b) => a.jmeno.localeCompare(b.jmeno))
      .map(konstrukter => {
        const planDoKonceRoku = allWeeksToEndOfYear.map(cw => {
          // Pro vyhledávání v existujících datech použijeme normalizované jméno
          const normalizedKonstrukter = normalizeName(konstrukter.jmeno);
          
          // Najdeme záznam v planningData podle normalizovaného jména a CW
          const entry = planningData.find(p => 
            normalizeName(p.konstrukter) === normalizedKonstrukter && 
            p.cw === cw  // Přímé porovnání - data už přicházejí s plným CW formátem
          );
          
          return {
            cw,
            projekt: entry?.projekt || 'FREE'
          };
        });
        
        // Určení statusu na základě dominujícího zákazníka (prvních 4 týdnů)
        const first4Weeks = planDoKonceRoku.slice(0, 4);
        const projectCounts: { [key: string]: number } = {};
        
        first4Weeks.forEach(week => {
          if (week.projekt && week.projekt !== 'FREE' && week.projekt !== 'NEMOC' && week.projekt !== 'OVER') {
            projectCounts[week.projekt] = (projectCounts[week.projekt] || 0) + 1;
          }
        });
        
        // Najdi dominující projekt
        let dominantProject = '';
        let maxCount = 0;
        Object.entries(projectCounts).forEach(([project, count]) => {
          if (count > maxCount) {
            maxCount = count;
            dominantProject = project;
          }
        });
        
        let status: string;
        
        if (first4Weeks.filter(p => p.projekt === 'DOVOLENÁ').length >= 2) {
          status = 'DOVOLENA';
        } else if (dominantProject && maxCount >= 2) {
          // Mapování projektů na zákazníky
          const projectToCustomer: { [key: string]: string } = {
            'ST_EMU_INT': 'ST',
            'ST_TRAM_INT': 'ST', 
            'ST_MAINZ': 'ST',
            'ST_KASSEL': 'ST',
            'ST_BLAVA': 'ST',
            'ST_FEM': 'ST',
            'ST_POZAR': 'ST',
            'ST_JIGS': 'ST',
            'ST_TRAM_HS': 'ST',
            'ST_ELEKTRO': 'ST',
            'NU_CRAIN': 'NUVIA',
            'WA_HVAC': 'WABTEC',
            'SAF_FEM': 'SAFRAN',
            'AIRB_INT': 'Zakazni Airbus'
          };
          status = projectToCustomer[dominantProject] || dominantProject;
        } else {
          const freeCount = first4Weeks.filter(p => 
            p.projekt === 'FREE' || 
            p.projekt === 'NEMOC' || 
            p.projekt === 'OVER' || 
            !p.projekt
          ).length;
          
          if (freeCount >= 3) {
            status = 'VOLNY';
          } else if (freeCount >= 1) {
            status = 'CASTECNE';
          } else {
            status = 'PLNE';
          }
        }
        
        return {
          konstrukter: konstrukter.jmeno,
          spolecnost: konstrukter.spolecnost,
          orgVedouci: konstrukter.orgVedouci,
          planDoKonceRoku,
          status
        };
      });
  }, [planningData, engineersData]);
  
  const [filteredData, setFilteredData] = useState<EngineerOverview[]>(overviewData);
  const [filterOrgVedouci, setFilterOrgVedouci] = useState<string>('all');
  const [filterSpolecnost, setFilterSpolecnost] = useState<string>('all');
  const [searchKonstrukter, setSearchKonstrukter] = useState<string>('');

  const uniqueOrgVedouci = Array.from(new Set(engineersData.map(k => k.orgVedouci)));
  const uniqueSpolecnosti = Array.from(new Set(engineersData.map(k => k.spolecnost)));

  React.useEffect(() => {
    let filtered = overviewData;
    
    if (filterOrgVedouci !== 'all') {
      filtered = filtered.filter(item => item.orgVedouci === filterOrgVedouci);
    }
    
    if (filterSpolecnost !== 'all') {
      filtered = filtered.filter(item => item.spolecnost === filterSpolecnost);
    }
    
    if (searchKonstrukter) {
      filtered = filtered.filter(item => 
        item.konstrukter.toLowerCase().includes(searchKonstrukter.toLowerCase())
      );
    }
    
    setFilteredData(filtered);
  }, [overviewData, filterOrgVedouci, filterSpolecnost, searchKonstrukter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VOLNY':
        return <Badge className="bg-success/20 text-success border-success/30">Volný</Badge>;
      case 'CASTECNE':
        return <Badge className="bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30">Částečně vytížen</Badge>;
      case 'PLNE':
        return <Badge className="bg-primary/20 text-primary border-primary/30">Plně vytížen</Badge>;
      case 'DOVOLENA':
        return <Badge variant="outline" className="bg-accent text-accent-foreground border-accent">Dovolená</Badge>;
      case 'ST':
        return <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30">ST</Badge>;
      case 'NUVIA':
        return <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">NUVIA</Badge>;
      case 'WABTEC':
        return <Badge className="bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30">WABTEC</Badge>;
      case 'SAFRAN':
        return <Badge className="bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30">SAFRAN</Badge>;
      case 'Zakazni Airbus':
        return <Badge className="bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30">Zakazni Airbus</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getProjectBadge = (projekt: string) => {
    if (projekt === 'FREE') return <Badge variant="secondary" className="bg-success/20 text-success">FREE</Badge>;
    if (projekt === 'DOVOLENÁ') return <Badge variant="outline" className="bg-accent text-accent-foreground border-accent">Dovolená</Badge>;
    if (projekt === 'NEMOC') return <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive">Nemoc</Badge>;
    if (projekt === 'OVER') return <Badge variant="outline" className="bg-warning/20 text-warning border-warning">Over</Badge>;
    
    return (
      <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
        {projekt}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6 bg-background min-h-screen">

      {/* Filters */}
      <Card className="p-4 shadow-card-custom">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtry:</span>
          </div>
          
          <Input
            placeholder="Hledat konstruktéra..."
            value={searchKonstrukter}
            onChange={(e) => setSearchKonstrukter(e.target.value)}
            className="w-48"
          />
          
          <Select value={filterOrgVedouci} onValueChange={setFilterOrgVedouci}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Všichni vedoucí" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všichni vedoucí</SelectItem>
              {uniqueOrgVedouci.map(vedouci => (
                <SelectItem key={vedouci} value={vedouci}>{vedouci}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterSpolecnost} onValueChange={setFilterSpolecnost}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Všechny společnosti" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všechny společnosti</SelectItem>
              {uniqueSpolecnosti.map(spolecnost => (
                <SelectItem key={spolecnost} value={spolecnost}>{spolecnost}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Overview Table */}
      <Card className="shadow-planning overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
          <table className="w-full">
            <thead className="bg-planning-header text-white sticky top-0 z-10">
              <tr>
                <th className="p-3 text-left font-medium sticky top-0 bg-planning-header">Konstruktér</th>
                <th className="p-3 text-left font-medium sticky top-0 bg-planning-header">Společnost</th>
                <th className="p-3 text-left font-medium sticky top-0 bg-planning-header">Organizační vedoucí</th>
                {getAllWeeksToEndOfYear().map(cw => (
                <th key={cw} className="p-3 text-center font-medium min-w-[100px] sticky top-0 bg-planning-header">
                  {cw.includes('-') ? cw.replace('-', ' ') : cw}
                </th>
                ))}
                <th className="p-3 text-left font-medium sticky top-0 bg-planning-header">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((engineer, index) => (
                <tr 
                  key={engineer.konstrukter}
                  className={`
                    border-b transition-colors hover:bg-planning-cell-hover
                    ${index % 2 === 0 ? 'bg-planning-cell' : 'bg-planning-stripe'}
                  `}
                >
                  <td className="p-3 font-medium text-foreground">{engineer.konstrukter}</td>
                  <td className="p-3 text-muted-foreground">{engineer.spolecnost}</td>
                  <td className="p-3 text-muted-foreground font-medium">{engineer.orgVedouci}</td>
                  {engineer.planDoKonceRoku.map((weekPlan, weekIndex) => (
                    <td key={weekIndex} className="p-3 text-center">
                      {getProjectBadge(weekPlan.projekt)}
                    </td>
                  ))}
                  <td className="p-3">
                    {getStatusBadge(engineer.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredData.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Žádné záznamy nevyhovují filtru</p>
          </div>
        )}
      </Card>
    </div>
  );
};