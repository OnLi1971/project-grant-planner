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

interface CurrentWeekLicenseUsageProps {
  licenses: License[];
}

export const CurrentWeekLicenseUsage: React.FC<CurrentWeekLicenseUsageProps> = ({ licenses }) => {
  const { planningData } = usePlanning();

  const getCurrentWeek = () => {
    // For demonstration, let's use CW32 as current week since that's where our planning data starts
    // In real implementation, you would calculate the actual current week
    return 'CW32';
  };

  const currentWeekUsage = useMemo(() => {
    const currentWeek = getCurrentWeek();
    let projectsData = JSON.parse(localStorage.getItem('projects-data') || '[]') as StoredProject[];
    
    // If no projects data exists, load default projects first
    if (projectsData.length === 0) {
      // Import default projects from projectsData.ts
      const defaultProjects = [
        { id: '1', name: 'ST EMU INT', code: 'ST_EMU_INT', customerId: '1', projectManagerId: '1', programId: '1', status: 'active' as const, projectType: 'WP' as const },
        { id: '2', name: 'ST TRAM INT', code: 'ST_TRAM_INT', customerId: '1', projectManagerId: '2', programId: '1', status: 'active' as const, projectType: 'WP' as const },
        { id: '3', name: 'ST MAINZ', code: 'ST_MAINZ', customerId: '1', projectManagerId: '2', programId: '1', status: 'active' as const, projectType: 'WP' as const },
        { id: '5', name: 'ST BLAVA', code: 'ST_BLAVA', customerId: '1', projectManagerId: '2', programId: '1', status: 'active' as const, projectType: 'WP' as const },
      ];
      projectsData = defaultProjects;
    }
    
    // If projects don't have license assignments, create some test data
    if (!projectsData.some(p => p.assignedLicenses && p.assignedLicenses.length > 0)) {
      // Add some default license assignments for testing
      projectsData = projectsData.map(project => {
        if (project.code === 'ST_BLAVA') {
          return {
            ...project,
            assignedLicenses: [
              { licenseId: 'AutoCAD Professional', percentage: 100 },
              { licenseId: 'SolidWorks Premium', percentage: 50 }
            ]
          };
        }
        if (project.code === 'ST_MAINZ') {
          return {
            ...project,
            assignedLicenses: [
              { licenseId: 'AutoCAD Professional', percentage: 80 },
              { licenseId: 'SolidWorks Premium', percentage: 100 }
            ]
          };
        }
        if (project.code === 'ST_EMU_INT') {
          return {
            ...project,
            assignedLicenses: [
              { licenseId: 'SolidWorks Premium', percentage: 100 }
            ]
          };
        }
        return project;
      });
      
      // Save the updated data
      localStorage.setItem('projects-data', JSON.stringify(projectsData));
    }
    
    console.log('Current week:', currentWeek);
    console.log('Projects data:', projectsData);
    console.log('Planning data sample:', planningData.slice(0, 5));
    
    // Get all engineers working this week
    const engineersThisWeek = planningData.filter(entry => 
      entry.cw === currentWeek && 
      entry.projekt !== 'FREE' && 
      entry.projekt !== 'DOVOLENÁ' && 
      entry.projekt !== '' &&
      entry.mhTyden > 0
    );
    
    console.log('Engineers this week:', engineersThisWeek);
    
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
    
    console.log('Project engineers:', projectEngineers);
    
    // Calculate license usage
    const licenseUsage: { [licenseName: string]: { required: number; projects: string[] } } = {};
    
    licenses.forEach(license => {
      licenseUsage[license.name] = { required: 0, projects: [] };
      
      Object.entries(projectEngineers).forEach(([projectCode, engineers]) => {
        const project = projectsData.find(p => p.code === projectCode);
        console.log(`Looking for project with code ${projectCode}, found:`, project);
        
        if (project && project.assignedLicenses) {
          // Handle the different data structure - stored projects use licenseId, we need to match by license name
          const licenseAssignment = project.assignedLicenses.find(al => {
            // First try to find by licenseId if it matches license name
            return al.licenseId === license.name || al.licenseId === license.id;
          });
          console.log(`License assignment for ${license.name} in project ${projectCode}:`, licenseAssignment);
          
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
    
    console.log('Final license usage:', licenseUsage);
    
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