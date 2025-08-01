import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Building2, User, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { customers, projectManagers, programs, projects, type Customer, type ProjectManager, type Program, type Project } from '@/data/projectsData';

interface ProjectManagementProps {
  onProjectCreated?: (project: Project) => void;
}

export const ProjectManagement: React.FC<ProjectManagementProps> = ({ onProjectCreated }) => {
  const { toast } = useToast();
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isPMDialogOpen, setIsPMDialogOpen] = useState(false);
  const [isProgramDialogOpen, setIsProgramDialogOpen] = useState(false);

  // Stavy pro nový projekt
  const [newProject, setNewProject] = useState({
    name: '',
    code: '',
    customerId: '',
    projectManagerId: '',
    programId: '',
    status: 'active' as const
  });

  // Stavy pro nové entity
  const [newCustomer, setNewCustomer] = useState({ name: '', code: '' });
  const [newPM, setNewPM] = useState({ name: '', email: '' });
  const [newProgram, setNewProgram] = useState({ name: '', code: '' });

  // Lokální seznamy (v reálné aplikaci by byly v kontextu nebo databázi)
  const [localCustomers, setLocalCustomers] = useState<Customer[]>(customers);
  const [localPMs, setLocalPMs] = useState<ProjectManager[]>(projectManagers);
  const [localPrograms, setLocalPrograms] = useState<Program[]>(programs);
  const [localProjects, setLocalProjects] = useState<Project[]>(projects);

  const handleCreateProject = () => {
    if (!newProject.name || !newProject.code || !newProject.customerId || !newProject.projectManagerId || !newProject.programId) {
      toast({
        title: "Chyba",
        description: "Všechna pole jsou povinná",
        variant: "destructive"
      });
      return;
    }

    const project: Project = {
      id: Date.now().toString(),
      ...newProject
    };

    setLocalProjects(prev => [...prev, project]);
    onProjectCreated?.(project);
    
    toast({
      title: "Projekt vytvořen",
      description: `Projekt ${project.name} byl úspěšně vytvořen`
    });

    setNewProject({ name: '', code: '', customerId: '', projectManagerId: '', programId: '', status: 'active' });
    setIsProjectDialogOpen(false);
  };

  const handleCreateCustomer = () => {
    if (!newCustomer.name || !newCustomer.code) {
      toast({
        title: "Chyba",
        description: "Název a kód zákazníka jsou povinné",
        variant: "destructive"
      });
      return;
    }

    const customer: Customer = {
      id: Date.now().toString(),
      ...newCustomer
    };

    setLocalCustomers(prev => [...prev, customer]);
    setNewCustomer({ name: '', code: '' });
    setIsCustomerDialogOpen(false);
    
    toast({
      title: "Zákazník vytvořen",
      description: `Zákazník ${customer.name} byl úspěšně vytvořen`
    });
  };

  const handleCreatePM = () => {
    if (!newPM.name || !newPM.email) {
      toast({
        title: "Chyba",
        description: "Jméno a email PM jsou povinné",
        variant: "destructive"
      });
      return;
    }

    const pm: ProjectManager = {
      id: Date.now().toString(),
      ...newPM
    };

    setLocalPMs(prev => [...prev, pm]);
    setNewPM({ name: '', email: '' });
    setIsPMDialogOpen(false);
    
    toast({
      title: "PM vytvořen",
      description: `PM ${pm.name} byl úspěšně vytvořen`
    });
  };

  const handleCreateProgram = () => {
    if (!newProgram.name || !newProgram.code) {
      toast({
        title: "Chyba",
        description: "Název a kód programu jsou povinné",
        variant: "destructive"
      });
      return;
    }

    const program: Program = {
      id: Date.now().toString(),
      ...newProgram
    };

    setLocalPrograms(prev => [...prev, program]);
    setNewProgram({ name: '', code: '' });
    setIsProgramDialogOpen(false);
    
    toast({
      title: "Program vytvořen",
      description: `Program ${program.name} byl úspěšně vytvořen`
    });
  };

  return (
    <div className="space-y-4">
      {/* Hlavní tlačítko pro vytvoření projektu */}
      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Založit nový projekt
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Založit nový projekt</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Název projektu</Label>
                <Input
                  id="project-name"
                  value={newProject.name}
                  onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Zadejte název projektu"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="project-code">Kód projektu</Label>
                <Input
                  id="project-code"
                  value={newProject.code}
                  onChange={(e) => setNewProject(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="Zadejte kód projektu"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Zákazník</Label>
                <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Building2 className="mr-2 h-4 w-4" />
                      Nový zákazník
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Založit nového zákazníka</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="customer-name">Název zákazníka</Label>
                        <Input
                          id="customer-name"
                          value={newCustomer.name}
                          onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Zadejte název zákazníka"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customer-code">Kód zákazníka</Label>
                        <Input
                          id="customer-code"
                          value={newCustomer.code}
                          onChange={(e) => setNewCustomer(prev => ({ ...prev, code: e.target.value }))}
                          placeholder="Zadejte kód zákazníka"
                        />
                      </div>
                      <Button onClick={handleCreateCustomer}>Vytvořit zákazníka</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Select value={newProject.customerId} onValueChange={(value) => setNewProject(prev => ({ ...prev, customerId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte zákazníka" />
                </SelectTrigger>
                <SelectContent>
                  {localCustomers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} ({customer.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Project Manager</Label>
                <Dialog open={isPMDialogOpen} onOpenChange={setIsPMDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <User className="mr-2 h-4 w-4" />
                      Nový PM
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Založit nového PM</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="pm-name">Jméno PM</Label>
                        <Input
                          id="pm-name"
                          value={newPM.name}
                          onChange={(e) => setNewPM(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Zadejte jméno PM"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pm-email">Email PM</Label>
                        <Input
                          id="pm-email"
                          type="email"
                          value={newPM.email}
                          onChange={(e) => setNewPM(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Zadejte email PM"
                        />
                      </div>
                      <Button onClick={handleCreatePM}>Vytvořit PM</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Select value={newProject.projectManagerId} onValueChange={(value) => setNewProject(prev => ({ ...prev, projectManagerId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte PM" />
                </SelectTrigger>
                <SelectContent>
                  {localPMs.map(pm => (
                    <SelectItem key={pm.id} value={pm.id}>
                      {pm.name} ({pm.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Program</Label>
                <Dialog open={isProgramDialogOpen} onOpenChange={setIsProgramDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Briefcase className="mr-2 h-4 w-4" />
                      Nový program
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Založit nový program</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="program-name">Název programu</Label>
                        <Input
                          id="program-name"
                          value={newProgram.name}
                          onChange={(e) => setNewProgram(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Zadejte název programu"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="program-code">Kód programu</Label>
                        <Input
                          id="program-code"
                          value={newProgram.code}
                          onChange={(e) => setNewProgram(prev => ({ ...prev, code: e.target.value }))}
                          placeholder="Zadejte kód programu"
                        />
                      </div>
                      <Button onClick={handleCreateProgram}>Vytvořit program</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Select value={newProject.programId} onValueChange={(value) => setNewProject(prev => ({ ...prev, programId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte program" />
                </SelectTrigger>
                <SelectContent>
                  {localPrograms.map(program => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name} ({program.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleCreateProject} className="mt-4">
              Vytvořit projekt
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};