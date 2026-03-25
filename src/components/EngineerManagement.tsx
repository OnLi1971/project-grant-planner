import { useState, useEffect } from 'react';
import { useEngineers } from '@/hooks/useEngineers';
import { useKnowledgeList, useEngineerKnowledge, SpecializationAssignment } from '@/hooks/useKnowledgeData';
import { KnowledgeMultiSelect } from '@/components/KnowledgeMultiSelect';
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
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

const LEVELS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

export function EngineerManagement() {
  const { engineers, isLoading, createEngineer, updateEngineer, deleteEngineer, refetch } = useEngineers();
  const swList = useKnowledgeList('knowledge_software');
  const pdmList = useKnowledgeList('knowledge_pdm_plm');
  const specList = useKnowledgeList('knowledge_specialization');
  const oblastList = useKnowledgeList('knowledge_oblast');

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
    currency: 'CZK' as 'EUR' | 'CZK',
    location: 'PRG' as 'PRG' | 'PLZ' | 'SK',
  });
  const [selectedSoftware, setSelectedSoftware] = useState<string[]>([]);
  const [selectedPdmPlm, setSelectedPdmPlm] = useState<string[]>([]);
  const [specRows, setSpecRows] = useState<SpecializationAssignment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { assignments, saveAssignments } = useEngineerKnowledge(editingEngineer?.id || null);

  useEffect(() => {
    if (editingEngineer && assignments) {
      setSelectedSoftware(assignments.software);
      setSelectedPdmPlm(assignments.pdmPlm);
      setSpecRows(assignments.specializations.length > 0 ? assignments.specializations : []);
    }
  }, [editingEngineer, assignments]);

  const resetForm = () => {
    setFormData({ displayName: '', status: 'active', company: 'TM CZ', hourlyRate: '', currency: 'CZK', location: 'PRG' });
    setSelectedSoftware([]);
    setSelectedPdmPlm([]);
    setSpecRows([]);
  };

  const addSpecRow = () => {
    setSpecRows(prev => [...prev, {
      oblast_id: oblastList.items[0]?.id || '',
      specialization_id: specList.items[0]?.id || '',
      level: 'A',
      granted_date: null,
    }]);
  };

  const updateSpecRow = (index: number, field: keyof SpecializationAssignment, value: string | null) => {
    setSpecRows(prev => prev.map((r, i) => {
      if (i !== index) return r;
      const updated = { ...r, [field]: value };
      // Reset specialization when oblast changes
      if (field === 'oblast_id') {
        const filtered = specList.items.filter(s => s.oblast_id === value);
        if (!filtered.find(s => s.id === r.specialization_id)) {
          updated.specialization_id = filtered[0]?.id || '';
        }
      }
      return updated;
    }));
  };

  const removeSpecRow = (index: number) => {
    setSpecRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!formData.displayName.trim()) {
      toast({ title: "Validation error", description: "Display name is required", variant: "destructive" });
      return;
    }
    if (formData.status === 'contractor' && (!formData.hourlyRate || parseFloat(formData.hourlyRate) <= 0)) {
      toast({ title: "Validation error", description: "Hourly rate is required for contractors", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const hourlyRate = formData.status === 'contractor' ? parseFloat(formData.hourlyRate) : undefined;
      const currency = formData.status === 'contractor' ? formData.currency : undefined;
      
      const result = await createEngineer(formData.displayName, undefined, formData.status, formData.company, hourlyRate, currency, formData.location);
      
      if (result && (selectedSoftware.length || selectedPdmPlm.length || specRows.length)) {
        await saveAssignments(result.id, selectedSoftware, selectedPdmPlm, specRows);
      }
      
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!editingEngineer) return;
    if (formData.status === 'contractor' && (!formData.hourlyRate || parseFloat(formData.hourlyRate) <= 0)) {
      toast({ title: "Validation error", description: "Hourly rate is required for contractors", variant: "destructive" });
      return;
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
        currency: currency,
        location: formData.location,
      } as any);

      await saveAssignments(editingEngineer.id, selectedSoftware, selectedPdmPlm, specRows);
      
      setIsEditDialogOpen(false);
      setEditingEngineer(null);
      resetForm();
    } catch (error) {
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
      currency: engineer.currency || 'CZK',
      location: engineer.location || 'PRG',
    });
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default", inactive: "secondary", contractor: "outline", on_leave: "destructive"
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const SpecializationEditor = () => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-semibold">Odborná specializace</Label>
        <Button type="button" variant="outline" size="sm" onClick={addSpecRow}>
          <Plus className="mr-1 h-3 w-3" />Přidat řádek
        </Button>
      </div>
      {specRows.length > 0 && (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Oblast</TableHead>
                <TableHead className="text-xs">Specializace</TableHead>
                <TableHead className="text-xs w-20">Úroveň</TableHead>
                <TableHead className="text-xs w-32">Datum udělení</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {specRows.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="p-1">
                    <Select value={row.oblast_id} onValueChange={v => updateSpecRow(idx, 'oblast_id', v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Oblast..." /></SelectTrigger>
                      <SelectContent>
                        {oblastList.items.map(o => (
                          <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-1">
                    <Select value={row.specialization_id} onValueChange={v => updateSpecRow(idx, 'specialization_id', v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Specializace..." /></SelectTrigger>
                      <SelectContent>
                        {specList.items.filter(s => s.oblast_id === row.oblast_id).map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-1">
                    <Select value={row.level} onValueChange={v => updateSpecRow(idx, 'level', v)}>
                      <SelectTrigger className="h-8 text-xs w-16"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      type="date"
                      className="h-8 text-xs"
                      value={row.granted_date || ''}
                      onChange={e => updateSpecRow(idx, 'granted_date', e.target.value || null)}
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeSpecRow(idx)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {specRows.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">Žádné specializace. Klikněte "Přidat řádek".</p>
      )}
    </div>
  );

  const KnowledgeFields = () => (
    <>
      <Separator className="my-2" />
      <h4 className="text-sm font-semibold text-muted-foreground">Správa znalostí</h4>
      <div>
        <Label>Software</Label>
        <KnowledgeMultiSelect items={swList.items} selectedIds={selectedSoftware} onChange={setSelectedSoftware} placeholder="Vyberte software..." isLoading={swList.isLoading} />
      </div>
      <div>
        <Label>PDM/PLM</Label>
        <KnowledgeMultiSelect items={pdmList.items} selectedIds={selectedPdmPlm} onChange={setSelectedPdmPlm} placeholder="Vyberte PDM/PLM..." isLoading={pdmList.isLoading} />
      </div>
      <SpecializationEditor />
    </>
  );

  if (isLoading) {
    return (
      <Card><CardContent className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></CardContent></Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Engineer Management</CardTitle>
          <CardDescription>Manage engineer records in the new centralized system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">{engineers.length} engineers currently active</p>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={(open) => { setIsCreateDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Add Engineer</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Engineer</DialogTitle>
                  <DialogDescription>Create a new engineer record. The system will automatically generate a unique slug.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="displayName">Display Name *</Label>
                    <Input id="displayName" value={formData.displayName} onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))} placeholder="e.g., Novák Jan" />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value, company: value === 'contractor' ? prev.company : 'TM CZ' }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="contractor">Contractor</SelectItem>
                        <SelectItem value="on_leave">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Select value={formData.location} onValueChange={(value: 'PRG' | 'PLZ' | 'SK') => setFormData(prev => ({ ...prev, location: value }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRG">PRG</SelectItem>
                        <SelectItem value="PLZ">PLZ</SelectItem>
                        <SelectItem value="SK">SK</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.status === 'contractor' && (
                    <>
                      <div>
                        <Label htmlFor="company">Company</Label>
                        <Select value={formData.company} onValueChange={(value) => setFormData(prev => ({ ...prev, company: value }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MB Idea">MB Idea</SelectItem>
                            <SelectItem value="AERTEC">AERTEC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="hourlyRate">Hourly Rate *</Label>
                          <Input id="hourlyRate" type="number" step="0.01" value={formData.hourlyRate} onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))} placeholder="0.00" />
                        </div>
                        <div>
                          <Label htmlFor="currency">Currency</Label>
                          <Select value={formData.currency} onValueChange={(value: 'EUR' | 'CZK') => setFormData(prev => ({ ...prev, currency: value }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CZK">CZK</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  )}
                  <KnowledgeFields />
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={isSubmitting}>
                      {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create Engineer'}
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
                  <TableHead>Location</TableHead>
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
                    <TableCell>{engineer.location || 'PRG'}</TableCell>
                    <TableCell>
                      {engineer.status === 'contractor' && engineer.hourlyRate 
                        ? `${engineer.hourlyRate} ${engineer.currency}` 
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(engineer)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setEngineerToDelete(engineer); setIsDeleteDialogOpen(true); }} className="text-destructive hover:text-destructive">
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
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (!open) { setEditingEngineer(null); resetForm(); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Engineer</DialogTitle>
            <DialogDescription>Update engineer information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editDisplayName">Display Name *</Label>
              <Input id="editDisplayName" value={formData.displayName} onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="editStatus">Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value, company: value === 'contractor' ? prev.company : 'TM CZ' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editLocation">Location</Label>
              <Select value={formData.location} onValueChange={(value: 'PRG' | 'PLZ' | 'SK') => setFormData(prev => ({ ...prev, location: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRG">PRG</SelectItem>
                  <SelectItem value="PLZ">PLZ</SelectItem>
                  <SelectItem value="SK">SK</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.status === 'contractor' && (
              <>
                <div>
                  <Label htmlFor="editCompany">Company</Label>
                  <Select value={formData.company} onValueChange={(value) => setFormData(prev => ({ ...prev, company: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MB Idea">MB Idea</SelectItem>
                      <SelectItem value="AERTEC">AERTEC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editHourlyRate">Hourly Rate *</Label>
                    <Input id="editHourlyRate" type="number" step="0.01" value={formData.hourlyRate} onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))} placeholder="0.00" />
                  </div>
                  <div>
                    <Label htmlFor="editCurrency">Currency</Label>
                    <Select value={formData.currency} onValueChange={(value: 'EUR' | 'CZK') => setFormData(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CZK">CZK</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
            <KnowledgeFields />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleEdit} disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Changes'}
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
