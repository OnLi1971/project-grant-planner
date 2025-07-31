import React, { useState } from 'react';
import { PlanningTable } from '@/components/PlanningTable';
import { PlanningEditor } from '@/components/PlanningEditor';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Edit } from 'lucide-react';

const Index = () => {
  const [activeView, setActiveView] = useState<'overview' | 'editor'>('editor');

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
        </div>
      </Card>

      {/* Content */}
      {activeView === 'overview' ? <PlanningTable /> : <PlanningEditor />}
    </div>
  );
};

export default Index;
