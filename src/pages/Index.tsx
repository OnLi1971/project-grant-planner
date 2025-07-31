import React, { useState } from 'react';
import { PlanningTable } from '@/components/PlanningTable';
import { PlanningEditor } from '@/components/PlanningEditor';
import { FreeCapacityOverview } from '@/components/FreeCapacityOverview';
import { ProjectAssignmentMatrix } from '@/components/ProjectAssignmentMatrix';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Edit, Users, Grid3x3 } from 'lucide-react';

const Index = () => {
  const [activeView, setActiveView] = useState<'overview' | 'editor' | 'free-capacity' | 'matrix'>('editor');

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Card className="m-6 p-4 shadow-card-custom">
        <div className="flex gap-2">
          <Button
            variant={activeView === 'overview' ? 'default' : 'outline'}
            onClick={() => setActiveView('overview')}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Přehled plánování
          </Button>
          <Button
            variant={activeView === 'editor' ? 'default' : 'outline'}
            onClick={() => setActiveView('editor')}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Editor plánování
          </Button>
          <Button
            variant={activeView === 'free-capacity' ? 'default' : 'outline'}
            onClick={() => setActiveView('free-capacity')}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Volné kapacity
          </Button>
          <Button
            variant={activeView === 'matrix' ? 'default' : 'outline'}
            onClick={() => setActiveView('matrix')}
            className="flex items-center gap-2"
          >
            <Grid3x3 className="h-4 w-4" />
            Matice projektů
          </Button>
        </div>
      </Card>

      {/* Content */}
      {activeView === 'overview' ? (
        <PlanningTable />
      ) : activeView === 'editor' ? (
        <PlanningEditor />
      ) : activeView === 'free-capacity' ? (
        <FreeCapacityOverview />
      ) : (
        <ProjectAssignmentMatrix />
      )}
    </div>
  );
};

export default Index;
