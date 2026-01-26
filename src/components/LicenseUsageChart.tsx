import React, { useMemo, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, ReferenceLine, Cell } from 'recharts';
import { usePlanning } from '@/contexts/PlanningContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Users, Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { getProjectColorWithIndex } from '@/utils/colorSystem';
import { supabase } from '@/integrations/supabase/client';

// Konstruktéři od dodavatele MB Idea - nečerpají naše licence
const MB_IDEA_CONTRACTORS = [
  'Bohušík Martin',
  'Chrenko Daniel', 
  'Chrenko Peter',
  'Jurčišin Peter',
  'Púpava Marián'
];

interface License {
  id: string;
  name: string;
  type: 'software' | 'certification' | 'training';
  provider: string;
  totalSeats: number;
  usedSeats: number;
  expirationDate: string;
  cost: number;
  status: 'active' | 'expired' | 'expiring-soon';
}

interface ProjectLicense {
  project_id: string;
  license_id: string;
  percentage: number;
  project_code: string;
  license_name: string;
}

interface EngineerDetail {
  name: string;
  project: string;
  licensePercentage: number;
  requiredLicenses: number;
}

interface Project {
  id: string;
  name: string;
  code: string;
  customer: string;
  projectManager: string;
  program: string;
  type: 'hourly' | 'work-package';
  budget: number;
  assignedLicenses: { id: string; name: string; percentage: number }[];
}

interface StoredProject {
  id: string;
  name: string;
  code: string;
  customerId: string;
  projectManagerId: string;
  programId: string;
  status: 'active' | 'inactive' | 'completed';
  hourlyRate?: number;
  projectType: 'WP' | 'Hodinovka';
  budget?: number;
  assignedLicenses?: { licenseId: string; percentage: number }[];
}

interface LicenseUsageChartProps {
  licenses: License[];
}

export const LicenseUsageChart: React.FC<LicenseUsageChartProps> = ({ licenses }) => {
  const { planningData } = usePlanning();
  const [projectLicenses, setProjectLicenses] = useState<ProjectLicense[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [weekDetails, setWeekDetails] = useState<EngineerDetail[]>([]);
  const [viewMode, setViewMode] = useState<'weeks' | 'months'>('weeks');

  // Aggregate licenses with the same name (sum totalSeats)
  const aggregatedLicenses = useMemo(() => {
    const licenseMap = new Map<string, {
      name: string;
      totalSeats: number;
      ids: string[];
      expirationDates: string[];
    }>();
    
    licenses.forEach(license => {
      const existing = licenseMap.get(license.name);
      if (existing) {
        existing.totalSeats += license.totalSeats;
        existing.ids.push(license.id);
        existing.expirationDates.push(license.expirationDate);
      } else {
        licenseMap.set(license.name, {
          name: license.name,
          totalSeats: license.totalSeats,
          ids: [license.id],
          expirationDates: [license.expirationDate]
        });
      }
    });
    
    return Array.from(licenseMap.values());
  }, [licenses]);

  // Initialize selected license with first aggregated license
  const [selectedLicense, setSelectedLicense] = useState<string>('');
  
  // Update selected license when aggregatedLicenses changes
  useEffect(() => {
    if (aggregatedLicenses.length > 0 && !selectedLicense) {
      setSelectedLicense(aggregatedLicenses[0].name);
    }
  }, [aggregatedLicenses, selectedLicense]);

  // Load project licenses from database
  useEffect(() => {
    const loadProjectLicenses = async () => {
      // Get project licenses
      const { data: projectLicensesData, error: plError } = await supabase
        .from('project_licenses')
        .select('project_id, license_id, percentage');

      if (plError) {
        console.error('Error loading project licenses:', plError);
        return;
      }

      // Get projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('id, code');

      if (projectsError) {
        console.error('Error loading projects:', projectsError);
        return;
      }

      // Get licenses
      const { data: licensesData, error: licensesError } = await supabase
        .from('licenses')
        .select('id, name');

      if (licensesError) {
        console.error('Error loading licenses:', licensesError);
        return;
      }

      // Combine data
      const formattedData: ProjectLicense[] = (projectLicensesData || []).map(pl => {
        const project = projectsData?.find(p => p.id === pl.project_id);
        const license = licensesData?.find(l => l.id === pl.license_id);
        
        return {
          project_id: pl.project_id,
          license_id: pl.license_id,
          percentage: pl.percentage,
          project_code: project?.code || '',
          license_name: license?.name || ''
        };
      });

      console.log('Loaded project licenses:', formattedData);
      setProjectLicenses(formattedData);
    };

    loadProjectLicenses();
  }, []);

  // Handle bar click to show details
  const handleBarClick = (data: any) => {
    const weekFull = data.week;
    
    if (!selectedLicense || !projectLicenses.length) return;
    
    // Create project license map
    const projectLicenseMap: { [projectCode: string]: { licenseId: string; licenseName: string; percentage: number }[] } = {};
    
    projectLicenses.forEach(pl => {
      if (!projectLicenseMap[pl.project_code]) {
        projectLicenseMap[pl.project_code] = [];
      }
      projectLicenseMap[pl.project_code].push({
        licenseId: pl.license_id,
        licenseName: pl.license_name,
        percentage: pl.percentage
      });
    });
    
    // Get engineers for this week (excluding MB Idea contractors and non-license consuming projects)
    // Now comparing full week string including year (e.g., "CW35-2025")
    const engineersThisWeek = planningData.filter(entry => {
      return entry.cw === weekFull && 
        entry.projekt !== 'FREE' && 
        entry.projekt !== 'DOVOLENÁ' &&
        entry.projekt !== 'NEMOC' &&
        entry.projekt !== 'OVER' &&
        entry.projekt !== '' &&
        entry.mhTyden > 0 &&
        !MB_IDEA_CONTRACTORS.includes(entry.konstrukter);
    });
    
    // Calculate details for selected license (excluding MB Idea contractors)
    const details: EngineerDetail[] = [];
    const seenEngineers = new Set<string>(); // Track unique engineer-project combinations
    
    engineersThisWeek.forEach(entry => {
      // Skip MB Idea contractors
      if (MB_IDEA_CONTRACTORS.includes(entry.konstrukter)) {
        return;
      }
      
      // Create unique key for engineer-project combination
      const engineerProjectKey = `${entry.konstrukter}-${entry.projekt}`;
      
      // Skip if we've already processed this engineer-project combination
      if (seenEngineers.has(engineerProjectKey)) {
        return;
      }
      seenEngineers.add(engineerProjectKey);
      
      const projectLicensesForProject = projectLicenseMap[entry.projekt];
      if (projectLicensesForProject) {
        const licenseAssignment = projectLicensesForProject.find(al => 
          al.licenseName === selectedLicense
        );
        if (licenseAssignment) {
          const requiredLicenses = Math.ceil(licenseAssignment.percentage / 100);
          details.push({
            name: entry.konstrukter,
            project: entry.projekt,
            licensePercentage: licenseAssignment.percentage,
            requiredLicenses: requiredLicenses
          });
        }
      }
    });
    
    console.log('Week details for', weekFull, ':', details);
    
    setSelectedWeek(weekFull);
    setWeekDetails(details);
    setIsDetailDialogOpen(true);
  };
  // Generate weeks starting from current week until end of 2026
  const generateWeeks = useMemo(() => {
    const weeks: string[] = [];
    
    // Get current week dynamically
    const getCurrentWeek = () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      const diff = now.getTime() - start.getTime();
      const oneWeek = 1000 * 60 * 60 * 24 * 7;
      const weekNumber = Math.ceil(diff / oneWeek);
      return Math.min(weekNumber, 52);
    };
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentWeek = getCurrentWeek();
    
    let weekNum = currentWeek;
    let year = currentYear;
    
    // Generate weeks until end of 2026
    while (year < 2027) {
      weeks.push(`CW${weekNum.toString().padStart(2, '0')}-${year}`);
      weekNum++;
      if (weekNum > 52) {
        weekNum = 1;
        year++;
      }
    }
    
    return weeks;
  }, []);

  // Mapping of CW numbers to months
  const cwToMonth: { [key: string]: string } = {
    '01': 'leden', '02': 'leden', '03': 'leden', '04': 'leden', '05': 'únor',
    '06': 'únor', '07': 'únor', '08': 'únor', '09': 'březen', '10': 'březen',
    '11': 'březen', '12': 'březen', '13': 'březen', '14': 'duben', '15': 'duben',
    '16': 'duben', '17': 'duben', '18': 'květen', '19': 'květen', '20': 'květen',
    '21': 'květen', '22': 'červen', '23': 'červen', '24': 'červen', '25': 'červen',
    '26': 'červen', '27': 'červenec', '28': 'červenec', '29': 'červenec', '30': 'červenec',
    '31': 'srpen', '32': 'srpen', '33': 'srpen', '34': 'srpen', '35': 'srpen',
    '36': 'září', '37': 'září', '38': 'září', '39': 'září', '40': 'říjen',
    '41': 'říjen', '42': 'říjen', '43': 'říjen', '44': 'listopad', '45': 'listopad',
    '46': 'listopad', '47': 'listopad', '48': 'prosinec', '49': 'prosinec',
    '50': 'prosinec', '51': 'prosinec', '52': 'prosinec',
  };

  // Generate months from weeks
  const generateMonths = useMemo(() => {
    const monthsMap = new Map<string, string[]>();
    
    generateWeeks.forEach(week => {
      const match = week.match(/CW(\d+)-(\d+)/);
      if (match) {
        const cwNum = match[1];
        const year = match[2];
        const monthName = cwToMonth[cwNum] || 'prosinec';
        const monthKey = `${monthName} ${year}`;
        
        if (!monthsMap.has(monthKey)) {
          monthsMap.set(monthKey, []);
        }
        monthsMap.get(monthKey)!.push(week);
      }
    });
    
    return Array.from(monthsMap.entries()).map(([name, weeks]) => ({ name, weeks }));
  }, [generateWeeks]);

  // Create project license map from database data
  const projectLicenseMap = useMemo(() => {
    const map: { [projectCode: string]: { licenseId: string; licenseName: string; percentage: number }[] } = {};
    
    projectLicenses.forEach(pl => {
      if (!map[pl.project_code]) {
        map[pl.project_code] = [];
      }
      map[pl.project_code].push({
        licenseId: pl.license_id,
        licenseName: pl.license_name,
        percentage: pl.percentage
      });
    });
    
    return map;
  }, [projectLicenses]);

  // Helper to check if entry is valid for license calculation
  const isValidEntry = (entry: any) => {
    return entry.projekt !== 'FREE' && 
      entry.projekt !== 'DOVOLENÁ' &&
      entry.projekt !== 'NEMOC' &&
      entry.projekt !== 'OVER' &&
      entry.projekt !== '' &&
      entry.mhTyden > 0 &&
      !MB_IDEA_CONTRACTORS.includes(entry.konstrukter);
  };

  // Weekly chart data - use aggregated licenses for calculations
  const chartData = useMemo(() => {
    if (projectLicenses.length === 0) return [];
    
    return generateWeeks.map(weekFull => {
      const weekData: any = { week: weekFull };
      
      // For each aggregated license, calculate usage for this week
      aggregatedLicenses.forEach(license => {
        // Track unique engineers that need this license
        const uniqueEngineersForLicense = new Set<string>();
        
        // Get all engineers working this week - now comparing full week string with year
        const engineersThisWeek = planningData.filter(entry => {
          return entry.cw === weekFull && isValidEntry(entry);
        });
        
        // For each engineer, check if any of their projects requires this license
        engineersThisWeek.forEach(entry => {
          const projectLicensesForProject = projectLicenseMap[entry.projekt];
          if (projectLicensesForProject) {
            const licenseAssignment = projectLicensesForProject.find(al => 
              al.licenseName === license.name
            );
            if (licenseAssignment && licenseAssignment.percentage > 0) {
              uniqueEngineersForLicense.add(entry.konstrukter);
            }
          }
        });
        
        weekData[license.name] = uniqueEngineersForLicense.size;
        weekData[`${license.name}_available`] = license.totalSeats; // Now aggregated total
      });
      
      return weekData;
    });
  }, [planningData, aggregatedLicenses, projectLicenses, generateWeeks, projectLicenseMap]);

  // Monthly chart data - aggregated peak usage per month (using aggregated licenses)
  const monthlyChartData = useMemo(() => {
    if (projectLicenses.length === 0) return [];
    
    return generateMonths.map(month => {
      const monthData: any = { week: month.name };
      
      aggregatedLicenses.forEach(license => {
        // For each week in the month, get unique engineers count
        const weeklyUsages: number[] = month.weeks.map(weekFull => {
          const uniqueEngineers = new Set<string>();
          
          const engineersThisWeek = planningData.filter(entry => {
            return entry.cw === weekFull && isValidEntry(entry);
          });
          
          engineersThisWeek.forEach(entry => {
            const projectLicensesForProject = projectLicenseMap[entry.projekt];
            if (projectLicensesForProject) {
              const licenseAssignment = projectLicensesForProject.find(al => 
                al.licenseName === license.name
              );
              if (licenseAssignment && licenseAssignment.percentage > 0) {
                uniqueEngineers.add(entry.konstrukter);
              }
            }
          });
          
          return uniqueEngineers.size;
        });
        
        // Use maximum (peak) usage for the month
        monthData[license.name] = Math.max(...weeklyUsages, 0);
        monthData[`${license.name}_available`] = license.totalSeats; // Now aggregated total
      });
      
      return monthData;
    });
  }, [planningData, aggregatedLicenses, projectLicenses, generateMonths, projectLicenseMap]);

  // Filter chart data for selected license only (based on view mode) - using aggregated totals
  const filteredChartData = useMemo(() => {
    if (!selectedLicense) return [];
    
    // Find aggregated license (sum of all with same name)
    const aggregatedLicense = aggregatedLicenses.find(l => l.name === selectedLicense);
    const totalAvailable = aggregatedLicense?.totalSeats || 0;
    
    const sourceData = viewMode === 'months' ? monthlyChartData : chartData;
    
    return sourceData.map(weekData => ({
      week: weekData.week,
      usage: weekData[selectedLicense] || 0,
      available: totalAvailable,  // Aggregated limit
      licenseLimit: totalAvailable
    }));
  }, [chartData, monthlyChartData, selectedLicense, aggregatedLicenses, viewMode]);

  // Get over-allocated licenses for alerts - using aggregated totals
  const overAllocatedWeeks = useMemo(() => {
    const issues: { week: string; license: string; required: number; available: number }[] = [];
    
    chartData.forEach(weekData => {
      aggregatedLicenses.forEach(license => {
        const required = weekData[license.name] || 0;
        const available = license.totalSeats; // Aggregated count
        if (required > available) {
          issues.push({
            week: weekData.week,
            license: license.name,
            required,
            available
          });
        }
      });
    });
    
    return issues;
  }, [chartData, aggregatedLicenses]);

  const chartConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    
    aggregatedLicenses.forEach((license, index) => {
      // Použijeme fallback barvu z našeho systému, protože licence nejsou přímo vázané na projekty
      const fallbackColors = [
        'hsl(213 88% 45%)',    // primary
        'hsl(35 80% 55%)',     // orange
        'hsl(262 83% 58%)',    // purple
        'hsl(142 80% 35%)',    // green
        'hsl(0 84% 60%)',      // red
        'hsl(48 96% 53%)',     // yellow
        'hsl(200 85% 50%)',    // cyan
        'hsl(280 75% 55%)',    // violet
      ];
      
      config[license.name] = {
        label: license.name,
        color: fallbackColors[index % fallbackColors.length],
      };
    });
    
    return config;
  }, [aggregatedLicenses]);

  return (
    <div className="space-y-4">
      {overAllocatedWeeks.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Nalezeny konflikty licencí: {overAllocatedWeeks.length} týdnů s nedostatkem licencí.
            Například {overAllocatedWeeks[0].week}: {overAllocatedWeeks[0].license} potřebuje {overAllocatedWeeks[0].required} licencí, ale máte pouze {overAllocatedWeeks[0].available}.
          </AlertDescription>
        </Alert>
      )}
      
      <Card className="p-6">
        <div className="mb-4 space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Plánované využití licencí</h3>
            <p className="text-sm text-muted-foreground">
              Graf zobrazuje požadavky na licence na základě naplánovaných projektů (do konce 2026)
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'weeks' ? 'default' : 'outline'}
                onClick={() => setViewMode('weeks')}
                size="sm"
              >
                Týdny
              </Button>
              <Button
                variant={viewMode === 'months' ? 'default' : 'outline'}
                onClick={() => setViewMode('months')}
                size="sm"
              >
                Měsíce
              </Button>
            </div>
            
            <div className="w-72">
              <Select value={selectedLicense} onValueChange={setSelectedLicense}>
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte licenci" />
                </SelectTrigger>
                <SelectContent>
                  {aggregatedLicenses.map((license) => (
                    <SelectItem key={license.name} value={license.name}>
                      {license.name} ({license.totalSeats} licencí)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" />
            {viewMode === 'weeks' 
              ? 'Klikněte na sloupec pro zobrazení detailů konstruktérů'
              : 'Měsíční pohled zobrazuje maximální (špičkové) využití v daném měsíci'
            }
          </div>
        </div>
        
        <ChartContainer config={chartConfig} className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <XAxis 
                dataKey="week" 
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                domain={[0, Math.max(...filteredChartData.map(d => Math.max(d.usage, d.available))) + 2]}
              />
              <ChartTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                        <p className="font-medium">{label}</p>
                        <p className="text-sm">
                          <span className="text-primary">Požadováno:</span> {data.usage}
                        </p>
                        <p className="text-sm">
                          <span className="text-muted-foreground">Dostupno:</span> {data.available}
                        </p>
                        {data.usage > data.available && (
                          <p className="text-sm text-destructive font-medium">
                            Nedostatek: {data.usage - data.available} licencí
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              
              <Bar
                dataKey="usage"
                name="Požadované licence"
                radius={[2, 2, 0, 0]}
                onClick={handleBarClick}
                style={{ cursor: 'pointer' }}
              >
                {filteredChartData.map((entry, index) => {
                  const isOverLimit = entry.usage > entry.available;
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={isOverLimit ? 'hsl(var(--destructive))' : 'hsl(120, 60%, 70%)'} 
                    />
                  );
                })}
              </Bar>
              
              <ReferenceLine
                y={filteredChartData[0]?.licenseLimit || 0}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{ 
                  value: `Limit: ${filteredChartData[0]?.licenseLimit || 0}`, 
                  position: 'insideTopRight',
                  style: { fontSize: '12px', fill: 'hsl(var(--muted-foreground))' }
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </Card>
      
      {/* Week Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Detail využití licencí - {selectedWeek}
              <Badge variant="outline">{selectedLicense}</Badge>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {weekDetails.length > 0 ? (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4" />
                  Celkem {weekDetails.length} konstruktérů potřebuje licenci {selectedLicense}
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Konstruktér</TableHead>
                      <TableHead>Projekt</TableHead>
                      <TableHead>Využití licence</TableHead>
                      <TableHead>Požadované licence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weekDetails.map((detail, index) => (
                      <TableRow key={`${detail.name}-${detail.project}-${index}`}>
                        <TableCell className="font-medium">{detail.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{detail.project}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{detail.licensePercentage}%</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">{detail.requiredLicenses}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Souhrn využití</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Celkový počet licencí:</span>
                      <span className="ml-2 font-mono">{weekDetails.reduce((sum, d) => sum + d.requiredLicenses, 0)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Průměrné využití:</span>
                      <span className="ml-2 font-mono">
                        {Math.round(weekDetails.reduce((sum, d) => sum + d.licensePercentage, 0) / weekDetails.length)}%
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                V týdnu {selectedWeek} není potřeba licence {selectedLicense}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};