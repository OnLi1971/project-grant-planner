import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Filter, Users } from 'lucide-react';
import { usePlanning } from '@/contexts/PlanningContext';

interface EngineerOverview {
  konstrukter: string;
  spolecnost: string;
  orgVedouci: string;
  planNa4Tydny: Array<{ cw: string; projekt: string }>;
  status: 'VOLNY' | 'CASTECNE' | 'PLNE' | 'DOVOLENA';
}

// Funkce pro výpočet aktuálního kalendářního týdne
const getCurrentWeek = (): number => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + start.getDay() + 1) / 7);
};

// Funkce pro generování následujících 4 týdnů
const getNext4Weeks = (): string[] => {
  const currentWeek = getCurrentWeek();
  return Array.from({ length: 4 }, (_, i) => `CW${currentWeek + i}`);
};

// Seznam konstruktérů s aktualizovanými daty podle požadavku
const konstrukteri = [
  { jmeno: "Hlavan Martin", orgVedouci: "JoMa", spolecnost: "TM CZ a.s." },
  { jmeno: "Fica Ladislav", orgVedouci: "JoMa", spolecnost: "TM CZ a.s." },
  { jmeno: "Ambrož David", orgVedouci: "OnLi", spolecnost: "TM CZ a.s." },
  { jmeno: "Slavík Ondřej", orgVedouci: "KaSo", spolecnost: "TM CZ a.s." },
  { jmeno: "Chrenko Peter", orgVedouci: "Dodavatel", spolecnost: "MB idea SK, s.r.o." },
  { jmeno: "Jurčišin Peter", orgVedouci: "Dodavatel", spolecnost: "MB idea SK, s.r.o." },
  { jmeno: "Púpava Marián", orgVedouci: "Dodavatel", spolecnost: "MB idea SK, s.r.o." },
  { jmeno: "Bohušík Martin", orgVedouci: "Dodavatel", spolecnost: "MB idea SK, s.r.o." },
  { jmeno: "Uher Tomáš", orgVedouci: "KaSo", spolecnost: "TM CZ a.s." },
  { jmeno: "Weiss Ondřej", orgVedouci: "PaHo", spolecnost: "TM CZ a.s." },
  { jmeno: "Borský Jan", orgVedouci: "PaHo", spolecnost: "TM CZ a.s." },
  { jmeno: "Pytela Martin", orgVedouci: "PaHo", spolecnost: "TM CZ a.s." },
  { jmeno: "Litvinov Evgenii", orgVedouci: "PaHo", spolecnost: "TM CZ a.s." },
  { jmeno: "Jandečka Karel", orgVedouci: "KaSo", spolecnost: "TM CZ a.s." },
  { jmeno: "Heřman Daniel", orgVedouci: "JoMa", spolecnost: "TM CZ a.s." },
  { jmeno: "Karlesz Michal", orgVedouci: "PeMa", spolecnost: "TM CZ a.s." },
  { jmeno: "Matta Jozef", orgVedouci: "OnLi", spolecnost: "TM CZ a.s." },
  { jmeno: "Pecinovský Pavel", orgVedouci: "JoMa", spolecnost: "TM CZ a.s." },
  { jmeno: "Anovčín Branislav", orgVedouci: "DaAm", spolecnost: "TM CZ a.s." },
  { jmeno: "Bartovič Anton", orgVedouci: "DaAm", spolecnost: "TM CZ a.s." },
  { jmeno: "Břicháček Miloš", orgVedouci: "JoMa", spolecnost: "TM CZ a.s." },
  { jmeno: "Fenyk Pavel", orgVedouci: "PeMa", spolecnost: "TM CZ a.s." },
  { jmeno: "Kalafa Ján", orgVedouci: "JoMa", spolecnost: "TM CZ a.s." },
  { jmeno: "Lengyel Martin", orgVedouci: "JoMa", spolecnost: "TM CZ a.s." },
  { jmeno: "Šoupa Karel", orgVedouci: "OnLi", spolecnost: "TM CZ a.s." },
  { jmeno: "Večeř Jiří", orgVedouci: "JoMa", spolecnost: "TM CZ a.s." },
  { jmeno: "Bartovičová Agáta", orgVedouci: "KaSo", spolecnost: "TM CZ a.s." },
  { jmeno: "Hrachová Ivana", orgVedouci: "KaSo", spolecnost: "TM CZ a.s." },
  { jmeno: "Karlík Štěpán", orgVedouci: "JoMa", spolecnost: "TM CZ a.s." },
  { jmeno: "Friedlová Jiřina", orgVedouci: "OnLi", spolecnost: "TM CZ a.s." },
  { jmeno: "Fuchs Pavel", orgVedouci: "DaAm", spolecnost: "TM CZ a.s." },
  { jmeno: "Mohelník Martin", orgVedouci: "JoMa", spolecnost: "TM CZ a.s." },
  { jmeno: "Nedavaška Petr", orgVedouci: "OnLi", spolecnost: "TM CZ a.s." },
  { jmeno: "Šedovičová Darina", orgVedouci: "PeNe", spolecnost: "TM CZ a.s." },
  { jmeno: "Ješš Jozef", orgVedouci: "PeNe", spolecnost: "TM CZ a.s." },
  { jmeno: "Melichar Ondřej", orgVedouci: "PeNe", spolecnost: "TM CZ a.s." },
  { jmeno: "Klíma Milan", orgVedouci: "KaSo", spolecnost: "TM CZ a.s." },
  { jmeno: "Hibler František", orgVedouci: "KaSo", spolecnost: "TM CZ a.s." },
  { jmeno: "Brojír Jaroslav", orgVedouci: "JoMa", spolecnost: "TM CZ a.s." },
  { jmeno: "Madanský Peter", orgVedouci: "OnLi", spolecnost: "TM CZ a.s." },
  { jmeno: "Samko Mikuláš", orgVedouci: "JoMa", spolecnost: "TM CZ a.s." },
  { jmeno: "Chrenko Daniel", orgVedouci: "Dodavatel", spolecnost: "MB idea SK, s.r.o." },
  { jmeno: "Jiřička Aleš", orgVedouci: "JoMa", spolecnost: "TM CZ a.s." },
  { jmeno: "Stránský Martin", orgVedouci: "PeMa", spolecnost: "TM CZ a.s." },
  { jmeno: "Trač Vasyl", orgVedouci: "PeMa", spolecnost: "TM CZ a.s." }
];

export const PlanningTable: React.FC = () => {
  const { planningData } = usePlanning();
  
  const overviewData = useMemo(() => {
    const next4Weeks = getNext4Weeks();
    
    return konstrukteri.map(konstrukter => {
      const planNa4Tydny = next4Weeks.map(cw => {
        const entry = planningData.find(p => 
          p.konstrukter === konstrukter.jmeno && p.cw === cw
        );
        return {
          cw,
          projekt: entry?.projekt || 'FREE'
        };
      });
      
      // Určení statusu na základě plánu
      const freeCount = planNa4Tydny.filter(p => p.projekt === 'FREE' || !p.projekt).length;
      const vacationCount = planNa4Tydny.filter(p => p.projekt === 'DOVOLENÁ').length;
      
      let status: 'VOLNY' | 'CASTECNE' | 'PLNE' | 'DOVOLENA';
      
      if (vacationCount >= 2) {
        status = 'DOVOLENA';
      } else if (freeCount >= 3) {
        status = 'VOLNY';
      } else if (freeCount >= 1) {
        status = 'CASTECNE';
      } else {
        status = 'PLNE';
      }
      
      return {
        konstrukter: konstrukter.jmeno,
        spolecnost: konstrukter.spolecnost,
        orgVedouci: konstrukter.orgVedouci,
        planNa4Tydny,
        status
      };
    });
  }, [planningData]);
  
  const [filteredData, setFilteredData] = useState<EngineerOverview[]>(overviewData);
  const [filterOrgVedouci, setFilterOrgVedouci] = useState<string>('all');
  const [filterSpolecnost, setFilterSpolecnost] = useState<string>('all');
  const [searchKonstrukter, setSearchKonstrukter] = useState<string>('');

  const uniqueOrgVedouci = Array.from(new Set(konstrukteri.map(k => k.orgVedouci)));
  const uniqueSpolecnosti = Array.from(new Set(konstrukteri.map(k => k.spolecnost)));

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

  const getStatusBadge = (status: EngineerOverview['status']) => {
    switch (status) {
      case 'VOLNY':
        return <Badge className="bg-success/20 text-success border-success/30">Volný</Badge>;
      case 'CASTECNE':
        return <Badge className="bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30">Částečně vytížen</Badge>;
      case 'PLNE':
        return <Badge className="bg-primary/20 text-primary border-primary/30">Plně vytížen</Badge>;
      case 'DOVOLENA':
        return <Badge variant="outline" className="bg-accent text-accent-foreground border-accent">Dovolená</Badge>;
      default:
        return <Badge variant="secondary">Neznámý</Badge>;
    }
  };

  const getProjectBadge = (projekt: string) => {
    if (projekt === 'FREE') return <Badge variant="secondary" className="bg-success/20 text-success">FREE</Badge>;
    if (projekt === 'DOVOLENÁ') return <Badge variant="outline" className="bg-accent text-accent-foreground border-accent">Dovolená</Badge>;
    
    return (
      <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
        {projekt}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="bg-gradient-header text-white p-6 rounded-lg shadow-planning">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Přehled plánování</h1>
              <p className="text-primary-foreground/80">Celkový přehled konstruktérů a jejich vytížení</p>
            </div>
          </div>
          <div className="flex gap-4 text-center">
            <div className="bg-white/10 p-3 rounded-lg">
              <Users className="h-5 w-5 mb-1 mx-auto" />
              <div className="text-sm">Celkem konstruktérů</div>
              <div className="font-bold">{filteredData.length}</div>
            </div>
          </div>
        </div>
      </div>

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
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-planning-header text-white">
              <tr>
                <th className="p-3 text-left font-medium">Konstruktér</th>
                <th className="p-3 text-left font-medium">Společnost</th>
                <th className="p-3 text-left font-medium">Organizační vedoucí</th>
                <th className="p-3 text-left font-medium">Plán na 4 týdny dopředu</th>
                <th className="p-3 text-left font-medium">Status</th>
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
                  <td className="p-3">
                    <div className="flex gap-2 flex-wrap">
                      {engineer.planNa4Tydny.map((weekPlan, weekIndex) => (
                        <div key={weekIndex} className="flex items-center gap-1 text-xs">
                          <span className="font-mono text-muted-foreground text-xs">
                            {weekPlan.cw}:
                          </span>
                          {getProjectBadge(weekPlan.projekt)}
                        </div>
                      ))}
                    </div>
                  </td>
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