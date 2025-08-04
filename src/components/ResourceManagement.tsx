import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Users } from 'lucide-react';

interface Engineer {
  id: string;
  name: string;
  email: string;
  skills: string[];
  department: string;
  hourlyRate: number;
  status: 'active' | 'inactive';
}

export const ResourceManagement = () => {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEngineer, setEditingEngineer] = useState<Engineer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    skills: '',
    department: '',
    hourlyRate: 0,
    status: 'active' as 'active' | 'inactive'
  });
  const { toast } = useToast();

  // Load engineers from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('engineers-data');
    if (saved) {
      setEngineers(JSON.parse(saved));
    } else {
      // Default engineers
      const defaultEngineers: Engineer[] = [
        {
          id: '1',
          name: 'Jan Novák',
          email: 'jan.novak@company.com',
          skills: ['AutoCAD', 'SolidWorks', 'Inventor'],
          department: 'Konstrukce',
          hourlyRate: 850,
          status: 'active'
        },
        {
          id: '2',
          name: 'Marie Svobodová',
          email: 'marie.svobodova@company.com',
          skills: ['Creo', 'CATIA', 'FEM'],
          department: 'Konstrukce',
          hourlyRate: 920,
          status: 'active'
        }
      ];
      setEngineers(defaultEngineers);
      localStorage.setItem('engineers-data', JSON.stringify(defaultEngineers));
    }
  }, []);

  const saveEngineers = (updatedEngineers: Engineer[]) => {
    setEngineers(updatedEngineers);
    localStorage.setItem('engineers-data', JSON.stringify(updatedEngineers));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.email) {
      toast({
        title: "Chyba",
        description: "Jméno a email jsou povinné.",
        variant: "destructive",
      });
      return;
    }

    const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);
    
    if (editingEngineer) {
      const updatedEngineers = engineers.map(eng => 
        eng.id === editingEngineer.id 
          ? { ...eng, ...formData, skills: skillsArray }
          : eng
      );
      saveEngineers(updatedEngineers);
      toast({
        title: "Konstruktér upraven",
        description: "Údaje konstruktéra byly úspěšně aktualizovány.",
      });
    } else {
      const newEngineer: Engineer = {
        id: Date.now().toString(),
        ...formData,
        skills: skillsArray
      };
      saveEngineers([...engineers, newEngineer]);
      toast({
        title: "Konstruktér přidán",
        description: "Nový konstruktér byl úspěšně přidán.",
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      skills: '',
      department: '',
      hourlyRate: 0,
      status: 'active'
    });
    setIsAddDialogOpen(false);
    setEditingEngineer(null);
  };

  const handleEdit = (engineer: Engineer) => {
    setEditingEngineer(engineer);
    setFormData({
      name: engineer.name,
      email: engineer.email,
      skills: engineer.skills.join(', '),
      department: engineer.department,
      hourlyRate: engineer.hourlyRate,
      status: engineer.status
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const updatedEngineers = engineers.filter(eng => eng.id !== id);
    saveEngineers(updatedEngineers);
    toast({
      title: "Konstruktér smazán",
      description: "Konstruktér byl úspěšně odstraněn.",
    });
  };

  return (
    <Card className="p-6 shadow-card-custom">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Správa zdrojů</h2>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Přidat konstruktéra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEngineer ? 'Upravit konstruktéra' : 'Přidat konstruktéra'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Jméno *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jan Novák"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jan.novak@company.com"
                />
              </div>
              <div>
                <Label htmlFor="skills">Dovednosti (oddělené čárkou)</Label>
                <Input
                  id="skills"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="AutoCAD, SolidWorks, Inventor"
                />
              </div>
              <div>
                <Label htmlFor="department">Oddělení</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Konstrukce"
                />
              </div>
              <div>
                <Label htmlFor="hourlyRate">Hodinová sazba (Kč)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  value={formData.hourlyRate || ''}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: parseInt(e.target.value) || 0 })}
                  placeholder="850"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} className="flex-1">
                  {editingEngineer ? 'Upravit' : 'Přidat'}
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
            <TableHead>Jméno</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Dovednosti</TableHead>
            <TableHead>Oddělení</TableHead>
            <TableHead>Hodinová sazba</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Akce</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {engineers.map((engineer, index) => (
            <TableRow key={engineer.id} className={index % 2 === 1 ? 'bg-muted/30' : 'bg-background'}>
              <TableCell className="font-medium">{engineer.name}</TableCell>
              <TableCell>{engineer.email}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {engineer.skills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>{engineer.department}</TableCell>
              <TableCell>{engineer.hourlyRate} Kč</TableCell>
              <TableCell>
                <Badge variant={engineer.status === 'active' ? 'default' : 'secondary'}>
                  {engineer.status === 'active' ? 'Aktivní' : 'Neaktivní'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(engineer)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(engineer.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};