import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePlanning } from '@/contexts/PlanningContext';
import { Calendar, Users, AlertTriangle } from 'lucide-react';

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

interface CurrentWeekLicenseUsageProps {
  licenses: License[];
}

export const CurrentWeekLicenseUsage: React.FC<CurrentWeekLicenseUsageProps> = ({ licenses }) => {
  const { planningData } = usePlanning();

  const getCurrentWeek = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const today = Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    const currentWeek = Math.ceil((today + start.getDay() + 1) / 7);
    return `CW${currentWeek}`;
  };

  const currentWeekUsage = useMemo(() => {
    const currentWeek = getCurrentWeek();
    const projectsData = JSON.parse(localStorage.getItem('projects-data') || '[]') as Project[];
    
    // Get all engineers working this week
    const engineersThisWeek = planningData.filter(entry => 
      entry.cw === currentWeek && 
      entry.projekt !== 'FREE' && 
      entry.projekt !== 'DOVOLENÁ' && 
      entry.projekt !== '' &&
      entry.mhTyden > 0
    );
    
    // Count unique engineers per project
    const projectEngineers: { [projectCode: string]: string[] } = {};
    engineersThisWeek.forEach(entry => {
      if (!projectEngineers[entry.projekt]) {
        projectEngineers[entry.projekt] = [];
      }
      if (!projectEngineers[entry.projekt].includes(entry.konstrukter)) {
        projectEngineers[entry.projekt].push(entry.konstrukter);
      }
    });
    
    // Calculate license usage
    const licenseUsage: { [licenseName: string]: { required: number; projects: string[] } } = {};
    
    licenses.forEach(license => {
      licenseUsage[license.name] = { required: 0, projects: [] };
      
      Object.entries(projectEngineers).forEach(([projectCode, engineers]) => {
        const project = projectsData.find(p => p.code === projectCode);
        if (project && project.assignedLicenses) {
          const licenseAssignment = project.assignedLicenses.find(al => al.name === license.name);
          if (licenseAssignment) {
            const requiredLicenses = Math.ceil((engineers.length * licenseAssignment.percentage) / 100);
            licenseUsage[license.name].required += requiredLicenses;
            if (requiredLicenses > 0) {
              licenseUsage[license.name].projects.push(`${project.name} (${requiredLicenses})`);
            }
          }
        }
      });
    });
    
    return { currentWeek, licenseUsage };
  }, [planningData, licenses]);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Využití licencí v aktuálním týdnu</h3>
        <Badge variant="outline">{currentWeekUsage.currentWeek}</Badge>
      </div>
      
      <div className="space-y-3">
        {licenses.map(license => {
          const usage = currentWeekUsage.licenseUsage[license.name];
          const isOverAllocated = usage.required > license.totalSeats;
          
          return (
            <div key={license.id} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{license.name}</span>
                  <span className="text-sm text-muted-foreground">({license.provider})</span>
                  {isOverAllocated && (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  )}
                </div>
                {usage.projects.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Projekty: {usage.projects.join(', ')}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className={`font-medium ${isOverAllocated ? 'text-destructive' : ''}`}>
                    {usage.required} / {license.totalSeats}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round((usage.required / license.totalSeats) * 100)}% využití
                  </div>
                </div>
                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      isOverAllocated ? 'bg-destructive' : 'bg-primary'
                    }`}
                    style={{ 
                      width: `${Math.min((usage.required / license.totalSeats) * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};