import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar } from 'lucide-react';
import { usePlanning } from '@/contexts/PlanningContext';

const weeks = ['CW32', 'CW33', 'CW34', 'CW35', 'CW36', 'CW37', 'CW38', 'CW39', 'CW40', 'CW41', 'CW42', 'CW43', 'CW44', 'CW45', 'CW46', 'CW47', 'CW48', 'CW49', 'CW50', 'CW51', 'CW52'];

const months = [
  { name: 'August', weeks: ['CW32', 'CW33', 'CW34', 'CW35'] },
  { name: 'September', weeks: ['CW36', 'CW37', 'CW38', 'CW39'] },
  { name: 'October', weeks: ['CW40', 'CW41', 'CW42', 'CW43', 'CW44'] },
  { name: 'November', weeks: ['CW45', 'CW46', 'CW47', 'CW48'] },
  { name: 'December', weeks: ['CW49', 'CW50', 'CW51', 'CW52'] }
];

const getProjectBadge = (projekt: string) => {
  if (!projekt || projekt === 'FREE') return <Badge variant="secondary">Volný</Badge>;
  if (projekt === 'DOVOLENÁ') return <Badge variant="outline" className="border-accent">Dovolená</Badge>;
  if (projekt.startsWith('ST_')) return <Badge className="bg-primary">ST Projekt</Badge>;
  if (projekt.startsWith('NU_')) return <Badge className="bg-warning text-warning-foreground">NUVIA</Badge>;
  if (projekt.startsWith('WA_')) return <Badge className="bg-success">WABTEC</Badge>;
  if (projekt.startsWith('SAF_')) return <Badge style={{backgroundColor: 'hsl(280 100% 70%)', color: 'white'}}>SAFRAN</Badge>;
  return <Badge variant="outline">{projekt}</Badge>;
};

export const FreeCapacityOverview = () => {
  const { planningData } = usePlanning();

  // Transformace dat z centrálního contextu
  const processedData = useMemo(() => {
    const engineersMap: { [key: string]: { cw: string; projekt: string }[] } = {};
    
    // Skupinování dat podle konstruktéra
    planningData.forEach(entry => {
      if (!engineersMap[entry.konstrukter]) {
        engineersMap[entry.konstrukter] = [];
      }
      engineersMap[entry.konstrukter].push({
        cw: entry.cw,
        projekt: entry.projekt
      });
    });

    // Seřazení týdnů
    Object.keys(engineersMap).forEach(engineer => {
      engineersMap[engineer].sort((a, b) => {
        const aNum = parseInt(a.cw.replace('CW', ''));
        const bNum = parseInt(b.cw.replace('CW', ''));
        return aNum - bNum;
      });
    });

    return engineersMap;
  }, [planningData]);

  // Filtrování inženýrů s volnými kapacitami
  const engineersWithFreeCapacity = useMemo(() => {
    return Object.keys(processedData)
      .filter(engineer => {
        const engineerData = processedData[engineer];
        return engineerData.some(week => week.projekt === 'FREE');
      })
      .map(engineer => {
        const engineerData = processedData[engineer];
        const freeWeeks = engineerData.filter(week => week.projekt === 'FREE');
        const totalWeeks = engineerData.length;
        const busyWeeks = totalWeeks - freeWeeks.length;
        
        return {
          name: engineer,
          freeWeeks: freeWeeks.length,
          busyWeeks,
          totalWeeks,
          freePercentage: Math.round((freeWeeks.length / totalWeeks) * 100),
          weeks: engineerData
        };
      })
      .sort((a, b) => b.freeWeeks - a.freeWeeks);
  }, [processedData]);

  // Celkové statistiky
  const totalEngineers = Object.keys(processedData).length;
  const engineersWithFree = engineersWithFreeCapacity.length;
  const totalFreeWeeks = engineersWithFreeCapacity.reduce((sum, eng) => sum + eng.freeWeeks, 0);
  const avgFreePercentage = engineersWithFree > 0 
    ? Math.round(engineersWithFreeCapacity.reduce((sum, eng) => sum + eng.freePercentage, 0) / engineersWithFree)
    : 0;

  return (
    <div className="space-y-6 p-6 bg-background min-h-screen">
      {/* Header */}
      <div className="bg-gradient-header text-white p-6 rounded-lg shadow-planning">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Přehled volných kapacit</h1>
            <p className="text-primary-foreground/80">Konstruktéři s dostupnými hodinami pro nové projekty</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 shadow-card-custom">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalEngineers}</div>
            <div className="text-sm text-muted-foreground">Celkem konstruktérů</div>
          </div>
        </Card>
        <Card className="p-4 shadow-card-custom">
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{engineersWithFree}</div>
            <div className="text-sm text-muted-foreground">S volnými kapacitami</div>
          </div>
        </Card>
        <Card className="p-4 shadow-card-custom">
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">{totalFreeWeeks}</div>
            <div className="text-sm text-muted-foreground">Celkem volných týdnů</div>
          </div>
        </Card>
        <Card className="p-4 shadow-card-custom">
          <div className="text-center">
            <div className="text-2xl font-bold text-accent">{avgFreePercentage}%</div>
            <div className="text-sm text-muted-foreground">Průměrná volná kapacita</div>
          </div>
        </Card>
      </div>

      {/* Engineers with Free Capacity */}
      <Card className="shadow-planning">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Konstruktéři s volnými kapacitami</h2>
          <p className="text-muted-foreground">Seřazeno podle počtu volných týdnů</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-planning-header text-white">
              <tr>
                <th className="p-3 text-left font-medium sticky left-0 z-10 bg-planning-header min-w-[200px]">Konstruktér</th>
                <th className="p-3 text-center font-medium min-w-[100px]">Volné týdny</th>
                <th className="p-3 text-center font-medium min-w-[100px]">Vytížené týdny</th>
                <th className="p-3 text-center font-medium min-w-[120px]">Volná kapacita %</th>
                {months.map(month => (
                  <th key={month.name} className="p-2 text-center font-medium border-l" colSpan={month.weeks.length}>
                    {month.name}
                  </th>
                ))}
              </tr>
              <tr className="bg-planning-header/80">
                <th className="p-2 sticky left-0 z-10 bg-planning-header/80"></th>
                <th className="p-2"></th>
                <th className="p-2"></th>
                <th className="p-2"></th>
                {weeks.map(week => (
                  <th key={week} className="p-1 text-xs border-l min-w-[60px]">
                    {week}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {engineersWithFreeCapacity.map((engineer, index) => (
                <tr 
                  key={engineer.name}
                  className={`
                    border-b transition-colors hover:bg-planning-cell-hover
                    ${index % 2 === 0 ? 'bg-planning-cell' : 'bg-planning-stripe'}
                  `}
                >
                  <td className="p-3 font-medium sticky left-0 z-10 bg-inherit border-r">
                    {engineer.name}
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant="secondary" className="bg-success/20 text-success">
                      {engineer.freeWeeks}
                    </Badge>
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant="outline">
                      {engineer.busyWeeks}
                    </Badge>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-success rounded-full transition-all"
                          style={{ width: `${engineer.freePercentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{engineer.freePercentage}%</span>
                    </div>
                  </td>
                  {weeks.map(week => {
                    const weekData = engineer.weeks.find(w => w.cw === week);
                    const isFree = weekData?.projekt === 'FREE';
                    return (
                      <td key={week} className="p-1 text-center border-l">
                        {weekData && (
                          <div className={`text-xs p-1 rounded ${
                            isFree ? 'bg-success/20 text-success font-medium' : ''
                          }`}>
                            {isFree ? 'FREE' : getProjectBadge(weekData.projekt)}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* No Free Capacity Message */}
      {engineersWithFreeCapacity.length === 0 && (
        <Card className="p-8 text-center shadow-card-custom">
          <div className="text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Žádné volné kapacity</p>
            <p className="text-sm">Všichni konstruktéři jsou momentálně plně vytíženi</p>
          </div>
        </Card>
      )}

      {/* Additional Info */}
      <Card className="p-4 shadow-card-custom">
        <div className="text-sm text-muted-foreground">
          <h3 className="font-medium text-foreground mb-2">Legenda:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-success/20 text-success">FREE</Badge>
              <span>Volný týden</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-accent">DOVOLENÁ</Badge>
              <span>Dovolená</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-primary">ST_XXX</Badge>
              <span>ST Projekt</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-warning text-warning-foreground">NU_XXX</Badge>
              <span>NUVIA projekt</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};