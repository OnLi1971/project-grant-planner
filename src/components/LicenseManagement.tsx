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
import { Plus, Edit, Trash2, Shield, Calendar, Loader2 } from 'lucide-react';
import { CurrentWeekLicenseUsage } from './CurrentWeekLicenseUsage';
import { LicenseUsageChart } from './LicenseUsageChart';
import { supabase } from '@/integrations/supabase/client';

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
  const [loading, setLoading] = useState(true);
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

  // Load licenses from database
  useEffect(() => {
    loadLicenses();
  }, []);

  const loadLicenses = async () => {
    try {
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .order('name');

      if (error) throw error;

      const mappedLicenses: License[] = (data || []).map(license => ({
        id: license.id,
        name: license.name,
        type: license.type as 'software' | 'certification' | 'training',
        provider: license.provider,
        totalSeats: license.total_seats,
        usedSeats: license.used_seats,
        expirationDate: license.expiration_date,
        cost: license.cost,
        status: calculateStatus(new Date(license.expiration_date))
      }));

      setLicenses(mappedLicenses);
    } catch (error) {
      console.error('Error loading licenses:', error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se načíst licence z databáze.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStatus = (expirationDate: Date): 'active' | 'expired' | 'expiring-soon' => {
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (daysUntilExpiry < 0) {
      return 'expired';
    } else if (daysUntilExpiry <= 30) {
      return 'expiring-soon';
    } else {
      return 'active';
    }
  };

  const saveLicense = async (licenseData: Omit<License, 'id' | 'status'>, isEdit: boolean = false, editId?: string) => {
    try {
      const status = calculateStatus(new Date(licenseData.expirationDate));
      
      if (isEdit && editId) {
        const { error } = await supabase
          .from('licenses')
          .update({
            name: licenseData.name,
            type: licenseData.type,
            provider: licenseData.provider,
            total_seats: licenseData.totalSeats,
            used_seats: licenseData.usedSeats,
            expiration_date: licenseData.expirationDate,
            cost: licenseData.cost,
            status: status
          })
          .eq('id', editId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('licenses')
          .insert({
            name: licenseData.name,
            type: licenseData.type,
            provider: licenseData.provider,
            total_seats: licenseData.totalSeats,
            used_seats: licenseData.usedSeats,
            expiration_date: licenseData.expirationDate,
            cost: licenseData.cost,
            status: status
          });

        if (error) throw error;
      }

      await loadLicenses();
      return true;
    } catch (error) {
      console.error('Error saving license:', error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se uložit licenci.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.provider || !formData.expirationDate) {
      toast({
        title: "Chyba",
        description: "Název, poskytovatel a datum vypršení jsou povinné.",
        variant: "destructive",
      });
      return;
    }

    const success = await saveLicense(formData, !!editingLicense, editingLicense?.id);
    
    if (success) {
      toast({
        title: editingLicense ? "Licence upravena" : "Licence přidána",
        description: editingLicense 
          ? "Údaje licence byly úspěšně aktualizovány." 
          : "Nová licence byla úspěšně přidána.",
      });
      resetForm();
    }
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

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('licenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadLicenses();
      toast({
        title: "Licence smazána",
        description: "Licence byla úspěšně odstraněna.",
      });
    } catch (error) {
      console.error('Error deleting license:', error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se smazat licenci.",
        variant: "destructive",
      });
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Načítám licence...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Week Usage */}
      <CurrentWeekLicenseUsage licenses={licenses} />
      
      {/* Future Usage Chart */}
      <LicenseUsageChart licenses={licenses} />
      
      {/* License Management Table */}
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
    </div>
  );
};