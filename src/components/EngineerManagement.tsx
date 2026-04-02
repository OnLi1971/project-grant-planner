import { useState, useEffect, useCallback, useMemo } from 'react';
import { useEngineers } from '@/hooks/useEngineers';
import { useKnowledgeList, useEngineerKnowledge, SpecializationAssignment, LanguageAssignment } from '@/hooks/useKnowledgeData';
import { useEngineerTraining, useTrainingSearch, TrainingRecord } from '@/hooks/useEngineerTraining';
import { TrainingImport } from '@/components/TrainingImport';
import { KnowledgeMultiSelect } from '@/components/KnowledgeMultiSelect';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Plus, Users, Edit, Loader2, Trash2, CalendarIcon, Search, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { format, parse, isValid, getYear } from 'date-fns';
import { cs } from 'date-fns/locale';
import { cn } from '@/lib/utils';

/** Convert ISO date string (yyyy-MM-dd) to dd.MM.yyyy for display */
function isoToDisplay(iso: string | null): string {
  if (!iso) return '';
  const d = parse(iso, 'yyyy-MM-dd', new Date());
  return isValid(d) ? format(d, 'dd.MM.yyyy') : iso;
}

/** Convert dd.MM.yyyy to ISO yyyy-MM-dd, returns null if empty/invalid */
function displayToIso(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const d = parse(trimmed, 'dd.MM.yyyy', new Date());
  if (!isValid(d)) return null;
  const y = getYear(d);
  if (y < 1900 || y > 2100) return null;
  return format(d, 'yyyy-MM-dd');
}

function validateSpecDates(rows: SpecializationAssignment[]): string | null {
  for (let i = 0; i < rows.length; i++) {
    const gd = rows[i].granted_date;
    if (!gd) continue;
    const d = parse(gd, 'yyyy-MM-dd', new Date());
    if (!isValid(d) || getYear(d) < 1900 || getYear(d) > 2100) {
      return `Řádek ${i + 1}: neplatné datum "${gd}". Použijte formát dd.MM.yyyy s rokem 1900–2100.`;
    }
  }
  return null;
}

const LEVELS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
const LANGUAGES = ['English', 'German', 'Russian'] as const;
const LANG_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

/** Inline date picker: text input (dd.MM.yyyy) + calendar popover */
function DatePickerCell({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const [text, setText] = useState(isoToDisplay(value));

  useEffect(() => {
    setText(isoToDisplay(value));
  }, [value]);

  const handleBlur = () => {
    if (!text.trim()) {
      onChange(null);
      return;
    }
    const iso = displayToIso(text);
    if (iso) {
      onChange(iso);
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      const iso = format(date, 'yyyy-MM-dd');
      onChange(iso);
      setText(format(date, 'dd.MM.yyyy'));
    }
  };

  const selectedDate = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;

  return (
    <div className="flex gap-1 items-center">
      <Input
        className="h-8 text-xs w-24"
        placeholder="dd.MM.yyyy"
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={handleBlur}
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <CalendarIcon className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={isValid(selectedDate) ? selectedDate : undefined}
            onSelect={handleCalendarSelect}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
            locale={cs}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function EngineerManagement() {
  const navigate = useNavigate();
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
    endDate: '' as string,
  });
  const [selectedSoftware, setSelectedSoftware] = useState<{ id: string; level: number }[]>([]);
  const [selectedPdmPlm, setSelectedPdmPlm] = useState<{ id: string; level: number }[]>([]);
  const [specRows, setSpecRows] = useState<SpecializationAssignment[]>([]);
  const [languageRows, setLanguageRows] = useState<(LanguageAssignment & { uid: string; test_year_str: string })[]>([]);
  const [trainingRows, setTrainingRows] = useState<Omit<TrainingRecord, 'engineer_id'>[]>([]);
  const [trainingSearchQuery, setTrainingSearchQuery] = useState('');
  const [trainingFilterIds, setTrainingFilterIds] = useState<string[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { assignments, saveAssignments } = useEngineerKnowledge(editingEngineer?.id || null);
  const { trainings, saveTrainings, bulkInsert } = useEngineerTraining(editingEngineer?.id || null);
  const searchTraining = useTrainingSearch();

  useEffect(() => {
    if (editingEngineer && assignments) {
      setSelectedSoftware(assignments.software);
      setSelectedPdmPlm(assignments.pdmPlm);
      setSpecRows(assignments.specializations.length > 0 ? assignments.specializations : []);
      setLanguageRows((assignments.languages || []).map(l => ({ ...l, uid: crypto.randomUUID(), test_year_str: l.test_year != null ? String(l.test_year) : '' })));
    }
  }, [editingEngineer, assignments]);

  useEffect(() => {
    if (editingEngineer && trainings) {
      setTrainingRows(trainings.map(t => ({
        id: t.id,
        name: t.name,
        date_from: t.date_from,
        date_to: t.date_to,
        company_trainer: t.company_trainer,
        has_exam: t.has_exam,
        notes: t.notes,
      })));
    }
  }, [editingEngineer, trainings]);

  const handleTrainingSearch = useCallback(async () => {
    const q = trainingSearchQuery.trim();
    if (!q) { setTrainingFilterIds(null); return; }
    setIsSearching(true);
    const ids = await searchTraining(q);
    setTrainingFilterIds(ids);
    setIsSearching(false);
  }, [trainingSearchQuery, searchTraining]);

  const resetForm = () => {
    setFormData({ displayName: '', status: 'active', company: 'TM CZ', hourlyRate: '', currency: 'CZK', location: 'PRG', endDate: '' });
    setSelectedSoftware([]);
    setSelectedPdmPlm([]);
    setSpecRows([]);
    setLanguageRows([]);
    setTrainingRows([]);
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
      const endDateIso = formData.endDate ? displayToIso(formData.endDate) : undefined;
      
      const result = await createEngineer(formData.displayName, undefined, formData.status, formData.company, hourlyRate, currency, formData.location, undefined, undefined, undefined, endDateIso || undefined);
      
      if (result && (selectedSoftware.length || selectedPdmPlm.length || specRows.length || languageRows.length)) {
        const langToSave = languageRows.map(({ language, level, test_year_str }) => ({ language, level, test_year: test_year_str ? parseInt(test_year_str) || null : null }));
        await saveAssignments(result.id, selectedSoftware, selectedPdmPlm, specRows, langToSave);
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
    const dateErr = validateSpecDates(specRows);
    if (dateErr) {
      toast({ title: "Chyba v datu", description: dateErr, variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const hourlyRate = formData.status === 'contractor' ? parseFloat(formData.hourlyRate) : undefined;
      const currency = formData.status === 'contractor' ? formData.currency : undefined;
      const endDateIso = formData.endDate ? displayToIso(formData.endDate) : null;
      
      await updateEngineer(editingEngineer.id, {
        display_name: formData.displayName,
        status: formData.status,
        fte_percent: 100,
        company: formData.company,
        hourly_rate: hourlyRate,
        currency: currency,
        location: formData.location,
        end_date: endDateIso,
      } as any);

      const langToSave = languageRows.map(({ language, level, test_year_str }) => ({ language, level, test_year: test_year_str ? parseInt(test_year_str) || null : null }));
      await saveAssignments(editingEngineer.id, selectedSoftware, selectedPdmPlm, specRows, langToSave);
      await saveTrainings(editingEngineer.id, trainingRows);
      
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
      endDate: engineer.endDate ? isoToDisplay(engineer.endDate) : '',
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
                    <DatePickerCell
                      value={row.granted_date}
                      onChange={(v) => updateSpecRow(idx, 'granted_date', v)}
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

  const languageEditorJsx = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Jazyky</Label>
        <Button type="button" variant="outline" size="sm" onClick={() => setLanguageRows(prev => [...prev, { uid: crypto.randomUUID(), language: 'English', level: 'A1', test_year: null, test_year_str: '' }])}>
          <Plus className="h-3 w-3 mr-1" />Přidat
        </Button>
      </div>
      {languageRows.map((row) => (
        <div key={row.uid} className="flex items-center gap-2">
          <Select value={row.language} onValueChange={v => setLanguageRows(prev => prev.map(r => r.uid === row.uid ? { ...r, language: v } : r))}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>{LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={row.level} onValueChange={v => setLanguageRows(prev => prev.map(r => r.uid === row.uid ? { ...r, level: v } : r))}>
            <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
            <SelectContent>{LANG_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
          </Select>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="Rok"
            className="w-[90px]"
            value={row.test_year_str}
            onChange={e => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 4);
              setLanguageRows(prev => prev.map(r => r.uid === row.uid ? { ...r, test_year_str: v } : r));
            }}
          />
          <Button type="button" variant="ghost" size="sm" onClick={() => setLanguageRows(prev => prev.filter(r => r.uid !== row.uid))}>
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        </div>
      ))}
    </div>
  );

  const knowledgeFieldsJsx = (
    <>
      <Separator className="my-2" />
      {languageEditorJsx}
      <Separator className="my-2" />
      <h4 className="text-sm font-semibold text-muted-foreground">Správa znalostí</h4>
      <div>
        <Label>Software</Label>
        <KnowledgeMultiSelect items={swList.items} selectedItems={selectedSoftware} onChange={setSelectedSoftware} placeholder="Vyberte software..." isLoading={swList.isLoading} showLevels />
      </div>
      <div>
        <Label>PDM/PLM</Label>
        <KnowledgeMultiSelect items={pdmList.items} selectedItems={selectedPdmPlm} onChange={setSelectedPdmPlm} placeholder="Vyberte PDM/PLM..." isLoading={pdmList.isLoading} showLevels />
      </div>
      <SpecializationEditor />
      <Separator className="my-2" />
      <TrainingEditor />
    </>
  );

  function TrainingEditor() {
    const addTrainingRow = () => {
      setTrainingRows(prev => [...prev, { name: '', date_from: null, date_to: null, company_trainer: null, has_exam: false, notes: null }]);
    };
    const updateTrainingRow = (idx: number, field: string, value: any) => {
      setTrainingRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
    };
    const removeTrainingRow = (idx: number) => {
      setTrainingRows(prev => prev.filter((_, i) => i !== idx));
    };

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-semibold">Trénink / Školení</Label>
          <div className="flex gap-2">
            {editingEngineer && (
              <TrainingImport
                engineerId={editingEngineer.id}
                onImport={async (records) => {
                  await bulkInsert(editingEngineer.id, records);
                  setTrainingRows(prev => [...prev, ...records]);
                }}
              />
            )}
            <Button type="button" variant="outline" size="sm" onClick={addTrainingRow}>
              <Plus className="mr-1 h-3 w-3" />Přidat řádek
            </Button>
          </div>
        </div>
        {trainingRows.length > 0 && (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Název školení</TableHead>
                  <TableHead className="text-xs w-32">Od</TableHead>
                  <TableHead className="text-xs w-32">Do</TableHead>
                  <TableHead className="text-xs">Firma/Školitel</TableHead>
                  <TableHead className="text-xs w-16">Zkouška</TableHead>
                  <TableHead className="text-xs">Poznámka</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainingRows.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="p-1">
                      <Input className="h-8 text-xs" value={row.name} onChange={e => updateTrainingRow(idx, 'name', e.target.value)} placeholder="Název..." />
                    </TableCell>
                    <TableCell className="p-1">
                      <DatePickerCell value={row.date_from} onChange={v => updateTrainingRow(idx, 'date_from', v)} />
                    </TableCell>
                    <TableCell className="p-1">
                      <DatePickerCell value={row.date_to} onChange={v => updateTrainingRow(idx, 'date_to', v)} />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input className="h-8 text-xs" value={row.company_trainer || ''} onChange={e => updateTrainingRow(idx, 'company_trainer', e.target.value || null)} placeholder="Firma..." />
                    </TableCell>
                    <TableCell className="p-1 text-center">
                      <Checkbox checked={row.has_exam} onCheckedChange={v => updateTrainingRow(idx, 'has_exam', !!v)} />
                    </TableCell>
                    <TableCell className="p-1">
                      <Input className="h-8 text-xs" value={row.notes || ''} onChange={e => updateTrainingRow(idx, 'notes', e.target.value || null)} placeholder="Poznámka..." />
                    </TableCell>
                    <TableCell className="p-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => removeTrainingRow(idx)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {trainingRows.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">Žádné tréninky. Klikněte "Přidat řádek" nebo importujte z Excelu.</p>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <Card><CardContent className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></CardContent></Card>
    );
  }

  const filteredEngineers = trainingFilterIds !== null
    ? engineers.filter(e => trainingFilterIds.includes(e.id))
    : engineers;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Engineer Management</CardTitle>
          <CardDescription>Manage engineer records in the new centralized system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {trainingFilterIds !== null
                  ? `${filteredEngineers.length} z ${engineers.length} konstruktérů (filtr: školení)`
                  : `${engineers.length} engineers currently active`}
              </p>
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
                    <div>
                      <Label>Datum odchodu</Label>
                      <DatePickerCell
                        value={formData.endDate ? displayToIso(formData.endDate) : null}
                        onChange={(iso) => setFormData(prev => ({ ...prev, endDate: iso ? isoToDisplay(iso) : '' }))}
                      />
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
                    {knowledgeFieldsJsx}
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
            <div className="flex gap-2 items-center">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                className="max-w-xs h-9"
                placeholder="Filtrovat podle školení..."
                value={trainingSearchQuery}
                onChange={e => setTrainingSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleTrainingSearch()}
              />
              <Button variant="outline" size="sm" onClick={handleTrainingSearch} disabled={isSearching}>
                {isSearching ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Hledat'}
              </Button>
              {trainingFilterIds !== null && (
                <Button variant="ghost" size="sm" onClick={() => { setTrainingFilterIds(null); setTrainingSearchQuery(''); }}>
                  Zrušit filtr
                </Button>
              )}
            </div>
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
                  <TableHead>Odchod</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEngineers.map((engineer) => (
                  <TableRow key={engineer.id}>
                    <TableCell className="font-medium">{engineer.jmeno}</TableCell>
                    <TableCell className="font-mono text-sm">{engineer.slug}</TableCell>
                    <TableCell>{engineer.spolecnost}</TableCell>
                    <TableCell>{getStatusBadge(engineer.status)}</TableCell>
                    <TableCell>{engineer.location || 'PRG'}</TableCell>
                    <TableCell>
                      {engineer.endDate ? (
                        <Badge variant="destructive" className="text-xs">{isoToDisplay(engineer.endDate)}</Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {engineer.status === 'contractor' && engineer.hourlyRate 
                        ? `${engineer.hourlyRate} ${engineer.currency}` 
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => window.open(`/engineer/${engineer.id}`, '_blank')} title="Profil">
                          <Eye className="h-4 w-4" />
                        </Button>
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
            <div>
              <Label>Datum odchodu</Label>
              <DatePickerCell
                value={formData.endDate ? displayToIso(formData.endDate) : null}
                onChange={(iso) => setFormData(prev => ({ ...prev, endDate: iso ? isoToDisplay(iso) : '' }))}
              />
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
            {knowledgeFieldsJsx}
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
