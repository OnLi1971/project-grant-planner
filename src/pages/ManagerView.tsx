import React from 'react';
import { ProjectAssignmentMatrix } from '@/components/ProjectAssignmentMatrix';
import { PlanningProvider } from '@/contexts/PlanningContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ManagerView = () => {
  const navigate = useNavigate();

  return (
    <PlanningProvider key="manager-planning-provider">
      <div className="min-h-screen bg-background">
        <Card className="m-6 p-4 shadow-card-custom">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Zpět
              </Button>
              <h1 className="text-2xl font-bold">Manažerský pohled - Matice plánování projektů</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </Card>

        <div className="mx-6">
          <ProjectAssignmentMatrix defaultViewMode="months" defaultPrograms={['RAIL', 'MACH']} defaultFilterMode="custom" defaultCustomViewId="58440758-41f8-438c-a8dd-cc03d38b3789" />
        </div>
      </div>
    </PlanningProvider>
  );
};

export default ManagerView;
