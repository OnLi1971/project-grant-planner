import React from 'react';
import { ProjectAssignmentMatrix } from '@/components/ProjectAssignmentMatrix';
import { PlanningProvider } from '@/contexts/PlanningContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Card } from '@/components/ui/card';

const CustomerViewST = () => {
  return (
    <PlanningProvider key="customer-st-planning-provider">
      <div className="min-h-screen bg-background">
        <Card className="m-6 p-4 shadow-card-custom">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Škoda Transportation - Přehled kapacit</h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </Card>

        <div className="mx-6">
          <ProjectAssignmentMatrix 
            defaultViewMode="months" 
            defaultPrograms={['RAIL']} 
            defaultFilterMode="program"
            customerViewMode="ST"
          />
        </div>
      </div>
    </PlanningProvider>
  );
};

export default CustomerViewST;
