import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Legend, ReferenceLine, Cell } from 'recharts';
import { usePlanning } from '@/contexts/PlanningContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

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

  const chartData = useMemo(() => {
    // Get projects data from localStorage
    const projectsData = JSON.parse(localStorage.getItem('projects-data') || '[]') as StoredProject[];
    
    // Get all weeks from CW32 to CW52
    const weeks = ['CW32', 'CW33', 'CW34', 'CW35', 'CW36', 'CW37', 'CW38', 'CW39', 'CW40', 'CW41', 'CW42', 'CW43', 'CW44', 'CW45', 'CW46', 'CW47', 'CW48', 'CW49', 'CW50', 'CW51', 'CW52'];
    
    return weeks.map(week => {
      const weekData: any = { week };
      
      // For each license, calculate usage for this week
      licenses.forEach(license => {
        let totalUsage = 0;
        
        // Get all engineers working this week
        const engineersThisWeek = planningData.filter(entry => 
          entry.cw === week && 
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
        
        // Calculate license usage based on project assignments
        Object.entries(projectEngineers).forEach(([projectCode, engineerCount]) => {
          const project = projectsData.find(p => p.code === projectCode);
          if (project && project.assignedLicenses) {
            const licenseAssignment = project.assignedLicenses.find(al => 
              al.licenseId === license.name || al.licenseId === license.id
            );
            if (licenseAssignment) {
              const requiredLicenses = Math.ceil((engineerCount * licenseAssignment.percentage) / 100);
              totalUsage += requiredLicenses;
            }
          }
        });
        
        weekData[license.name] = totalUsage;
        weekData[`${license.name}_available`] = license.totalSeats;
      });
      
      return weekData;
    });
  }, [planningData, licenses]);

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
      const hue = (index * 137.5) % 360; // Golden angle approximation for good color distribution
      config[license.name] = {
        label: license.name,
        color: `hsl(${hue}, 70%, 50%)`,
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
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Plánované využití licencí</h3>
          <p className="text-sm text-muted-foreground">
            Graf zobrazuje požadavky na licence na základě naplánovaných projektů
          </p>
        </div>
        
        <ChartContainer config={chartConfig} className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="week" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              
              {licenses.map((license) => (
                <Bar
                  key={license.name}
                  dataKey={license.name}
                  fill={chartConfig[license.name]?.color}
                  name={license.name}
                  radius={[2, 2, 0, 0]}
                >
                  {chartData.map((entry, index) => {
                    const usage = entry[license.name] || 0;
                    const available = license.totalSeats;
                    const isOverLimit = usage > available;
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={isOverLimit ? 'hsl(var(--destructive))' : chartConfig[license.name]?.color} 
                      />
                    );
                  })}
                </Bar>
              ))}
              
              {licenses.map((license) => (
                <ReferenceLine
                  key={`ref-${license.name}`}
                  y={license.totalSeats}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="3 3"
                  label={{ value: `${license.name} limit: ${license.totalSeats}`, position: 'insideTopRight' }}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </Card>
    </div>
  );
};