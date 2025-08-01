import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Calendar, Filter } from 'lucide-react';
import { usePlanning } from '@/contexts/PlanningContext';

const weeks = ['CW32', 'CW33', 'CW34', 'CW35', 'CW36', 'CW37', 'CW38', 'CW39', 'CW40', 'CW41', 'CW42', 'CW43', 'CW44', 'CW45', 'CW46', 'CW47', 'CW48', 'CW49', 'CW50', 'CW51', 'CW52'];

const months = [
  { name: 'August', weeks: ['CW32', 'CW33', 'CW34', 'CW35'] },
  { name: 'September', weeks: ['CW36', 'CW37', 'CW38', 'CW39'] },
  { name: 'October', weeks: ['CW40', 'CW41', 'CW42', 'CW43', 'CW44'] },
  { name: 'November', weeks: ['CW45', 'CW46', 'CW47', 'CW48'] },
  { name: 'December', weeks: ['CW49', 'CW50', 'CW51', 'CW52'] }
];

// Updated project badge styling function to match ProjectAssignmentMatrix
const getProjectBadgeStyle = (projekt: string) => {
  if (!projekt || projekt === 'FREE') return 'bg-green-100 text-green-800 border-green-300';
  if (projekt === 'DOVOLENÁ') return 'bg-blue-100 text-blue-800 border-blue-300';
  if (projekt.startsWith('ST_')) return 'bg-purple-100 text-purple-800 border-purple-300';
  if (projekt.startsWith('NU_')) return 'bg-orange-100 text-orange-800 border-orange-300';
  if (projekt.startsWith('WA_')) return 'bg-teal-100 text-teal-800 border-teal-300';
  if (projekt.startsWith('SAF_')) return 'bg-pink-100 text-pink-800 border-pink-300';
  if (projekt.startsWith('BUCH_')) return 'bg-cyan-100 text-cyan-800 border-cyan-300';
  if (projekt.startsWith('AIRB_')) return 'bg-indigo-100 text-indigo-800 border-indigo-300';
  if (projekt === 'OVER') return 'bg-red-100 text-red-800 border-red-300';
  return 'bg-gray-100 text-gray-800 border-gray-300';
};

const getProjectBadge = (projekt: string) => {
  if (!projekt || projekt === 'FREE') return <Badge variant="secondary" className="bg-green-100 text-green-800">Volný</Badge>;
  if (projekt === 'DOVOLENÁ') return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Dovolená</Badge>;
  
  return (
    <div className={`text-xs px-2 py-1 rounded-md border inline-flex items-center ${getProjectBadgeStyle(projekt)}`}>
      {projekt}
    </div>
  );
};

export const FreeCapacityOverview = () => {
  const { planningData } = usePlanning();
  
  // Filter states
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  
  // Debug logging to check data reactivity
  console.log('FreeCapacityOverview: planningData updated', planningData.length, 'entries');

  // Enhanced data processing with better reactivity
  const processedData = useMemo(() => {
    console.log('FreeCapacityOverview: Processing data with', planningData.length, 'entries');
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

    // Seřazení týdnů chronologicky
    Object.keys(engineersMap).forEach(engineer => {
      engineersMap[engineer].sort((a, b) => {
        const aNum = parseInt(a.cw.replace('CW', ''));
        const bNum = parseInt(b.cw.replace('CW', ''));
        return aNum - bNum;
      });
    });

    console.log('FreeCapacityOverview: Processed engineers:', Object.keys(engineersMap).length);
    return engineersMap;
  }, [planningData]);

  // Get filtered weeks based on selections
  const filteredWeeks = useMemo(() => {
    if (selectedWeeks.length > 0) {
      return selectedWeeks;
    }
    if (selectedMonths.length > 0) {
      return months
        .filter(month => selectedMonths.includes(month.name))
        .flatMap(month => month.weeks);
    }
    return weeks; // Show all weeks if no filter
  }, [selectedWeeks, selectedMonths]);

  // Filtrování inženýrů s volnými kapacitami
  const engineersWithFreeCapacity = useMemo(() => {
    return Object.keys(processedData)
      .filter(engineer => {
        const engineerData = processedData[engineer];
        // Filter by selected weeks/months
        const relevantWeeks = engineerData.filter(week => filteredWeeks.includes(week.cw));
        return relevantWeeks.some(week => week.projekt === 'FREE');
      })
      .map(engineer => {
        const engineerData = processedData[engineer];
        // Filter by selected weeks/months
        const relevantWeeks = engineerData.filter(week => filteredWeeks.includes(week.cw));
        const freeWeeks = relevantWeeks.filter(week => week.projekt === 'FREE');
        const totalWeeks = relevantWeeks.length;
        const busyWeeks = totalWeeks - freeWeeks.length;
        
        return {
          name: engineer,
          freeWeeks: freeWeeks.length,
          busyWeeks,
          totalWeeks,
          freePercentage: totalWeeks > 0 ? Math.round((freeWeeks.length / totalWeeks) * 100) : 0,
          weeks: engineerData
        };
      })
      .filter(engineer => engineer.totalWeeks > 0) // Only show engineers with data in selected period
      .sort((a, b) => b.freeWeeks - a.freeWeeks);
  }, [processedData, filteredWeeks]);

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

      {/* Filter Controls */}
      <Card className="p-4 shadow-card-custom">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filtrovat podle:</span>
          </div>
          
          {/* Week Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Týdny {selectedWeeks.length > 0 && `(${selectedWeeks.length})`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Vybrat týdny</h4>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedWeeks([])}
                  >
                    Zrušit
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                  {weeks.map(week => (
                    <div key={week} className="flex items-center space-x-2">
                      <Checkbox
                        id={week}
                        checked={selectedWeeks.includes(week)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedWeeks([...selectedWeeks, week]);
                            setSelectedMonths([]); // Clear month filter
                          } else {
                            setSelectedWeeks(selectedWeeks.filter(w => w !== week));
                          }
                        }}
                      />
                      <label htmlFor={week} className="text-sm">{week}</label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Month Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Měsíce {selectedMonths.length > 0 && `(${selectedMonths.length})`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Vybrat měsíce</h4>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedMonths([])}
                  >
                    Zrušit
                  </Button>
                </div>
                <div className="space-y-2">
                  {months.map(month => (
                    <div key={month.name} className="flex items-center space-x-2">
                      <Checkbox
                        id={month.name}
                        checked={selectedMonths.includes(month.name)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedMonths([...selectedMonths, month.name]);
                            setSelectedWeeks([]); // Clear week filter
                          } else {
                            setSelectedMonths(selectedMonths.filter(m => m !== month.name));
                          }
                        }}
                      />
                      <label htmlFor={month.name} className="text-sm">{month.name}</label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Clear All Filters */}
          {(selectedWeeks.length > 0 || selectedMonths.length > 0) && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setSelectedWeeks([]);
                setSelectedMonths([]);
              }}
            >
              Zrušit všechny filtry
            </Button>
          )}
        </div>
      </Card>

      {/* Engineers with Free Capacity */}
      <Card className="shadow-planning">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Konstruktéři s volnými kapacitami</h2>
          <p className="text-muted-foreground">
            Seřazeno podle počtu volných týdnů
            {selectedWeeks.length > 0 && ` (filtr: ${selectedWeeks.join(', ')})`}
            {selectedMonths.length > 0 && ` (filtr: ${selectedMonths.join(', ')})`}
          </p>
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
                {months.map(month => {
                  const monthWeeks = month.weeks.filter(week => filteredWeeks.includes(week));
                  return monthWeeks.length > 0 ? (
                    <th key={month.name} className="p-2 text-center font-medium border-l" colSpan={monthWeeks.length}>
                      {month.name}
                    </th>
                  ) : null;
                })}
              </tr>
              <tr className="bg-planning-header/80">
                <th className="p-2 sticky left-0 z-10 bg-planning-header/80"></th>
                <th className="p-2"></th>
                <th className="p-2"></th>
                <th className="p-2"></th>
                {filteredWeeks.map(week => (
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
                {filteredWeeks.map(week => {
                    const weekData = engineer.weeks.find(w => w.cw === week);
                    const isFree = weekData?.projekt === 'FREE';
                    return (
                      <td key={week} className="p-1 text-center border-l">
                         {weekData && (
                           <div className="text-xs p-1">
                             {isFree ? (
                               <div className="bg-green-100 text-green-800 border border-green-300 px-2 py-1 rounded-md font-medium">
                                 FREE
                               </div>
                             ) : (
                               <div className={`px-2 py-1 rounded-md border ${getProjectBadgeStyle(weekData.projekt)}`}>
                                 {weekData.projekt}
                               </div>
                             )}
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
              <div className="bg-green-100 text-green-800 border border-green-300 px-2 py-1 rounded-md text-xs">FREE</div>
              <span>Volný týden</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 text-blue-800 border border-blue-300 px-2 py-1 rounded-md text-xs">DOVOLENÁ</div>
              <span>Dovolená</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-purple-100 text-purple-800 border border-purple-300 px-2 py-1 rounded-md text-xs">ST_XXX</div>
              <span>ST Projekt</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-orange-100 text-orange-800 border border-orange-300 px-2 py-1 rounded-md text-xs">NU_XXX</div>
              <span>NUVIA projekt</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-teal-100 text-teal-800 border border-teal-300 px-2 py-1 rounded-md text-xs">WA_XXX</div>
              <span>WABTEC projekt</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-pink-100 text-pink-800 border border-pink-300 px-2 py-1 rounded-md text-xs">SAF_XXX</div>
              <span>SAFRAN projekt</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};