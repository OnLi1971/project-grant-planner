import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Filter, Users, TrendingUp } from 'lucide-react';

interface PlanningEntry {
  konstrukter: string;
  cw: string;
  mesic: string;
  mhTyden: number;
  projekt: string;
  lokalita: string;
  zakaznik: string;
  pm: string;
  smt: string;
  program: string;
  hodinovaSazba: number;
  obrat: number;
}

const mockData: PlanningEntry[] = [
  {
    konstrukter: "Hlavan Martin",
    cw: "CW32",
    mesic: "August",
    mhTyden: 36,
    projekt: "ST_BLAVA",
    lokalita: "ST",
    zakaznik: "JoMa",
    pm: "1",
    smt: "RAIL",
    program: "RAIL",
    hodinovaSazba: 1150,
    obrat: 41400
  },
  {
    konstrukter: "Hlavan Martin",
    cw: "CW33",
    mesic: "August", 
    mhTyden: 36,
    projekt: "ST_BLAVA",
    lokalita: "ST",
    zakaznik: "JoMa",
    pm: "1",
    smt: "RAIL",
    program: "RAIL",
    hodinovaSazba: 1150,
    obrat: 41400
  },
  {
    konstrukter: "Hlavan Martin",
    cw: "CW42",
    mesic: "October",
    mhTyden: 0,
    projekt: "FREE",
    lokalita: "",
    zakaznik: "N/A",
    pm: "N/A",
    smt: "N/A",
    program: "N/A",
    hodinovaSazba: 0,
    obrat: 0
  },
  {
    konstrukter: "Novák Jan",
    cw: "CW32",
    mesic: "August",
    mhTyden: 40,
    projekt: "PR_BERLIN",
    lokalita: "BE",
    zakaznik: "Siemens",
    pm: "2",
    smt: "AUTO",
    program: "AUTO",
    hodinovaSazba: 1200,
    obrat: 48000
  },
  {
    konstrukter: "Svoboda Petr",
    cw: "CW32",
    mesic: "August",
    mhTyden: 35,
    projekt: "ST_PRAHA",
    lokalita: "PR",
    zakaznik: "ČD",
    pm: "3",
    smt: "RAIL",
    program: "RAIL",
    hodinovaSazba: 1100,
    obrat: 38500
  }
];

export const PlanningTable: React.FC = () => {
  const [data, setData] = useState<PlanningEntry[]>(mockData);
  const [filteredData, setFilteredData] = useState<PlanningEntry[]>(mockData);
  const [filterZakaznik, setFilterZakaznik] = useState<string>('all');
  const [filterProgram, setFilterProgram] = useState<string>('all');
  const [searchKonstrukter, setSearchKonstrukter] = useState<string>('');

  const uniqueZakaznici = Array.from(new Set(data.map(item => item.zakaznik).filter(z => z !== 'N/A')));
  const uniquePrograms = Array.from(new Set(data.map(item => item.program).filter(p => p !== 'N/A')));

  React.useEffect(() => {
    let filtered = data;
    
    if (filterZakaznik !== 'all') {
      filtered = filtered.filter(item => item.zakaznik === filterZakaznik);
    }
    
    if (filterProgram !== 'all') {
      filtered = filtered.filter(item => item.program === filterProgram);
    }
    
    if (searchKonstrukter) {
      filtered = filtered.filter(item => 
        item.konstrukter.toLowerCase().includes(searchKonstrukter.toLowerCase())
      );
    }
    
    setFilteredData(filtered);
  }, [data, filterZakaznik, filterProgram, searchKonstrukter]);

  const totalObrat = filteredData.reduce((sum, item) => sum + item.obrat, 0);
  const totalHours = filteredData.reduce((sum, item) => sum + item.mhTyden, 0);

  const getStatusBadge = (projekt: string, mhTyden: number) => {
    if (projekt === 'FREE' || mhTyden === 0) {
      return <Badge variant="secondary">Volný</Badge>;
    }
    if (projekt === 'DOVOLENÁ') {
      return <Badge variant="outline" className="border-accent">Dovolená</Badge>;
    }
    if (mhTyden >= 40) {
      return <Badge className="bg-success">Plně vytížen</Badge>;
    }
    if (mhTyden >= 20) {
      return <Badge className="bg-warning text-warning-foreground">Částečně vytížen</Badge>;
    }
    return <Badge variant="secondary">Nízké vytížení</Badge>;
  };

  return (
    <div className="space-y-6 p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="bg-gradient-header text-white p-6 rounded-lg shadow-planning">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Plánování konstruktérů</h1>
              <p className="text-primary-foreground/80">Týdenní přehled projektů a vytížení</p>
            </div>
          </div>
          <div className="flex gap-4 text-center">
            <div className="bg-white/10 p-3 rounded-lg">
              <TrendingUp className="h-5 w-5 mb-1 mx-auto" />
              <div className="text-sm">Celkový obrat</div>
              <div className="font-bold">{totalObrat.toLocaleString('cs-CZ')} Kč</div>
            </div>
            <div className="bg-white/10 p-3 rounded-lg">
              <Users className="h-5 w-5 mb-1 mx-auto" />
              <div className="text-sm">Celkem hodin</div>
              <div className="font-bold">{totalHours}h</div>
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
          
          <Select value={filterZakaznik} onValueChange={setFilterZakaznik}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Všichni zákazníci" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všichni zákazníci</SelectItem>
              {uniqueZakaznici.map(zakaznik => (
                <SelectItem key={zakaznik} value={zakaznik}>{zakaznik}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterProgram} onValueChange={setFilterProgram}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Všechny programy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všechny programy</SelectItem>
              {uniquePrograms.map(program => (
                <SelectItem key={program} value={program}>{program}</SelectItem>
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
                <th className="p-3 text-left font-medium">Konstruktér</th>
                <th className="p-3 text-left font-medium">CW</th>
                <th className="p-3 text-left font-medium">Měsíc</th>
                <th className="p-3 text-left font-medium">MH/týden</th>
                <th className="p-3 text-left font-medium">Projekt</th>
                <th className="p-3 text-left font-medium">Lokalita</th>
                <th className="p-3 text-left font-medium">Zákazník</th>
                <th className="p-3 text-left font-medium">PM</th>
                <th className="p-3 text-left font-medium">Program</th>
                <th className="p-3 text-left font-medium">Hodinová sazba</th>
                <th className="p-3 text-left font-medium">Obrat</th>
                <th className="p-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((entry, index) => (
                <tr 
                  key={`${entry.konstrukter}-${entry.cw}`}
                  className={`
                    border-b transition-colors hover:bg-planning-cell-hover
                    ${index % 2 === 0 ? 'bg-planning-cell' : 'bg-planning-stripe'}
                  `}
                >
                  <td className="p-3 font-medium text-foreground">{entry.konstrukter}</td>
                  <td className="p-3 text-muted-foreground font-mono">{entry.cw}</td>
                  <td className="p-3 text-muted-foreground">{entry.mesic}</td>
                  <td className="p-3">
                    <span className={`font-medium ${
                      entry.mhTyden >= 40 ? 'text-success' :
                      entry.mhTyden >= 20 ? 'text-warning' :
                      entry.mhTyden > 0 ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {entry.mhTyden}h
                    </span>
                  </td>
                  <td className="p-3 font-medium">{entry.projekt}</td>
                  <td className="p-3 text-muted-foreground">{entry.lokalita}</td>
                  <td className="p-3 font-medium">{entry.zakaznik}</td>
                  <td className="p-3 text-muted-foreground">{entry.pm}</td>
                  <td className="p-3">{entry.program}</td>
                  <td className="p-3 font-mono">
                    {entry.hodinovaSazba > 0 ? `${entry.hodinovaSazba.toLocaleString('cs-CZ')} Kč` : '-'}
                  </td>
                  <td className="p-3 font-medium">
                    {entry.obrat > 0 ? `${entry.obrat.toLocaleString('cs-CZ')} Kč` : '-'}
                  </td>
                  <td className="p-3">
                    {getStatusBadge(entry.projekt, entry.mhTyden)}
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