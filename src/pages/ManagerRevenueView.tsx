import React from 'react';
import { RevenueOverview } from '@/components/RevenueOverview';
import { PlanningProvider } from '@/contexts/PlanningContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ManagerRevenueView = () => {
  const navigate = useNavigate();

  return (
    <PlanningProvider key="manager-revenue-planning-provider">
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
              <h1 className="text-2xl font-bold">Manažerský pohled - Revenue</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </Card>

        <div className="mx-6">
          <RevenueOverview />
        </div>
      </div>
    </PlanningProvider>
  );
};

export default ManagerRevenueView;
