import React, { useMemo, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, ReferenceLine, Cell } from 'recharts';
import { usePlanning } from '@/contexts/PlanningContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getProjectColorWithIndex } from '@/utils/colorSystem';
import { supabase } from '@/integrations/supabase/client';

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
  const [selectedLicense, setSelectedLicense] = useState<string>(licenses[0]?.name || '');
  const [projectLicenses, setProjectLicenses] = useState<ProjectLicense[]>([]);

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

  // Generate weeks starting from current week
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
    
    const currentWeek = 35; // CW35 as current week
    
    // Generate 22 weeks from current week
    for (let i = 0; i < 22; i++) {
      let weekNum = currentWeek + i;
      let year = '';
      
      if (weekNum > 52) {
        weekNum = weekNum - 52;
        year = ' (next year)';
      }
      
      weeks.push(`CW${weekNum}${year}`);
    }
    
    return weeks;
  }, []);

  const chartData = useMemo(() => {
    if (projectLicenses.length === 0) return [];
    
    // Create project license map from database data
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
    
    console.log('Project license map:', projectLicenseMap);
    
    return generateWeeks.map(week => {
      const weekData: any = { week };
      const weekOnly = week.replace(' (next year)', '');
      
      // For each license, calculate usage for this week
      licenses.forEach(license => {
        let totalUsage = 0;
        
        // Get all engineers working this week
        const engineersThisWeek = planningData.filter(entry => 
          entry.cw === weekOnly && 
          entry.projekt !== 'FREE' && 
          entry.projekt !== 'DOVOLENÁ' && 
          entry.projekt !== '' &&
          entry.mhTyden > 0
        );
        
        // Count unique engineers per project
        const projectEngineers: { [projectCode: string]: number } = {};
        engineersThisWeek.forEach(entry => {
          if (!projectEngineers[entry.projekt]) {
            projectEngineers[entry.projekt] = 0;
          }
          projectEngineers[entry.projekt]++;
        });
        
        console.log(`Week ${weekOnly} project engineers:`, projectEngineers);
        
        // Calculate license usage based on project assignments
        Object.entries(projectEngineers).forEach(([projectCode, engineerCount]) => {
          const projectLicensesForProject = projectLicenseMap[projectCode];
          if (projectLicensesForProject) {
            const licenseAssignment = projectLicensesForProject.find(al => 
              al.licenseName === license.name
            );
            if (licenseAssignment) {
              const requiredLicenses = Math.ceil((engineerCount * licenseAssignment.percentage) / 100);
              totalUsage += requiredLicenses;
              console.log(`Project ${projectCode}: ${engineerCount} engineers, ${licenseAssignment.percentage}% = ${requiredLicenses} ${license.name} licenses`);
            }
          }
        });
        
        weekData[license.name] = totalUsage;
        weekData[`${license.name}_available`] = license.totalSeats;
      });
      
      return weekData;
    });
  }, [planningData, licenses, projectLicenses, generateWeeks]);

  // Filter chart data for selected license only
  const filteredChartData = useMemo(() => {
    if (!selectedLicense) return [];
    
    const selectedLicenseData = licenses.find(l => l.name === selectedLicense);
    if (!selectedLicenseData) return [];
    
    console.log('Selected license data:', selectedLicenseData);
    
    return chartData.map(weekData => ({
      week: weekData.week,
      usage: weekData[selectedLicense] || 0,
      available: selectedLicenseData.totalSeats,
      licenseLimit: selectedLicenseData.totalSeats
    }));
  }, [chartData, selectedLicense, licenses]);

  // Get over-allocated licenses for alerts
  const overAllocatedWeeks = useMemo(() => {
    const issues: { week: string; license: string; required: number; available: number }[] = [];
    
    chartData.forEach(weekData => {
      licenses.forEach(license => {
        const required = weekData[license.name] || 0;
        const available = license.totalSeats;
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
  }, [chartData, licenses]);

  const chartConfig: ChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    
    licenses.forEach((license, index) => {
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
  }, [licenses]);

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
              Graf zobrazuje požadavky na licence na základě naplánovaných projektů
            </p>
          </div>
          
          <div className="w-64">
            <Select value={selectedLicense} onValueChange={setSelectedLicense}>
              <SelectTrigger>
                <SelectValue placeholder="Vyberte licenci" />
              </SelectTrigger>
              <SelectContent>
                {licenses.map((license) => (
                  <SelectItem key={license.name} value={license.name}>
                    {license.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
    </div>
  );
};