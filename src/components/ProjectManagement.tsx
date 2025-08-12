import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Briefcase, Building, Trash2, X, Eye, Save } from 'lucide-react';
import { usePlanning } from '@/contexts/PlanningContext';
import { 
  Project, ProjectLicense, Customer, ProjectManager, Program, 
  projects as initialProjects, 
  customers, 
  projectManagers, 
  programs 
} from '@/data/projectsData';
import { getProjectColor, getCustomerByProjectCode } from '@/utils/colorSystem';

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

export const ProjectManagement = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    customerId: '',
    projectManagerId: '',
    programId: '',
    projectType: 'WP' as 'WP' | 'Hodinovka',
    budget: 0,
    averageHourlyRate: 0,
    assignedLicenses: [] as ProjectLicense[],
    projectStatus: 'Realizace' as 'Pre sales' | 'Realizace',
    probability: 0
  });
  const { toast } = useToast();
  const { planningData } = usePlanning();

  // Load projects and licenses from localStorage
  useEffect(() => {
    const savedProjects = localStorage.getItem('projects-data');
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    } else {
      setProjects(initialProjects);
      localStorage.setItem('projects-data', JSON.stringify(initialProjects));
    }

    const savedLicenses = localStorage.getItem('licenses-data');
    if (savedLicenses) {
      setLicenses(JSON.parse(savedLicenses));
    } else {
      // Default licenses if none exist
      const defaultLicenses: License[] = [
        {
          id: '1',
          name: 'AutoCAD Professional',
          type: 'software',
          provider: 'Autodesk',
          totalSeats: 10,
          usedSeats: 8,
          expirationDate: '2024-12-31',
          cost: 150000,
          status: 'active'
        },
        {
          id: '2',
          name: 'SolidWorks Premium',
          type: 'software',
          provider: 'Dassault Systèmes',
          totalSeats: 5,
          usedSeats: 5,
          expirationDate: '2024-06-15',
          cost: 200000,
          status: 'expiring-soon'
        }
      ];
      setLicenses(defaultLicenses);
    }
  }, []);

  const handleSubmit = () => {
    if (!formData.name || !formData.code || !formData.customerId || !formData.projectManagerId || !formData.programId) {
      toast({
        title: "Chyba",
        description: "Všechna povinná pole musí být vyplněna.",
        variant: "destructive",
      });
      return;
    }

    if (editingProject) {
      const updatedProjects = projects.map(project => 
        project.id === editingProject.id 
          ? { ...project, ...formData }
          : project
      );
      setProjects(updatedProjects);
      localStorage.setItem('projects-data', JSON.stringify(updatedProjects));
      toast({
        title: "Projekt upraven",
        description: "Údaje projektu byly úspěšně aktualizovány.",
      });
    } else {
      const newProject: Project = {
        id: Date.now().toString(),
        ...formData,
        status: 'active'
      };
      const updatedProjects = [...projects, newProject];
      setProjects(updatedProjects);
      localStorage.setItem('projects-data', JSON.stringify(updatedProjects));
      toast({
        title: "Projekt přidán",
        description: "Nový projekt byl úspěšně přidán.",
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      customerId: '',
      projectManagerId: '',
      programId: '',
      projectType: 'WP',
      budget: 0,
      averageHourlyRate: 0,
      assignedLicenses: [],
      projectStatus: 'Realizace',
      probability: 0
    });
    setIsAddDialogOpen(false);
    setEditingProject(null);
  };

  const addLicenseToProject = () => {
    setFormData({
      ...formData,
      assignedLicenses: [...formData.assignedLicenses, { licenseId: '', percentage: 0 }]
    });
  };

  const removeLicenseFromProject = (index: number) => {
    setFormData({
      ...formData,
      assignedLicenses: formData.assignedLicenses.filter((_, i) => i !== index)
    });
  };

  const updateProjectLicense = (index: number, field: 'licenseId' | 'percentage', value: string | number) => {
    const updated = formData.assignedLicenses.map((license, i) => 
      i === index ? { ...license, [field]: value } : license
    );
    setFormData({ ...formData, assignedLicenses: updated });
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      code: project.code,
      customerId: project.customerId,
      projectManagerId: project.projectManagerId,
      programId: project.programId,
      projectType: project.projectType,
      budget: project.budget || 0,
      averageHourlyRate: project.averageHourlyRate || 0,
      assignedLicenses: project.assignedLicenses || [],
      projectStatus: project.projectStatus || 'Realizace',
      probability: project.probability || 0
    });
    setIsAddDialogOpen(true);
  };

  // Získej všechny používané projekty z plánovacích dat
  const usedProjects = useMemo(() => {
    const projectCodes = Array.from(new Set(planningData.map(entry => entry.projekt).filter(Boolean)));
    return projectCodes.map(code => {
      const projectData = projects.find(p => p.code === code);
      const customer = customers.find(c => c.id === projectData?.customerId);
      const pm = projectManagers.find(p => p.id === projectData?.projectManagerId);
      const program = programs.find(p => p.id === projectData?.programId);
      
      return {
        code,
        project: projectData,
        customer,
        pm,
        program,
        usage: planningData.filter(entry => entry.projekt === code).length
      };
    }).sort((a, b) => b.usage - a.usage);
  }, [planningData, projects]);

  const getProjectBadge = (code: string) => {
    if (!code || code === 'FREE') return <Badge variant="secondary">Volný</Badge>;
    if (code === 'DOVOLENÁ') return <Badge variant="outline" className="border-accent">Dovolená</Badge>;
    
    const customer = getCustomerByProjectCode(code);
    if (customer) {
      return (
        <Badge 
          style={{
            backgroundColor: getProjectColor(code),
            color: 'white',
            border: 'none'
          }}
        >
          {customer.name}
        </Badge>
      );
    }
    return <Badge variant="outline">{code}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Přehled používaných projektů */}
      <Card className="p-6 shadow-card-custom">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Používané projekty</h2>
            <Badge variant="outline">{usedProjects.length} projektů</Badge>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Přidat projekt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProject ? 'Upravit projekt' : 'Přidat projekt'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Název *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="ST EMU INT"
                    />
                  </div>
                  <div>
                    <Label htmlFor="code">Kód *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="ST_EMU_INT"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="customer">Zákazník *</Label>
                    <Select value={formData.customerId} onValueChange={(value) => setFormData({ ...formData, customerId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte zákazníka" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="pm">Project Manager *</Label>
                    <Select value={formData.projectManagerId} onValueChange={(value) => setFormData({ ...formData, projectManagerId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte PM" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectManagers.map((pm) => (
                          <SelectItem key={pm.id} value={pm.id}>
                            {pm.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="program">Program *</Label>
                    <Select value={formData.programId} onValueChange={(value) => setFormData({ ...formData, programId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte program" />
                      </SelectTrigger>
                      <SelectContent>
                        {programs.map((program) => (
                          <SelectItem key={program.id} value={program.id}>
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="projectType">Typ projektu *</Label>
                    <Select value={formData.projectType} onValueChange={(value: 'WP' | 'Hodinovka') => setFormData({ ...formData, projectType: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WP">WP (Work Package)</SelectItem>
                        <SelectItem value="Hodinovka">Hodinovka</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="projectStatus">Status *</Label>
                    <Select value={formData.projectStatus} onValueChange={(value: 'Pre sales' | 'Realizace') => setFormData({ ...formData, projectStatus: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pre sales">Pre sales</SelectItem>
                        <SelectItem value="Realizace">Realizace</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.projectStatus === 'Pre sales' && (
                    <div>
                      <Label htmlFor="probability">Pravděpodobnost (%)</Label>
                      <Input
                        id="probability"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.probability || ''}
                        onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) || 0 })}
                        placeholder="75"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="budget">
                      {formData.projectType === 'WP' ? 'Budget (hodiny)' : 'Hodinová cena (Kč)'}
                    </Label>
                    <Input
                      id="budget"
                      type="number"
                      value={formData.budget || ''}
                      onChange={(e) => setFormData({ ...formData, budget: parseInt(e.target.value) || 0 })}
                      placeholder={formData.projectType === 'WP' ? '200' : '1500'}
                    />
                  </div>
                </div>
                {formData.projectType === 'WP' && (
                  <div>
                    <Label htmlFor="averageHourlyRate">Průměrná hodinová cena (Kč)</Label>
                    <Input
                      id="averageHourlyRate"
                      type="number"
                      value={formData.averageHourlyRate || ''}
                      onChange={(e) => setFormData({ ...formData, averageHourlyRate: parseInt(e.target.value) || 0 })}
                      placeholder="1200"
                    />
                  </div>
                )}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>Přiřazené licence</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addLicenseToProject}>
                      <Plus className="h-3 w-3 mr-1" />
                      Přidat licenci
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {formData.assignedLicenses.map((projectLicense, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <div className="flex-1">
                          <Select 
                            value={projectLicense.licenseId} 
                            onValueChange={(value) => updateProjectLicense(index, 'licenseId', value)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Vyberte licenci" />
                            </SelectTrigger>
                            <SelectContent>
                              {licenses.map((license) => (
                                <SelectItem key={license.id} value={license.id}>
                                  {license.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-20">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="%"
                            value={projectLicense.percentage || ''}
                            onChange={(e) => updateProjectLicense(index, 'percentage', parseInt(e.target.value) || 0)}
                            className="h-8 text-center"
                          />
                        </div>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeLicenseFromProject(index)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSubmit} className="flex-1">
                    {editingProject ? 'Upravit' : 'Přidat'}
                  </Button>
                  <Button variant="outline" onClick={resetForm} className="flex-1">
                    Zrušit
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Název</TableHead>
              <TableHead>Zákazník</TableHead>
              <TableHead>PM</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Typ</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Licence</TableHead>
              <TableHead>Použití</TableHead>
              <TableHead>Akce</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usedProjects.map((item, index) => (
              <TableRow key={item.code} className={index % 2 === 1 ? 'bg-muted/30' : 'bg-background'}>
                <TableCell className="font-medium">
                  <div className="flex flex-col gap-1">
                    <span>{item.project?.name || item.code}</span>
                    {getProjectBadge(item.code)}
                  </div>
                </TableCell>
                <TableCell>{item.customer?.name || 'N/A'}</TableCell>
                <TableCell>{item.pm?.name || 'N/A'}</TableCell>
                <TableCell>{item.program?.name || 'N/A'}</TableCell>
                <TableCell>
                  {item.project?.projectType && (
                    <Badge variant={item.project.projectType === 'WP' ? 'default' : 'secondary'}>
                      {item.project.projectType}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {item.project?.projectStatus && (
                    <div className="flex flex-col gap-1">
                      <Badge variant={item.project.projectStatus === 'Pre sales' ? 'outline' : 'default'}>
                        {item.project.projectStatus}
                      </Badge>
                      {item.project.projectStatus === 'Pre sales' && item.project.probability && (
                        <span className="text-xs text-muted-foreground">
                          {item.project.probability}%
                        </span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {item.project?.budget ? (
                    <div className="flex flex-col gap-1">
                      <span>
                        {item.project.projectType === 'WP' 
                          ? `${item.project.budget} hod` 
                          : `${item.project.budget.toLocaleString('cs-CZ')} Kč/hod`}
                      </span>
                      {item.project.projectType === 'WP' && item.project.averageHourlyRate && (
                        <span className="text-xs text-muted-foreground">
                          Ø {item.project.averageHourlyRate.toLocaleString('cs-CZ')} Kč/hod
                        </span>
                      )}
                    </div>
                  ) : 'N/A'}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {item.project?.assignedLicenses?.map((projectLicense, index) => {
                      const license = licenses.find(l => l.id === projectLicense.licenseId);
                      return (
                        <Badge key={index} variant="outline" className="text-xs">
                          {license?.name || 'Neznámá licence'} ({projectLicense.percentage}%)
                        </Badge>
                      );
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono">
                    {item.usage}x
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => item.project && handleEdit(item.project)}
                    disabled={!item.project}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {usedProjects.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  Zatím nejsou používány žádné projekty
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};