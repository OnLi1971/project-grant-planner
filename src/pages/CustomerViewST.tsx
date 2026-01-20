import React from 'react';
import { ProjectAssignmentMatrix } from '@/components/ProjectAssignmentMatrix';
import { PlanningProvider } from '@/contexts/PlanningContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';

const CustomerViewST = () => {
  const today = format(new Date(), 'd. MMMM yyyy', { locale: cs });

  return (
    <PlanningProvider key="customer-st-planning-provider">
      <div className="min-h-screen bg-background">
        <Card className="m-6 p-4 shadow-card-custom">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">
                Přehled kapacit pro zákazníka Škoda Transportation
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Stav platný k {today}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </Card>

        <div className="mx-6">
          <ProjectAssignmentMatrix 
            defaultViewMode="months" 
            defaultPrograms={['RAIL', 'MACH']} 
            defaultFilterMode="custom"
            defaultCustomViewId="58440758-41f8-438c-a8dd-cc03d38b3789"
            customerViewMode="ST"
          />
        </div>
      </div>
    </PlanningProvider>
  );
};

export default CustomerViewST;
