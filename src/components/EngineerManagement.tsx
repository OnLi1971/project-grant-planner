import { useState } from 'react';
import { useEngineers } from '@/hooks/useEngineers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Users, Edit, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function EngineerManagement() {
  const { engineers, isLoading, createEngineer, updateEngineer, deleteEngineer, refetch } = useEngineers();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingEngineer, setEditingEngineer] = useState<any>(null);
  const [engineerToDelete, setEngineerToDelete] = useState<any>(null);
  const [formData, setFormData] = useState({
    displayName: '',
    status: 'active' as 'active' | 'inactive' | 'contractor' | 'on_leave',
    company: 'TM CZ' as string,
    hourlyRate: '' as string,
    currency: 'CZK' as 'EUR' | 'CZK'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!formData.displayName.trim()) {
      toast({
        title: "Validation error",
        description: "Display name is required",
        variant: "destructive",
      });
      return;
    }

    // Validate contractor fields
    if (formData.status === 'contractor') {
      if (!formData.hourlyRate || parseFloat(formData.hourlyRate) <= 0) {
        toast({
          title: "Validation error",
          description: "Hourly rate is required for contractors",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const hourlyRate = formData.status === 'contractor' ? parseFloat(formData.hourlyRate) : undefined;
      const currency = formData.status === 'contractor' ? formData.currency : undefined;
      
      await createEngineer(
        formData.displayName, 
        undefined, // no email 
        formData.status, // status
        formData.company,
        hourlyRate,
        currency
      );
      setIsCreateDialogOpen(false);
      setFormData({ 
        displayName: '', 
        status: 'active', 
        company: 'TM CZ', 
        hourlyRate: '', 
        currency: 'CZK' 
      });
    } catch (error) {
      // Error already handled by the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editingEngineer) return;

    // Validate contractor fields
    if (formData.status === 'contractor') {
      if (!formData.hourlyRate || parseFloat(formData.hourlyRate) <= 0) {
        toast({
          title: "Validation error",
          description: "Hourly rate is required for contractors",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const hourlyRate = formData.status === 'contractor' ? parseFloat(formData.hourlyRate) : undefined;
      const currency = formData.status === 'contractor' ? formData.currency : undefined;
      
      await updateEngineer(editingEngineer.id, {
        display_name: formData.displayName,
        status: formData.status,
        fte_percent: 100,
        company: formData.company,
        hourly_rate: hourlyRate,
        currency: currency
      });
      setIsEditDialogOpen(false);
      setEditingEngineer(null);
      setFormData({ 
        displayName: '', 
        status: 'active', 
        company: 'TM CZ', 
        hourlyRate: '', 
        currency: 'CZK' 
      });
    } catch (error) {
      // Error already handled by the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (engineer: any) => {
    setEditingEngineer(engineer);
    setFormData({
      displayName: engineer.jmeno,
      status: engineer.status,
      company: engineer.spolecnost || 'TM CZ',
      hourlyRate: engineer.hourlyRate ? engineer.hourlyRate.toString() : '',
      currency: engineer.currency || 'CZK'
    });
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      inactive: "secondary",
      contractor: "outline",
      on_leave: "destructive"
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Engineer Management
          </CardTitle>
          <CardDescription>
            Manage engineer records in the new centralized system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              {engineers.length} engineers currently active
            </p>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Engineer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Engineer</DialogTitle>
                  <DialogDescription>
                    Create a new engineer record. The system will automatically generate a unique slug.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="displayName">Display Name *</Label>
                    <Input
                      id="displayName"
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      placeholder="e.g., Novák Jan"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ 
                      ...prev, 
                      status: value,
                      company: value === 'contractor' ? prev.company : 'TM CZ'
                    }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="contractor">Contractor</SelectItem>
                        <SelectItem value="on_leave">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.status === 'contractor' && (
                    <>
                      <div>
                        <Label htmlFor="company">Company</Label>
                        <Select value={formData.company} onValueChange={(value) => setFormData(prev => ({ ...prev, company: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MB Idea">MB Idea</SelectItem>
                            <SelectItem value="AERTEC">AERTEC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="hourlyRate">Hourly Rate *</Label>
                          <Input
                            id="hourlyRate"
                            type="number"
                            step="0.01"
                            value={formData.hourlyRate}
                            onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="currency">Currency</Label>
                          <Select value={formData.currency} onValueChange={(value: 'EUR' | 'CZK') => setFormData(prev => ({ ...prev, currency: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CZK">CZK</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Engineer'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {engineers.map((engineer) => (
                  <TableRow key={engineer.id}>
                    <TableCell className="font-medium">{engineer.jmeno}</TableCell>
                    <TableCell className="font-mono text-sm">{engineer.slug}</TableCell>
                    <TableCell>{engineer.spolecnost}</TableCell>
                    <TableCell>{getStatusBadge(engineer.status)}</TableCell>
                    <TableCell>
                      {engineer.status === 'contractor' && engineer.hourlyRate 
                        ? `${engineer.hourlyRate} ${engineer.currency}` 
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(engineer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEngineerToDelete(engineer);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Engineer</DialogTitle>
            <DialogDescription>
              Update engineer information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editDisplayName">Display Name *</Label>
              <Input
                id="editDisplayName"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="editStatus">Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ 
                ...prev, 
                status: value,
                company: value === 'contractor' ? prev.company : 'TM CZ'
              }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.status === 'contractor' && (
              <>
                <div>
                  <Label htmlFor="editCompany">Company</Label>
                  <Select value={formData.company} onValueChange={(value) => setFormData(prev => ({ ...prev, company: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MB Idea">MB Idea</SelectItem>
                      <SelectItem value="AERTEC">AERTEC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editHourlyRate">Hourly Rate *</Label>
                    <Input
                      id="editHourlyRate"
                      type="number"
                      step="0.01"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editCurrency">Currency</Label>
                    <Select value={formData.currency} onValueChange={(value: 'EUR' | 'CZK') => setFormData(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CZK">CZK</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat konstruktéra?</AlertDialogTitle>
            <AlertDialogDescription>
              Opravdu chcete smazat konstruktéra <strong>{engineerToDelete?.jmeno}</strong>?
              <br /><br />
              <span className="text-destructive">
                Pozor: Plánovací záznamy tohoto konstruktéra zůstanou v systému, ale nebudou přiřazeny žádnému konstruktérovi.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (engineerToDelete) {
                  setIsSubmitting(true);
                  try {
                    await deleteEngineer(engineerToDelete.id);
                    setIsDeleteDialogOpen(false);
                    setEngineerToDelete(null);
                  } catch (error) {
                    // Error handled by hook
                  } finally {
                    setIsSubmitting(false);
                  }
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Mazání...' : 'Smazat'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}