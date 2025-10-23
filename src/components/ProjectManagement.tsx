import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Briefcase, Building, Trash2, X, Eye, Save, Users } from 'lucide-react';
import { usePlanning } from '@/contexts/PlanningContext';
import { getProjectColor, getCustomerByProjectCode } from '@/utils/colorSystem';
import { supabase } from '@/integrations/supabase/client';
import { OrganizationalStructure } from '@/components/OrganizationalStructure';

interface License {
  id: string;
  name: string;
  type: string;
  provider: string;
  total_seats: number;
  used_seats: number;
  expiration_date: string;
  cost: number;
  status: string;
}

interface DatabaseProject {
  id: string;
  name: string;
  code: string;
  customer_id: string;
  project_manager_id: string;
  program_id: string;
  start_date?: string;
  end_date?: string;
  status: string;
  hourly_rate?: number;
  project_type: string;
  budget?: number;
  average_hourly_rate?: number;
  project_status?: string;
  probability?: number;
  created_at?: string;
  updated_at?: string;
  project_licenses?: ProjectLicense[];
}

interface DatabaseCustomer {
  id: string;
  name: string;
  code: string;
}

interface DatabaseProjectManager {
  id: string;
  name: string;
  email: string;
}

interface DatabaseProgram {
  id: string;
  name: string;
  code: string;
}

interface ProjectLicense {
  id?: string;
  project_id?: string;
  license_id: string;
  percentage: number;
  license_name?: string;
}

export const ProjectManagement = () => {
  const [projects, setProjects] = useState<DatabaseProject[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [customers, setCustomers] = useState<DatabaseCustomer[]>([]);
  const [projectManagers, setProjectManagers] = useState<DatabaseProjectManager[]>([]);
  const [programs, setPrograms] = useState<DatabaseProgram[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<DatabaseProject | null>(null);
  const [isAddCustomerDialogOpen, setIsAddCustomerDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    code: ''
  });
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
    probability: 0,
    presalesPhase: 'P0',
    presalesStartDate: '',
    presalesEndDate: '',
    parentOpportunity: '',
    crmCreationDate: '',
    opportunityNumber: ''
  });

  const presalesPhases = [
    { value: 'P0', label: 'P0 - Opportunity Identified' },
    { value: 'P1', label: 'P1 - Opportunity Defined & Qualified' },
    { value: 'P2', label: 'P2 - RFI/ RFP Responded, Proposal Submitted' },
    { value: 'P3', label: 'P3 - Technically Shortlisted & Upside' },
    { value: 'P3.1', label: 'P3.1 - Technically Shortlisted & Strong Upside' },
    { value: 'P4', label: 'P4 - Commit/ Verbal Confirmation/ LoI' }
  ];
  const { toast } = useToast();
  const { planningData } = usePlanning();

  // Load all data from database
  useEffect(() => {
    loadAllData();
  }, []);

  const loadLicenses = async () => {
    try {
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading licenses:', error);
        return;
      }

      setLicenses(data || []);
    } catch (error) {
      console.error('Error loading licenses:', error);
    }
  };

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading projects:', error);
        return;
      }

      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load projects with related data
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('name');

      if (projectsError) {
        console.error('Error loading projects:', projectsError);
      } else {
        // Load project licenses for each project
        const projectsWithLicenses = await Promise.all(
          (projectsData || []).map(async (project) => {
            const { data: licensesData, error: licensesError } = await supabase
              .from('project_licenses')
              .select('id, license_id, percentage')
              .eq('project_id', project.id);

            if (licensesError) {
              console.error('Error loading project licenses for project', project.id, ':', licensesError);
            }

            // Get license names separately
            const projectLicenses = await Promise.all(
              (licensesData || []).map(async (pl) => {
                const { data: licenseData } = await supabase
                  .from('licenses')
                  .select('name')
                  .eq('id', pl.license_id)
                  .single();

                return {
                  id: pl.id,
                  project_id: project.id,
                  license_id: pl.license_id,
                  percentage: pl.percentage,
                  license_name: licenseData?.name || 'Neznámá licence'
                };
              })
            );

            return {
              ...project,
              project_licenses: projectLicenses
            };
          })
        );

        setProjects(projectsWithLicenses);
      }

      // Load customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (customersError) {
        console.error('Error loading customers:', customersError);
      } else {
        setCustomers(customersData || []);
      }

      // Load project managers
      const { data: pmData, error: pmError } = await supabase
        .from('project_managers')
        .select('*')
        .order('name');

      if (pmError) {
        console.error('Error loading project managers:', pmError);
      } else {
        setProjectManagers(pmData || []);
      }

      // Load programs
      const { data: programsData, error: programsError } = await supabase
        .from('programs')
        .select('*')
        .order('name');

      if (programsError) {
        console.error('Error loading programs:', programsError);
      } else {
        setPrograms(programsData || []);
      }

      // Load licenses
      const { data: licensesData, error: licensesError } = await supabase
        .from('licenses')
        .select('*')
        .order('name');

      if (licensesError) {
        console.error('Error loading licenses:', licensesError);
      } else {
        setLicenses(licensesData || []);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading customers:', error);
        return;
      }

      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadProjectManagers = async () => {
    try {
      const { data, error } = await supabase
        .from('project_managers')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading project managers:', error);
        return;
      }

      setProjectManagers(data || []);
    } catch (error) {
      console.error('Error loading project managers:', error);
    }
  };

  const loadPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading programs:', error);
        return;
      }

      setPrograms(data || []);
    } catch (error) {
      console.error('Error loading programs:', error);
    }
  };

  // Helper functions to convert month format to date format
  const normalizeYearMonth = (value: string): string => {
    if (!value) return '';
    
    // Handle different input formats
    let normalizedValue = value.trim();
    
    // If it's already in YYYY-MM format
    if (/^\d{4}-\d{2}/.test(normalizedValue)) {
      return normalizedValue.slice(0, 7);
    }
    
    // If it's in MM/YYYY format (like "12/2025" or "122/2025")
    if (normalizedValue.includes('/')) {
      const parts = normalizedValue.split('/');
      if (parts.length === 2) {
        let month = parts[0].trim();
        const year = parts[1].trim();
        
        // Handle cases like "122" -> "12"
        if (month.length > 2) {
          month = month.slice(-2);
        }
        
        // Pad month with zero if needed
        month = month.padStart(2, '0');
        
        if (year.length === 4 && month.length === 2) {
          return `${year}-${month}`;
        }
      }
    }
    
    // Default: assume it's already in correct format or slice to YYYY-MM
    return normalizedValue.slice(0, 7);
  };

  const monthToStartDate = (value: string): string => {
    const ym = normalizeYearMonth(value);
    if (!ym || !ym.match(/^\d{4}-\d{2}$/)) return '';
    return `${ym}-01`;
  };

  const monthToEndDate = (value: string): string => {
    const ym = normalizeYearMonth(value);
    if (!ym || !ym.match(/^\d{4}-\d{2}$/)) return '';
    const [year, month] = ym.split('-');
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    return `${ym}-${lastDay.toString().padStart(2, '0')}`;
  };
  const handleSubmit = async () => {
    if (!formData.name || !formData.code || !formData.customerId || !formData.programId) {
      toast({
        title: "Chyba",
        description: "Všechna povinná pole musí být vyplněna.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use first available project manager as default if not set
      const defaultPmId = formData.projectManagerId || projectManagers[0]?.id;
      
      if (!defaultPmId) {
        toast({
          title: "Chyba",
          description: "Není dostupný žádný project manager.",
          variant: "destructive",
        });
        return;
      }

      if (editingProject) {
        // Update existing project
        const { error } = await supabase
          .from('projects')
          .update({
            name: formData.name,
            code: formData.code,
            customer_id: formData.customerId,
            project_manager_id: defaultPmId,
            program_id: formData.programId,
            project_type: formData.projectType,
            budget: formData.budget || null,
            average_hourly_rate: formData.averageHourlyRate || null,
            project_status: formData.projectStatus,
            probability: formData.projectStatus === 'Pre sales' ? formData.probability : null,
            presales_phase: formData.projectStatus === 'Pre sales' ? formData.presalesPhase : null,
            presales_start_date: formData.projectStatus === 'Pre sales' && formData.presalesStartDate ? monthToStartDate(formData.presalesStartDate) : null,
            presales_end_date: formData.projectStatus === 'Pre sales' && formData.presalesEndDate ? monthToEndDate(formData.presalesEndDate) : null,
            parent_opportunity: formData.parentOpportunity || null,
            updated_by: (await supabase.auth.getUser()).data.user?.id
          })
          .eq('id', editingProject.id);

        if (error) {
          console.error('Error updating project:', error);
          toast({
            title: "Chyba",
            description: `Nepodařilo se upravit projekt: ${error.message}`,
            variant: "destructive",
          });
          return;
        }

        // Handle project licenses
        await saveProjectLicenses(editingProject.id);

        toast({
          title: "Projekt upraven",
          description: "Údaje projektu byly úspěšně aktualizovány.",
        });
      } else {
        // Create new project
        const { data: newProject, error } = await supabase
          .from('projects')
          .insert({
            name: formData.name,
            code: formData.code,
            customer_id: formData.customerId,
            project_manager_id: defaultPmId,
            program_id: formData.programId,
            project_type: formData.projectType,
            budget: formData.budget || null,
            average_hourly_rate: formData.averageHourlyRate || null,
            project_status: formData.projectStatus,
            probability: formData.projectStatus === 'Pre sales' ? formData.probability : null,
            presales_phase: formData.projectStatus === 'Pre sales' ? formData.presalesPhase : null,
            presales_start_date: formData.projectStatus === 'Pre sales' && formData.presalesStartDate ? monthToStartDate(formData.presalesStartDate) : null,
            presales_end_date: formData.projectStatus === 'Pre sales' && formData.presalesEndDate ? monthToEndDate(formData.presalesEndDate) : null,
            parent_opportunity: formData.parentOpportunity || null,
            status: 'active',
            created_by: (await supabase.auth.getUser()).data.user?.id
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating project:', error);
          toast({
            title: "Chyba",
            description: "Nepodařilo se přidat projekt.",
            variant: "destructive",
          });
          return;
        }

        // Handle project licenses
        if (newProject) {
          await saveProjectLicenses(newProject.id);
        }

        toast({
          title: "Projekt přidán",
          description: "Nový projekt byl úspěšně přidán.",
        });
      }

      // Reload data and reset form
      await loadAllData();
      resetForm();
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se uložit projekt.",
        variant: "destructive",
      });
    }
  };

  const saveProjectLicenses = async (projectId: string) => {
    try {
      // Delete existing project licenses
      await supabase
        .from('project_licenses')
        .delete()
        .eq('project_id', projectId);

      // Insert new project licenses
      if (formData.assignedLicenses.length > 0) {
        const { error } = await supabase
          .from('project_licenses')
          .insert(
            formData.assignedLicenses.map(license => ({
              project_id: projectId,
              license_id: license.license_id,
              percentage: license.percentage
            }))
          );

        if (error) {
          console.error('Error saving project licenses:', error);
        }
      }
    } catch (error) {
      console.error('Error saving project licenses:', error);
    }
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
      probability: 0,
      presalesPhase: 'P0',
      presalesStartDate: '',
      presalesEndDate: '',
      parentOpportunity: '',
      crmCreationDate: '',
      opportunityNumber: ''
    });
    setIsAddDialogOpen(false);
    setEditingProject(null);
  };

  const addCustomer = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          name: customerFormData.name,
          code: customerFormData.code
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding customer:', error);
        toast({
          title: "Chyba",
          description: "Nepodařilo se přidat zákazníka.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Zákazník přidán",
        description: "Nový zákazník byl úspěšně přidán.",
      });

      // Reload customers and reset form
      await loadCustomers();
      resetCustomerForm();
    } catch (error) {
      console.error('Error adding customer:', error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se přidat zákazníka.",
        variant: "destructive",
      });
    }
  };

  const resetCustomerForm = () => {
    setCustomerFormData({
      name: '',
      code: ''
    });
    setIsAddCustomerDialogOpen(false);
  };

  const addLicenseToProject = () => {
    setFormData({
      ...formData,
      assignedLicenses: [...formData.assignedLicenses, { license_id: '', percentage: 0 }]
    });
  };

  const removeLicenseFromProject = (index: number) => {
    setFormData({
      ...formData,
      assignedLicenses: formData.assignedLicenses.filter((_, i) => i !== index)
    });
  };

  const updateProjectLicense = (index: number, field: 'license_id' | 'percentage', value: string | number) => {
    const updated = formData.assignedLicenses.map((license, i) => 
      i === index ? { ...license, [field]: value } : license
    );
    setFormData({ ...formData, assignedLicenses: updated });
  };

  const handleEdit = async (project: DatabaseProject) => {
    try {
      // Load project licenses
      const { data: projectLicenses, error } = await supabase
        .from('project_licenses')
        .select('*')
        .eq('project_id', project.id);

      if (error) {
        console.error('Error loading project licenses:', error);
      }

      setEditingProject(project);
      setFormData({
        name: project.name,
        code: project.code,
        customerId: project.customer_id,
        projectManagerId: project.project_manager_id,
        programId: project.program_id,
        projectType: project.project_type as 'WP' | 'Hodinovka',
        budget: project.budget || 0,
        averageHourlyRate: project.average_hourly_rate || 0,
        assignedLicenses: projectLicenses?.map(pl => ({
          license_id: pl.license_id,
          percentage: pl.percentage
        })) || [],
        projectStatus: (project.project_status as 'Pre sales' | 'Realizace') || 'Realizace',
        probability: project.probability || 0,
        presalesPhase: (project as any).presales_phase || 'P0',
        presalesStartDate: (project as any).presales_start_date ? normalizeYearMonth((project as any).presales_start_date) : '',
        presalesEndDate: (project as any).presales_end_date ? normalizeYearMonth((project as any).presales_end_date) : '',
        parentOpportunity: (project as any).parent_opportunity || '',
        crmCreationDate: (project as any).crm_creation_date || '',
        opportunityNumber: (project as any).opportunity_number || ''
      });
      setIsAddDialogOpen(true);
    } catch (error) {
      console.error('Error loading project for edit:', error);
    }
  };

  // Získej všechny projekty s informací o jejich použití
  const allProjects = useMemo(() => {
    return projects.map(project => {
      const customer = customers.find(c => c.id === project.customer_id);
      const pm = projectManagers.find(p => p.id === project.project_manager_id);
      const program = programs.find(p => p.id === project.program_id);
      const usage = planningData.filter(entry => entry.projekt === project.code).length;
      
      return {
        code: project.code,
        project,
        customer,
        pm,
        program,
        usage
      };
    }).sort((a, b) => b.usage - a.usage);
  }, [projects, customers, projectManagers, programs, planningData]);

  const getProjectBadge = (code: string) => {
    if (!code || code === 'FREE') return <Badge variant="secondary">Volný</Badge>;
    if (code === 'DOVOLENÁ') return <Badge variant="outline" className="border-accent">Dovolená</Badge>;
    if (code === 'NEMOC') return <Badge variant="outline" className="border-destructive text-destructive">Nemoc</Badge>;
    if (code === 'OVER') return <Badge variant="outline" className="border-warning text-warning">Over</Badge>;
    
    const projectData = projects.find(p => p.code === code);
    const customer = customers.find(c => c.id === projectData?.customer_id);
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-6 shadow-card-custom">
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Načítání projektů...</div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="projekty" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="projekty" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Správa projektů
          </TabsTrigger>
          <TabsTrigger value="organizace" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Organizační struktura
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="projekty" className="space-y-6">
          <Card className="p-6 shadow-card-custom">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Správa projektů</h2>
                <Badge variant="outline">{allProjects.length} projektů</Badge>
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
                    <Label htmlFor="name">Opportunity Description *</Label>
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
                    <Label htmlFor="parentOpportunity">Parent Opportunity</Label>
                    <Input
                      id="parentOpportunity"
                      type="text"
                      list="parent-opportunities"
                      value={formData.parentOpportunity}
                      onChange={(e) => setFormData({ ...formData, parentOpportunity: e.target.value })}
                      placeholder="Vyberte nebo zadejte číslo"
                    />
                    <datalist id="parent-opportunities">
                      <option value="451363" />
                      <option value="372699" />
                    </datalist>
                  </div>
                  <div>
                    <Label htmlFor="crmCreationDate">CRM Creation Date</Label>
                    <Input
                      id="crmCreationDate"
                      type="date"
                      value={formData.crmCreationDate}
                      onChange={(e) => setFormData({ ...formData, crmCreationDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="opportunityNumber">Opport. Number</Label>
                    <Input
                      id="opportunityNumber"
                      type="number"
                      value={formData.opportunityNumber}
                      onChange={(e) => setFormData({ ...formData, opportunityNumber: e.target.value })}
                      placeholder="Zadejte číslo"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="customer">Account name *</Label>
                      <Button type="button" variant="outline" size="sm" className="h-6 px-2" onClick={() => setIsAddCustomerDialogOpen(true)}>
                        <Plus className="h-3 w-3 mr-1" />
                        Nový
                      </Button>
                    </div>
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
                    <Label htmlFor="program">IBU *</Label>
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
                </div>
                
                {/* Presales specific fields */}
                {formData.projectStatus === 'Pre sales' && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <h3 className="font-medium text-sm">Presales detaily</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="presalesPhase">Presales fáze</Label>
                        <Select value={formData.presalesPhase} onValueChange={(value) => setFormData({ ...formData, presalesPhase: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {presalesPhases.map((phase) => (
                              <SelectItem key={phase.value} value={phase.value}>
                                {phase.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="presalesStartDate">Předpokládané období od</Label>
                          <Input
                            id="presalesStartDate"
                            type="month"
                            value={formData.presalesStartDate}
                            onChange={(e) => setFormData({ ...formData, presalesStartDate: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="presalesEndDate">Předpokládané období do</Label>
                          <Input
                            id="presalesEndDate"
                            type="month"
                            value={formData.presalesEndDate}
                            onChange={(e) => setFormData({ ...formData, presalesEndDate: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 gap-4">
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
                             value={projectLicense.license_id} 
                             onValueChange={(value) => updateProjectLicense(index, 'license_id', value)}
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
            {allProjects.map((item, index) => (
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
                   <Badge variant={item.project?.project_type === 'WP' ? 'default' : 'secondary'}>
                     {item.project?.project_type}
                   </Badge>
                 </TableCell>
                 <TableCell>
                   {item.project?.project_status && (
                     <div className="flex flex-col gap-1">
                       <Badge variant={item.project.project_status === 'Pre sales' ? 'outline' : 'default'}>
                         {item.project.project_status}
                       </Badge>
                       {item.project.project_status === 'Pre sales' && (
                         <div className="text-xs text-muted-foreground space-y-1">
                           {(item.project as any).presales_phase && (
                             <div>{(item.project as any).presales_phase}</div>
                           )}
                           {item.project.probability && (
                             <div>Pravděp.: {item.project.probability}%</div>
                           )}
                           {((item.project as any).presales_start_date || (item.project as any).presales_end_date) && (
                             <div>
                               {(item.project as any).presales_start_date && new Date((item.project as any).presales_start_date).toLocaleDateString('cs-CZ', { month: 'numeric', year: 'numeric' })} 
                               {(item.project as any).presales_start_date && (item.project as any).presales_end_date && ' - '}
                               {(item.project as any).presales_end_date && new Date((item.project as any).presales_end_date).toLocaleDateString('cs-CZ', { month: 'numeric', year: 'numeric' })}
                             </div>
                           )}
                         </div>
                       )}
                     </div>
                   )}
                 </TableCell>
                  <TableCell>
                    {/* Pro WP projekty: budget v hodinách NEBO průměrná hodinová sazba */}
                    {/* Pro Hodinovka projekty: budget jako hodinová sazba */}
                    {item.project && (
                      (item.project.project_type === 'WP' && (item.project.budget || item.project.average_hourly_rate)) ||
                      (item.project.project_type === 'Hodinovka' && item.project.budget)
                    ) ? (
                      <div className="flex flex-col gap-1">
                        <span>
                          {item.project.project_type === 'WP' ? (
                            item.project.budget 
                              ? `${item.project.budget} hod`
                              : `Ø ${item.project.average_hourly_rate?.toLocaleString('cs-CZ')} Kč/hod`
                          ) : (
                            `${item.project.budget?.toLocaleString('cs-CZ')} Kč/hod`
                          )}
                        </span>
                        {item.project.project_type === 'WP' && item.project.budget && item.project.average_hourly_rate && (
                          <span className="text-xs text-muted-foreground">
                            Ø {item.project.average_hourly_rate.toLocaleString('cs-CZ')} Kč/hod
                          </span>
                        )}
                      </div>
                    ) : 'N/A'}
                  </TableCell>
                 <TableCell>
                   {item.project?.project_licenses && item.project.project_licenses.length > 0 ? (
                     <div className="flex flex-col gap-1">
                       {item.project.project_licenses.map((license, idx) => (
                         <div key={idx} className="flex items-center gap-1 text-xs">
                           <Badge variant="outline" className="text-xs">
                             {license.license_name}
                           </Badge>
                           <span className="text-muted-foreground">
                             {license.percentage}%
                           </span>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <span className="text-sm text-muted-foreground">Bez licencí</span>
                   )}
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
            {allProjects.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  Zatím nejsou vytvořeny žádné projekty
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
          </Card>
        </TabsContent>
        
        <TabsContent value="organizace">
          <OrganizationalStructure />
        </TabsContent>
      </Tabs>

      {/* Dialog pro přidání zákazníka */}
      <Dialog open={isAddCustomerDialogOpen} onOpenChange={setIsAddCustomerDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Přidat zákazníka</DialogTitle>
            <DialogDescription>Formulář pro přidání nového zákazníka.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="customerName">Název zákazníka *</Label>
              <Input
                id="customerName"
                value={customerFormData.name}
                onChange={(e) => setCustomerFormData({ ...customerFormData, name: e.target.value })}
                placeholder="Název společnosti"
              />
            </div>
            <div>
              <Label htmlFor="customerCode">Kód zákazníka *</Label>
              <Input
                id="customerCode"
                value={customerFormData.code}
                onChange={(e) => setCustomerFormData({ ...customerFormData, code: e.target.value })}
                placeholder="ACRONYM"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={resetCustomerForm}>
                Zrušit
              </Button>
              <Button 
                onClick={addCustomer}
                disabled={!customerFormData.name || !customerFormData.code}
              >
                <Save className="h-4 w-4 mr-2" />
                Přidat zákazníka
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectManagement;
