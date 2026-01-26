import React, { useMemo, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePlanning } from '@/contexts/PlanningContext';
import { Calendar, Users, AlertTriangle } from 'lucide-react';
import { getProjectColor, getCustomerByProjectCode } from '@/utils/colorSystem';
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

interface ProjectLicense {
  project_id: string;
  license_id: string;
  percentage: number;
  project_code: string;
  license_name: string;
}

interface CurrentWeekLicenseUsageProps {
  licenses: License[];
}

export const CurrentWeekLicenseUsage: React.FC<CurrentWeekLicenseUsageProps> = ({ licenses }) => {
  const { planningData } = usePlanning();
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

      console.log('Loaded project licenses for current week:', formattedData);
      setProjectLicenses(formattedData);
    };

    loadProjectLicenses();
  }, []);

  const getCurrentWeek = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    const weekNumber = Math.ceil(diff / oneWeek);
    return `CW${Math.min(weekNumber, 52)}`;
  };

  // Aggregate licenses with the same name (sum totalSeats)
  const aggregatedLicenses = useMemo(() => {
    const licenseMap = new Map<string, {
      name: string;
      totalSeats: number;
      ids: string[];
      provider: string;
    }>();
    
    licenses.forEach(license => {
      const existing = licenseMap.get(license.name);
      if (existing) {
        existing.totalSeats += license.totalSeats;
        existing.ids.push(license.id);
      } else {
        licenseMap.set(license.name, {
          name: license.name,
          totalSeats: license.totalSeats,
          ids: [license.id],
          provider: license.provider
        });
      }
    });
    
    return Array.from(licenseMap.values());
  }, [licenses]);

  const currentWeekUsage = useMemo(() => {
    const currentWeek = getCurrentWeek();
    
    if (projectLicenses.length === 0) {
      return { currentWeek, licenseUsage: {} };
    }
    
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
    
    console.log('Current week:', currentWeek);
    console.log('Planning data sample:', planningData.slice(0, 5));
    
    // Get all engineers working this week (excluding MB Idea contractors and non-license consuming projects)
    const engineersThisWeek = planningData.filter(entry => {
      // Extract week without year for comparison (e.g., "CW35-2025" -> "CW35")
      const cwWithoutYear = entry.cw.split('-')[0];
      return cwWithoutYear === currentWeek && 
        entry.projekt !== 'FREE' && 
        entry.projekt !== 'DOVOLENÁ' &&
        entry.projekt !== 'NEMOC' &&
        entry.projekt !== 'OVER' &&
        entry.projekt !== '' &&
        entry.mhTyden > 0 &&
        !MB_IDEA_CONTRACTORS.includes(entry.konstrukter);
    });
    
    console.log('Engineers this week:', engineersThisWeek);
    
    // Count unique engineers per project (excluding MB Idea contractors)
    const projectEngineers: { [projectCode: string]: string[] } = {};
    engineersThisWeek.forEach(entry => {
      // Skip MB Idea contractors
      if (MB_IDEA_CONTRACTORS.includes(entry.konstrukter)) {
        return;
      }
      
      if (!projectEngineers[entry.projekt]) {
        projectEngineers[entry.projekt] = [];
      }
      if (!projectEngineers[entry.projekt].includes(entry.konstrukter)) {
        projectEngineers[entry.projekt].push(entry.konstrukter);
      }
    });
    
    console.log('Project engineers:', projectEngineers);
    
    // Calculate license usage - using aggregated licenses
    const licenseUsage: { [licenseName: string]: { required: number; projects: string[]; totalSeats: number } } = {};
    
    aggregatedLicenses.forEach(license => {
      licenseUsage[license.name] = { required: 0, projects: [], totalSeats: license.totalSeats };
      
      // Track unique engineers that need this license across all projects
      const uniqueEngineersForLicense = new Set<string>();
      
      Object.entries(projectEngineers).forEach(([projectCode, engineers]) => {
        const projectLicensesForProject = projectLicenseMap[projectCode];
        console.log(`Project licenses for ${projectCode}:`, projectLicensesForProject);
        
        if (projectLicensesForProject) {
          const licenseAssignment = projectLicensesForProject.find(al => 
            al.licenseName === license.name
          );
          console.log(`License assignment for ${license.name} in project ${projectCode}:`, licenseAssignment);
          
          if (licenseAssignment && licenseAssignment.percentage > 0) {
            // Add these engineers to the unique set
            engineers.forEach(eng => uniqueEngineersForLicense.add(eng));
            
            // Track project for display purposes
            const requiredLicenses = Math.ceil((engineers.length * licenseAssignment.percentage) / 100);
            if (requiredLicenses > 0) {
              licenseUsage[license.name].projects.push(`${projectCode} (${requiredLicenses})`);
            }
          }
        }
      });
      
      // Set total required to unique engineers count
      licenseUsage[license.name].required = uniqueEngineersForLicense.size;
    });
    
    console.log('Final license usage:', licenseUsage);
    
    return { currentWeek, licenseUsage };
  }, [planningData, aggregatedLicenses, projectLicenses]);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Využití licencí v aktuálním týdnu</h3>
        <Badge variant="outline">{currentWeekUsage.currentWeek}</Badge>
      </div>
      
      <div className="space-y-3">
        {aggregatedLicenses.map(license => {
          const usage = currentWeekUsage.licenseUsage[license.name] || { required: 0, projects: [], totalSeats: license.totalSeats };
          const isOverAllocated = usage.required > license.totalSeats;
          
          return (
            <div key={license.name} className="flex items-center justify-between p-3 rounded-lg border">
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