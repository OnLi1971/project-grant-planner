import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { PlanningEditor } from '@/components/PlanningEditor';
import { ProjectAssignmentMatrix } from '@/components/ProjectAssignmentMatrix';
import { RevenueOverview } from '@/components/RevenueOverview';
import { ResourceManagement } from '@/components/ResourceManagement';
import { LicenseManagement } from '@/components/LicenseManagement';
import { ProjectManagement } from '@/components/ProjectManagement';
import UserManagement from '@/components/UserManagement';
import { EngineerManagement } from '@/components/EngineerManagement';
import { EngineerMigration } from '@/components/EngineerMigration';
import { PlanningProvider } from '@/contexts/PlanningContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Grid3x3, Database, TrendingUp, Settings, Shield, UserPlus, DollarSign, LogOut, BarChart3, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [outputView, setOutputView] = useState<'matrix' | 'revenue'>('matrix');
  const [managementView, setManagementView] = useState<'projects' | 'resources' | 'licenses' | 'users' | 'engineers' | 'migration'>('projects');

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
    <PlanningProvider key="planning-provider-stable">
      <div className="min-h-screen bg-background">
        <Card className="m-6 p-4 shadow-card-custom">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Plánování kapacit</h1>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Manažerský pohled
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/manager')}>
                    <Grid3x3 className="h-4 w-4 mr-2" />
                    Plánování kapacit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/manager-revenue')}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Revenue
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/customer/st')}>
                    <Users className="h-4 w-4 mr-2" />
                    Pohled pro ST
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
              <Card className="p-3 shadow-card-custom">
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={outputView === 'matrix' ? 'default' : 'outline'}
                    onClick={() => setOutputView('matrix')}
                    className="flex items-center gap-2 text-sm h-8"
                    size="sm"
                  >
                    <Grid3x3 className="h-3.5 w-3.5" />
                    Matice projektů
                  </Button>
                  <Button
                    variant={outputView === 'revenue' ? 'default' : 'outline'}
                    onClick={() => setOutputView('revenue')}
                    className="flex items-center gap-2 text-sm h-8"
                    size="sm"
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    Revenue
                  </Button>
                </div>
              </Card>
              
              {outputView === 'matrix' ? (
                <ProjectAssignmentMatrix defaultFilterMode="custom" defaultCustomViewId="58440758-41f8-438c-a8dd-cc03d38b3789" />
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
                  <Button
                    variant={managementView === 'engineers' ? 'default' : 'outline'}
                    onClick={() => setManagementView('engineers')}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Správa konstruktérů
                  </Button>
                  <Button
                    variant={managementView === 'migration' ? 'default' : 'outline'}
                    onClick={() => setManagementView('migration')}
                    className="flex items-center gap-2"
                  >
                    <Database className="h-4 w-4" />
                    Migrace dat
                  </Button>
                </div>
              </Card>
              
              {managementView === 'projects' ? (
                <ProjectManagement />
              ) : managementView === 'resources' ? (
                <ResourceManagement />
              ) : managementView === 'licenses' ? (
                <LicenseManagement />
              ) : managementView === 'users' ? (
                <UserManagement />
              ) : managementView === 'engineers' ? (
                <EngineerManagement />
              ) : (
                <EngineerMigration />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PlanningProvider>
  );
};

export default Index;
