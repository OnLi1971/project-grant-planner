import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { PlanningTable } from '@/components/PlanningTable';
import { PlanningEditor } from '@/components/PlanningEditor';
import { FreeCapacityOverview } from '@/components/FreeCapacityOverview';
import { ProjectAssignmentMatrix } from '@/components/ProjectAssignmentMatrix';
import { RevenueOverview } from '@/components/RevenueOverview';
import { ResourceManagement } from '@/components/ResourceManagement';
import { LicenseManagement } from '@/components/LicenseManagement';
import { ProjectManagement } from '@/components/ProjectManagement';
import UserManagement from '@/components/UserManagement';
import { PlanningProvider } from '@/contexts/PlanningContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Edit, Users, Grid3x3, Database, TrendingUp, Settings, Shield, UserPlus, DollarSign, LogOut } from 'lucide-react';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [outputView, setOutputView] = useState<'overview' | 'free-capacity' | 'matrix' | 'revenue'>('overview');
  const [managementView, setManagementView] = useState<'projects' | 'resources' | 'licenses' | 'users'>('projects');

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Načítám...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <PlanningProvider>
      <div className="min-h-screen bg-background">
        <Card className="m-6 p-4 shadow-card-custom">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Plánování kapacit</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Odhlásit se
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </Card>

        <div className="mx-6">
          <Tabs defaultValue="editor" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="editor" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Vstupní data
              </TabsTrigger>
              <TabsTrigger value="outputs" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Výstupy
              </TabsTrigger>
              <TabsTrigger value="management" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Správa utilit
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="editor" className="mt-6">
              <PlanningEditor />
            </TabsContent>
            
            <TabsContent value="outputs" className="mt-6">
              <Card className="p-4 shadow-card-custom">
                <div className="flex gap-2 mb-6">
                  <Button
                    variant={outputView === 'overview' ? 'default' : 'outline'}
                    onClick={() => setOutputView('overview')}
                    className="flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Přehled plánování
                  </Button>
                  <Button
                    variant={outputView === 'free-capacity' ? 'default' : 'outline'}
                    onClick={() => setOutputView('free-capacity')}
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Volné kapacity
                  </Button>
                  <Button
                    variant={outputView === 'matrix' ? 'default' : 'outline'}
                    onClick={() => setOutputView('matrix')}
                    className="flex items-center gap-2"
                  >
                    <Grid3x3 className="h-4 w-4" />
                    Matice projektů
                  </Button>
                  <Button
                    variant={outputView === 'revenue' ? 'default' : 'outline'}
                    onClick={() => setOutputView('revenue')}
                    className="flex items-center gap-2"
                  >
                    <DollarSign className="h-4 w-4" />
                    Revenue
                  </Button>
                </div>
              </Card>
              
              {outputView === 'overview' ? (
                <PlanningTable />
              ) : outputView === 'free-capacity' ? (
                <FreeCapacityOverview />
              ) : outputView === 'matrix' ? (
                <ProjectAssignmentMatrix />
              ) : (
                <RevenueOverview />
              )}
            </TabsContent>

            <TabsContent value="management" className="mt-6">
              <Card className="p-4 shadow-card-custom">
                <div className="flex gap-2 mb-6">
                  <Button
                    variant={managementView === 'projects' ? 'default' : 'outline'}
                    onClick={() => setManagementView('projects')}
                    className="flex items-center gap-2"
                  >
                    <Database className="h-4 w-4" />
                    Správa projektů
                  </Button>
                  <Button
                    variant={managementView === 'resources' ? 'default' : 'outline'}
                    onClick={() => setManagementView('resources')}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Správa zdrojů
                  </Button>
                  <Button
                    variant={managementView === 'licenses' ? 'default' : 'outline'}
                    onClick={() => setManagementView('licenses')}
                    className="flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Správa licencí
                  </Button>
                  <Button
                    variant={managementView === 'users' ? 'default' : 'outline'}
                    onClick={() => setManagementView('users')}
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Správa uživatelů
                  </Button>
                </div>
              </Card>
              
              {managementView === 'projects' ? (
                <ProjectManagement />
              ) : managementView === 'resources' ? (
                <ResourceManagement />
              ) : managementView === 'licenses' ? (
                <LicenseManagement />
              ) : (
                <UserManagement />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PlanningProvider>
  );
};

export default Index;
