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

// Organizační struktura
const organizacniStruktura = {
  "RAIL": {
    vedouci: { nick: "OnLi", jmeno: "Ondřej Lišťanský" },
    oddeleni: {
      "Rail Interiéry": { vedouci: { nick: "JoMa", jmeno: "Jozef Matta" } },
      "Rail Hrubá stavba": { vedouci: { nick: "KaSo", jmeno: "Karel Šoupa" } },
      "Výpočty": { vedouci: { nick: "PeNe", jmeno: "Petr Nedavaška" } },
      "Rail Elektro": { vedouci: { nick: "PaHo", jmeno: "Pavel Hormandl" } }
    }
  },
  "Machinery": {
    vedouci: { nick: "OnLi", jmeno: "Ondřej Lišťanský" },
    oddeleni: {
      "General machinery": { vedouci: { nick: "PeMa", jmeno: "Peter Madanský" } },
      "Turbines": { vedouci: { nick: "DaAm", jmeno: "David Ambrož" } }
    }
  }
};

// Rozšířený seznam konstruktérů s oddělením
const konstrukteri = [
  { jmeno: "Hlavan Martin", orgVedouci: "JoMa", oddeleni: "Rail Interiéry", oblast: "RAIL" },
  { jmeno: "Fica Ladislav", orgVedouci: "JoMa", oddeleni: "Rail Interiéry", oblast: "RAIL" },
  { jmeno: "Heřman Daniel", orgVedouci: "JoMa", oddeleni: "Rail Interiéry", oblast: "RAIL" },
  { jmeno: "Pecinovský Pavel", orgVedouci: "JoMa", oddeleni: "Rail Interiéry", oblast: "RAIL" },
  { jmeno: "Břicháček Miloš", orgVedouci: "JoMa", oddeleni: "Rail Interiéry", oblast: "RAIL" },
  { jmeno: "Kalafa Ján", orgVedouci: "JoMa", oddeleni: "Rail Interiéry", oblast: "RAIL" },
  { jmeno: "Lengyel Martin", orgVedouci: "JoMa", oddeleni: "Rail Interiéry", oblast: "RAIL" },
  { jmeno: "Večeř Jiří", orgVedouci: "JoMa", oddeleni: "Rail Interiéry", oblast: "RAIL" },
  { jmeno: "Karlík Štěpán", orgVedouci: "JoMa", oddeleni: "Rail Interiéry", oblast: "RAIL" },
  { jmeno: "Mohelník Martin", orgVedouci: "JoMa", oddeleni: "Rail Interiéry", oblast: "RAIL" },
  { jmeno: "Brojír Jaroslav", orgVedouci: "JoMa", oddeleni: "Rail Interiéry", oblast: "RAIL" },
  { jmeno: "Samko Mikuláš", orgVedouci: "JoMa", oddeleni: "Rail Interiéry", oblast: "RAIL" },
  { jmeno: "Jiřička Aleš", orgVedouci: "JoMa", oddeleni: "Rail Interiéry", oblast: "RAIL" },
  
  { jmeno: "Slavík Ondřej", orgVedouci: "KaSo", oddeleni: "Rail Hrubá stavba", oblast: "RAIL" },
  { jmeno: "Uher Tomáš", orgVedouci: "KaSo", oddeleni: "Rail Hrubá stavba", oblast: "RAIL" },
  { jmeno: "Jandečka Karel", orgVedouci: "KaSo", oddeleni: "Rail Hrubá stavba", oblast: "RAIL" },
  { jmeno: "Bartovičová Agáta", orgVedouci: "KaSo", oddeleni: "Rail Hrubá stavba", oblast: "RAIL" },
  { jmeno: "Hrachová Ivana", orgVedouci: "KaSo", oddeleni: "Rail Hrubá stavba", oblast: "RAIL" },
  { jmeno: "Klíma Milan", orgVedouci: "KaSo", oddeleni: "Rail Hrubá stavba", oblast: "RAIL" },
  { jmeno: "Hibler František", orgVedouci: "KaSo", oddeleni: "Rail Hrubá stavba", oblast: "RAIL" },
  
  { jmeno: "Weiss Ondřej", orgVedouci: "PaHo", oddeleni: "Rail Elektro", oblast: "RAIL" },
  { jmeno: "Borský Jan", orgVedouci: "PaHo", oddeleni: "Rail Elektro", oblast: "RAIL" },
  { jmeno: "Pytela Martin", orgVedouci: "PaHo", oddeleni: "Rail Elektro", oblast: "RAIL" },
  { jmeno: "Litvinov Evgenii", orgVedouci: "PaHo", oddeleni: "Rail Elektro", oblast: "RAIL" },
  
  { jmeno: "Šedovičová Darina", orgVedouci: "PeNe", oddeleni: "Výpočty", oblast: "RAIL" },
  { jmeno: "Ješš Jozef", orgVedouci: "PeNe", oddeleni: "Výpočty", oblast: "RAIL" },
  { jmeno: "Melichar Ondřej", orgVedouci: "PeNe", oddeleni: "Výpočty", oblast: "RAIL" },
  
  { jmeno: "Karlesz Michal", orgVedouci: "PeMa", oddeleni: "General machinery", oblast: "Machinery" },
  { jmeno: "Fenyk Pavel", orgVedouci: "PeMa", oddeleni: "General machinery", oblast: "Machinery" },
  { jmeno: "Stránský Martin", orgVedouci: "PeMa", oddeleni: "General machinery", oblast: "Machinery" },
  { jmeno: "Trač Vasyl", orgVedouci: "PeMa", oddeleni: "General machinery", oblast: "Machinery" },
  
  { jmeno: "Anovčín Branislav", orgVedouci: "DaAm", oddeleni: "Turbines", oblast: "Machinery" },
  { jmeno: "Bartovič Anton", orgVedouci: "DaAm", oddeleni: "Turbines", oblast: "Machinery" },
  { jmeno: "Fuchs Pavel", orgVedouci: "DaAm", oddeleni: "Turbines", oblast: "Machinery" },
  
  { jmeno: "Ambrož David", orgVedouci: "OnLi", oddeleni: "OnLi tým", oblast: "RAIL" },
  { jmeno: "Matta Jozef", orgVedouci: "OnLi", oddeleni: "OnLi tým", oblast: "RAIL" },
  { jmeno: "Šoupa Karel", orgVedouci: "OnLi", oddeleni: "OnLi tým", oblast: "RAIL" },
  { jmeno: "Friedlová Jiřina", orgVedouci: "OnLi", oddeleni: "OnLi tým", oblast: "RAIL" },
  { jmeno: "Nedavaška Petr", orgVedouci: "OnLi", oddeleni: "OnLi tým", oblast: "RAIL" },
  { jmeno: "Madanský Peter", orgVedouci: "OnLi", oddeleni: "OnLi tým", oblast: "RAIL" },
  
  // Subdodavatelé
  { jmeno: "Chrenko Peter", orgVedouci: "Subdodavka", oddeleni: "Externí", oblast: "Externí" },
  { jmeno: "Jurčišin Peter", orgVedouci: "Subdodavka", oddeleni: "Externí", oblast: "Externí" },
  { jmeno: "Púpava Marián", orgVedouci: "Subdodavka", oddeleni: "Externí", oblast: "Externí" },
  { jmeno: "Bohušík Martin", orgVedouci: "Subdodavka", oddeleni: "Externí", oblast: "Externí" },
  { jmeno: "Chrenko Daniel", orgVedouci: "Subdodavka", oddeleni: "Externí", oblast: "Externí" }
];

// Reálné projekty s jejich parametry
const projekty = [
  { kod: "ST_EMU_INT", zakaznik: "ST", pm: "KaSo", smt: "1", program: "RAIL", sazba: 1100 },
  { kod: "ST_TRAM_INT", zakaznik: "ST", pm: "JoMa", smt: "1", program: "RAIL", sazba: 1100 },
  { kod: "ST_MAINZ", zakaznik: "ST", pm: "JoMa", smt: "1", program: "RAIL", sazba: 1100 },
  { kod: "ST_KASSEL", zakaznik: "ST", pm: "JoMa", smt: "1", program: "RAIL", sazba: 1100 },
  { kod: "ST_BLAVA", zakaznik: "ST", pm: "JoMa", smt: "1", program: "RAIL", sazba: 1150 },
  { kod: "ST_FEM", zakaznik: "ST", pm: "PeNe", smt: "0", program: "RAIL", sazba: 1250 },
  { kod: "ST_POZAR", zakaznik: "ST", pm: "OnLi", smt: "0.5", program: "RAIL", sazba: 1250 },
  { kod: "NU_CRAIN", zakaznik: "NUVIA", pm: "PeMa", smt: "0", program: "MACH", sazba: 1580 },
  { kod: "WA_HVAC", zakaznik: "WABTEC", pm: "DaAm", smt: "0", program: "RAIL", sazba: 1220 },
  { kod: "ST_JIGS", zakaznik: "ST", pm: "KaSo", smt: "1", program: "RAIL", sazba: 1150 },
  { kod: "ST_TRAM_HS", zakaznik: "ST", pm: "KaSo", smt: "1", program: "RAIL", sazba: 1085 },
  { kod: "SAF_FEM", zakaznik: "SAFRAN DE", pm: "PeNe", smt: "0", program: "AERO", sazba: 1300 },
  { kod: "FREE", zakaznik: "N/A", pm: "N/A", smt: "N/A", program: "N/A", sazba: 0 },
  { kod: "DOVOLENÁ", zakaznik: "N/A", pm: "N/A", smt: "N/A", program: "N/A", sazba: 0 }
];

// Funkce pro náhodné přiřazení projektů konstruktérům
const generateRandomAssignment = (konstrukter: any, week: string, month: string) => {
  const randomProject = projekty[Math.floor(Math.random() * (projekty.length - 2))]; // Vynechá FREE a DOVOLENÁ
  const randomHours = Math.floor(Math.random() * 4) * 10 + 20; // 20, 30, 40, 50 hodin
  
  return {
    konstrukter: konstrukter.jmeno,
    cw: week,
    mesic: month,
    mhTyden: randomHours,
    projekt: randomProject.kod,
    lokalita: randomProject.zakaznik === "ST" ? "ST" : randomProject.zakaznik,
    zakaznik: randomProject.zakaznik,
    pm: randomProject.pm,
    smt: randomProject.smt,
    program: randomProject.program,
    hodinovaSazba: randomProject.sazba,
    obrat: randomHours * randomProject.sazba
  };
};

// Generování ukázkových dat pro první konstruktéry
const mockData: PlanningEntry[] = [
  // Hlavan Martin - kompletní plánování
  generateRandomAssignment(konstrukteri[0], "CW32", "August"),
  generateRandomAssignment(konstrukteri[0], "CW33", "August"), 
  generateRandomAssignment(konstrukteri[0], "CW34", "August"),
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
  
  // Fica Ladislav
  generateRandomAssignment(konstrukteri[1], "CW32", "August"),
  generateRandomAssignment(konstrukteri[1], "CW33", "August"),
  
  // Ambrož David
  generateRandomAssignment(konstrukteri[2], "CW32", "August"),
  generateRandomAssignment(konstrukteri[2], "CW33", "August"),
  
  // Slavík Ondřej  
  generateRandomAssignment(konstrukteri[3], "CW32", "August"),
  generateRandomAssignment(konstrukteri[3], "CW33", "August"),
  
  // Uher Tomáš
  generateRandomAssignment(konstrukteri[8], "CW32", "August"),
  generateRandomAssignment(konstrukteri[8], "CW33", "August"),
  
  // Weiss Ondřej
  generateRandomAssignment(konstrukteri[9], "CW32", "August"),
  generateRandomAssignment(konstrukteri[9], "CW33", "August"),
  
  // Borský Jan
  generateRandomAssignment(konstrukteri[10], "CW32", "August"),
  {
    konstrukter: "Borský Jan",
    cw: "CW33",
    mesic: "August",
    mhTyden: 0,
    projekt: "DOVOLENÁ",
    lokalita: "",
    zakaznik: "N/A",
    pm: "N/A",
    smt: "N/A",
    program: "N/A",
    hodinovaSazba: 0,
    obrat: 0
  },
  
  // Pytela Martin
  generateRandomAssignment(konstrukteri[11], "CW32", "August"),
  generateRandomAssignment(konstrukteri[11], "CW33", "August"),
  
  // Jandečka Karel
  generateRandomAssignment(konstrukteri[13], "CW32", "August"),
  generateRandomAssignment(konstrukteri[13], "CW33", "August"),
  
  // Heřman Daniel
  generateRandomAssignment(konstrukteri[14], "CW32", "August"),
  generateRandomAssignment(konstrukteri[14], "CW33", "August"),
];

export const PlanningTable: React.FC = () => {
  const [data, setData] = useState<PlanningEntry[]>(mockData);
  const [filteredData, setFilteredData] = useState<PlanningEntry[]>(mockData);
  const [filterZakaznik, setFilterZakaznik] = useState<string>('all');
  const [filterProgram, setFilterProgram] = useState<string>('all');
  const [filterOrgVedouci, setFilterOrgVedouci] = useState<string>('all');
  const [filterOddeleni, setFilterOddeleni] = useState<string>('all');
  const [searchKonstrukter, setSearchKonstrukter] = useState<string>('');

  const uniqueZakaznici = Array.from(new Set(data.map(item => item.zakaznik).filter(z => z !== 'N/A')));
  const uniquePrograms = Array.from(new Set(data.map(item => item.program).filter(p => p !== 'N/A')));
  const uniqueOrgVedouci = Array.from(new Set(konstrukteri.map(k => k.orgVedouci)));
  const uniqueOddeleni = Array.from(new Set(konstrukteri.map(k => k.oddeleni)));

  React.useEffect(() => {
    let filtered = data;
    
    if (filterZakaznik !== 'all') {
      filtered = filtered.filter(item => item.zakaznik === filterZakaznik);
    }
    
    if (filterProgram !== 'all') {
      filtered = filtered.filter(item => item.program === filterProgram);
    }
    
    if (filterOrgVedouci !== 'all') {
      filtered = filtered.filter(item => {
        const konstrukter = konstrukteri.find(k => k.jmeno === item.konstrukter);
        return konstrukter?.orgVedouci === filterOrgVedouci;
      });
    }
    
    if (filterOddeleni !== 'all') {
      filtered = filtered.filter(item => {
        const konstrukter = konstrukteri.find(k => k.jmeno === item.konstrukter);
        return konstrukter?.oddeleni === filterOddeleni;
      });
    }
    
    if (searchKonstrukter) {
      filtered = filtered.filter(item => 
        item.konstrukter.toLowerCase().includes(searchKonstrukter.toLowerCase())
      );
    }
    
    setFilteredData(filtered);
  }, [data, filterZakaznik, filterProgram, filterOrgVedouci, filterOddeleni, searchKonstrukter]);

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
          
          <Select value={filterOddeleni} onValueChange={setFilterOddeleni}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Všechna oddělení" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všechna oddělení</SelectItem>
              {uniqueOddeleni.map(oddeleni => (
                <SelectItem key={oddeleni} value={oddeleni}>{oddeleni}</SelectItem>
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
                <th className="p-3 text-left font-medium">Oddělení</th>
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
              {filteredData.map((entry, index) => {
                const konstrukterData = konstrukteri.find(k => k.jmeno === entry.konstrukter);
                return (
                <tr 
                  key={`${entry.konstrukter}-${entry.cw}`}
                  className={`
                    border-b transition-colors hover:bg-planning-cell-hover
                    ${index % 2 === 0 ? 'bg-planning-cell' : 'bg-planning-stripe'}
                  `}
                >
                  <td className="p-3 font-medium text-foreground">{entry.konstrukter}</td>
                  <td className="p-3 text-muted-foreground text-sm">
                    {konstrukterData?.oddeleni || '-'}
                  </td>
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
                );
              })}
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