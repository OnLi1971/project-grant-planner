import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Users, Building, Search, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Employee {
  id: string;
  name: string;
  company: string;
  program: string;
  organizational_leader: string;
}

export const OrganizationalStructure = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLeader, setFilterLeader] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');
  const [filterProgram, setFilterProgram] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    company: '',
    program: '',
    organizational_leader: ''
  });

  // Available options for dropdowns
  const availableCompanies = ['TM CZ a.s.', 'MB idea SK, s.r.o.', 'Subdodavka'];
  const availableLeaders = ['JoMa', 'OnLi', 'KaSo', 'PaHo', 'PeMa', 'DaAm', 'PeNe', 'Dodavatel'];
  const availablePrograms = [
    'Steam Turbines',
    'Car Body & Bogies', 
    'Electro Design',
    'Interiors & Non-metallic Design',
    'General Machinery',
    'Stress Analysis',
    'IWE',
    'N/A'
  ];

  // Load employees from database
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading employees:', error);
        return;
      }

      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEmployee = async () => {
    if (!newEmployee.name || !newEmployee.company || !newEmployee.organizational_leader) {
      toast.error('Vyplňte prosím povinná pole: Jméno, Společnost a Organizační vedoucí');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([{
          name: newEmployee.name.trim(),
          company: newEmployee.company,
          program: newEmployee.program || null,
          organizational_leader: newEmployee.organizational_leader
        }])
        .select();

      if (error) {
        console.error('Error adding employee:', error);
        toast.error('Chyba při přidávání zaměstnance');
        return;
      }

      if (data && data.length > 0) {
        setEmployees(prev => [...prev, data[0]]);
        setNewEmployee({ name: '', company: '', program: '', organizational_leader: '' });
        setIsAddDialogOpen(false);
        toast.success('Zaměstnanec byl úspěšně přidán');
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error('Chyba při přidávání zaměstnance');
    }
  };

  // Generate unique values for filters from data
  const organizationalLeaders = Array.from(new Set(employees.map(e => e.organizational_leader))).sort();
  const companies = Array.from(new Set(employees.map(e => e.company))).sort();
  const programs = Array.from(new Set(employees.map(e => e.program).filter(p => p && p !== 'N/A'))).sort();

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLeader = filterLeader === 'all' || employee.organizational_leader === filterLeader;
    const matchesCompany = filterCompany === 'all' || employee.company === filterCompany;
    const matchesProgram = filterProgram === 'all' || employee.program === filterProgram;
    
    return matchesSearch && matchesLeader && matchesCompany && matchesProgram;
  });

  const getLeaderBadgeColor = (leader: string) => {
    const colors: { [key: string]: string } = {
      'JoMa': 'bg-blue-500',
      'OnLi': 'bg-green-500',
      'KaSo': 'bg-purple-500',
      'PaHo': 'bg-orange-500',
      'PeMa': 'bg-red-500',
      'DaAm': 'bg-yellow-500',
      'PeNe': 'bg-pink-500',
      'Dodavatel': 'bg-gray-500'
    };
    return colors[leader] || 'bg-gray-500';
  };

  const getCompanyBadge = (company: string) => {
    if (company === 'TM CZ a.s.') {
      return <Badge variant="default" className="bg-primary text-primary-foreground">TM CZ</Badge>;
    }
    if (company === 'Subdodavka') {
      return <Badge variant="secondary" className="bg-orange-500 text-white">Subdodavka</Badge>;
    }
    return <Badge variant="outline" className="border-accent text-accent-foreground">MB idea SK</Badge>;
  };

  const getProgramBadge = (program: string) => {
    if (program === 'N/A' || !program) {
      return <Badge variant="secondary">N/A</Badge>;
    }
    
    const shortPrograms: { [key: string]: string } = {
      'Steam Turbines': 'ST',
      'Car Body & Bogies': 'CBB',
      'Electro Design': 'ED',
      'Interiors & Non-metallic Design': 'IND',
      'General Machinery': 'GM',
      'Stress Analysis': 'SA',
      'IWE': 'IWE'
    };
    
    return <Badge variant="outline">{shortPrograms[program] || program}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-6 shadow-card-custom">
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Načítání zaměstnanců...</div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 shadow-card-custom">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Organizační struktura</h2>
            <Badge variant="outline">{filteredEmployees.length} z {employees.length} zaměstnanců</Badge>
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Přidat zaměstnance
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Přidat nového zaměstnance</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Jméno *</Label>
                  <Input
                    id="name"
                    placeholder="Jméno zaměstnance"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company">Společnost *</Label>
                  <Select value={newEmployee.company} onValueChange={(value) => setNewEmployee(prev => ({ ...prev, company: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte společnost" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCompanies.map(company => (
                        <SelectItem key={company} value={company}>{company}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="program">Program</Label>
                  <Select value={newEmployee.program} onValueChange={(value) => setNewEmployee(prev => ({ ...prev, program: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte program" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePrograms.map(program => (
                        <SelectItem key={program} value={program}>{program}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="leader">Organizační vedoucí *</Label>
                  <Select value={newEmployee.organizational_leader} onValueChange={(value) => setNewEmployee(prev => ({ ...prev, organizational_leader: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte organizačního vedoucího" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLeaders.map(leader => (
                        <SelectItem key={leader} value={leader}>{leader}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Zrušit
                  </Button>
                  <Button onClick={addEmployee}>
                    Přidat zaměstnance
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Hledat zaměstnance..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={filterLeader} onValueChange={setFilterLeader}>
            <SelectTrigger>
              <SelectValue placeholder="Všichni vedoucí" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všichni vedoucí</SelectItem>
              {organizationalLeaders.map(leader => (
                <SelectItem key={leader} value={leader}>{leader}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterCompany} onValueChange={setFilterCompany}>
            <SelectTrigger>
              <SelectValue placeholder="Všechny společnosti" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všechny společnosti</SelectItem>
              {companies.map(company => (
                <SelectItem key={company} value={company}>{company}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterProgram} onValueChange={setFilterProgram}>
            <SelectTrigger>
              <SelectValue placeholder="Všechny programy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všechny programy</SelectItem>
              {programs.map(program => (
                <SelectItem key={program} value={program}>{program}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jméno</TableHead>
                <TableHead>Společnost</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Organizační vedoucí</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee, index) => (
                <TableRow key={employee.id} className={index % 2 === 1 ? 'bg-muted/30' : 'bg-background'}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{getCompanyBadge(employee.company)}</TableCell>
                  <TableCell>{getProgramBadge(employee.program)}</TableCell>
                  <TableCell>
                    <Badge 
                      className={`${getLeaderBadgeColor(employee.organizational_leader)} text-white border-none`}
                    >
                      {employee.organizational_leader}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filteredEmployees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Žádní zaměstnanci nevyhovují zadaným filtrům
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">TM CZ a.s.</p>
                <p className="text-xl font-bold text-primary">
                  {employees.filter(e => e.company === 'TM CZ a.s.').length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">MB idea SK</p>
                <p className="text-xl font-bold text-accent">
                  {employees.filter(e => e.company === 'MB idea SK, s.r.o.').length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Subdodavka</p>
                <p className="text-xl font-bold text-orange-500">
                  {employees.filter(e => e.company === 'Subdodavka').length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Vedoucí</p>
                <p className="text-xl font-bold text-secondary">
                  {organizationalLeaders.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Programy</p>
                <p className="text-xl font-bold text-muted-foreground">
                  {programs.length}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
};