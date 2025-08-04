import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Shield, Calendar } from 'lucide-react';

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

export const LicenseManagement = () => {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'software' as 'software' | 'certification' | 'training',
    provider: '',
    totalSeats: 0,
    usedSeats: 0,
    expirationDate: '',
    cost: 0
  });
  const { toast } = useToast();

  // Load licenses from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('licenses-data');
    if (saved) {
      setLicenses(JSON.parse(saved));
    } else {
      // Default licenses
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
        },
        {
          id: '3',
          name: 'Certifikace ISO 9001',
          type: 'certification',
          provider: 'TÜV SÜD',
          totalSeats: 1,
          usedSeats: 1,
          expirationDate: '2025-03-20',
          cost: 80000,
          status: 'active'
        }
      ];
      setLicenses(defaultLicenses);
      localStorage.setItem('licenses-data', JSON.stringify(defaultLicenses));
    }
  }, []);

  const saveLicenses = (updatedLicenses: License[]) => {
    // Update status based on expiration date
    const today = new Date();
    const updated = updatedLicenses.map(license => {
      const expDate = new Date(license.expirationDate);
      const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      
      let status: 'active' | 'expired' | 'expiring-soon';
      if (daysUntilExpiry < 0) {
        status = 'expired';
      } else if (daysUntilExpiry <= 30) {
        status = 'expiring-soon';
      } else {
        status = 'active';
      }
      
      return { ...license, status };
    });
    
    setLicenses(updated);
    localStorage.setItem('licenses-data', JSON.stringify(updated));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.provider || !formData.expirationDate) {
      toast({
        title: "Chyba",
        description: "Název, poskytovatel a datum vypršení jsou povinné.",
        variant: "destructive",
      });
      return;
    }

    if (editingLicense) {
      const updatedLicenses = licenses.map(lic => 
        lic.id === editingLicense.id 
          ? { ...lic, ...formData, status: 'active' as const }
          : lic
      );
      saveLicenses(updatedLicenses);
      toast({
        title: "Licence upravena",
        description: "Údaje licence byly úspěšně aktualizovány.",
      });
    } else {
      const newLicense: License = {
        id: Date.now().toString(),
        ...formData,
        status: 'active'
      };
      saveLicenses([...licenses, newLicense]);
      toast({
        title: "Licence přidána",
        description: "Nová licence byla úspěšně přidána.",
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'software',
      provider: '',
      totalSeats: 0,
      usedSeats: 0,
      expirationDate: '',
      cost: 0
    });
    setIsAddDialogOpen(false);
    setEditingLicense(null);
  };

  const handleEdit = (license: License) => {
    setEditingLicense(license);
    setFormData({
      name: license.name,
      type: license.type,
      provider: license.provider,
      totalSeats: license.totalSeats,
      usedSeats: license.usedSeats,
      expirationDate: license.expirationDate,
      cost: license.cost
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const updatedLicenses = licenses.filter(lic => lic.id !== id);
    saveLicenses(updatedLicenses);
    toast({
      title: "Licence smazána",
      description: "Licence byla úspěšně odstraněna.",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Aktivní</Badge>;
      case 'expired':
        return <Badge variant="destructive">Vypršela</Badge>;
      case 'expiring-soon':
        return <Badge variant="secondary">Brzy vyprší</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'software':
        return <Badge variant="outline">Software</Badge>;
      case 'certification':
        return <Badge variant="outline">Certifikace</Badge>;
      case 'training':
        return <Badge variant="outline">Školení</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <Card className="p-6 shadow-card-custom">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Správa licencí</h2>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Přidat licenci
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingLicense ? 'Upravit licenci' : 'Přidat licenci'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Název *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="AutoCAD Professional"
                />
              </div>
              <div>
                <Label htmlFor="type">Typ *</Label>
                <Select value={formData.type} onValueChange={(value: 'software' | 'certification' | 'training') => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="certification">Certifikace</SelectItem>
                    <SelectItem value="training">Školení</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="provider">Poskytovatel *</Label>
                <Input
                  id="provider"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  placeholder="Autodesk"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="totalSeats">Celkem licencí</Label>
                  <Input
                    id="totalSeats"
                    type="number"
                    value={formData.totalSeats || ''}
                    onChange={(e) => setFormData({ ...formData, totalSeats: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="usedSeats">Použité licence</Label>
                  <Input
                    id="usedSeats"
                    type="number"
                    value={formData.usedSeats || ''}
                    onChange={(e) => setFormData({ ...formData, usedSeats: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="expirationDate">Datum vypršení *</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="cost">Roční náklady (Kč)</Label>
                <Input
                  id="cost"
                  type="number"
                  value={formData.cost || ''}
                  onChange={(e) => setFormData({ ...formData, cost: parseInt(e.target.value) || 0 })}
                  placeholder="150000"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} className="flex-1">
                  {editingLicense ? 'Upravit' : 'Přidat'}
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
            <TableHead>Typ</TableHead>
            <TableHead>Poskytovatel</TableHead>
            <TableHead>Licence</TableHead>
            <TableHead>Datum vypršení</TableHead>
            <TableHead>Roční náklady</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Akce</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {licenses.map((license, index) => (
            <TableRow key={license.id} className={index % 2 === 1 ? 'bg-muted/30' : 'bg-background'}>
              <TableCell className="font-medium">{license.name}</TableCell>
              <TableCell>{getTypeBadge(license.type)}</TableCell>
              <TableCell>{license.provider}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <span className={license.usedSeats >= license.totalSeats ? 'text-destructive font-medium' : ''}>
                    {license.usedSeats}
                  </span>
                  <span className="text-muted-foreground">/ {license.totalSeats}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  {new Date(license.expirationDate).toLocaleDateString('cs-CZ')}
                </div>
              </TableCell>
              <TableCell>{license.cost.toLocaleString('cs-CZ')} Kč</TableCell>
              <TableCell>{getStatusBadge(license.status)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(license)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(license.id)}
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