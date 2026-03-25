import { useState } from 'react';
import { useKnowledgeList, KnowledgeItem } from '@/hooks/useKnowledgeData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, BookOpen, Loader2 } from 'lucide-react';

type TableKey = 'knowledge_software' | 'knowledge_pdm_plm' | 'knowledge_specialization' | 'knowledge_oblast';

function KnowledgeTab({ table, label }: { table: TableKey; label: string }) {
  const { items, isLoading, addItem, updateItem, deleteItem } = useKnowledgeList(table);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<KnowledgeItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [name, setName] = useState('');

  const handleAdd = async () => {
    if (!name.trim()) return;
    await addItem.mutateAsync(name);
    setName('');
    setIsAddOpen(false);
  };

  const handleUpdate = async () => {
    if (!editItem || !name.trim()) return;
    await updateItem.mutateAsync({ id: editItem.id, name });
    setEditItem(null);
    setName('');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteItem.mutateAsync(deleteId);
    setDeleteId(null);
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{items.length} položek</p>
        <Button size="sm" onClick={() => { setName(''); setIsAddOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />Přidat {label}
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Název</TableHead>
              <TableHead className="w-24">Akce</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setEditItem(item); setName(item.name); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">Žádné položky</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Přidat {label}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Název</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder={`Název ${label.toLowerCase()}`} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Zrušit</Button>
              <Button onClick={handleAdd} disabled={addItem.isPending || !name.trim()}>
                {addItem.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Přidat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={(open) => { if (!open) setEditItem(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upravit {label}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Název</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditItem(null)}>Zrušit</Button>
              <Button onClick={handleUpdate} disabled={updateItem.isPending || !name.trim()}>
                {updateItem.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Uložit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat položku?</AlertDialogTitle>
            <AlertDialogDescription>Tato akce odstraní položku ze všech přiřazených konstruktérů.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Smazat</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function KnowledgeManagement() {
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" />Správa znalostí</CardTitle>
        <CardDescription>Spravujte číselníky pro Software, PDM/PLM, Oblast a Odbornou specializaci</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="software">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="software">Software</TabsTrigger>
            <TabsTrigger value="pdm_plm">PDM/PLM</TabsTrigger>
            <TabsTrigger value="oblast">Oblast</TabsTrigger>
            <TabsTrigger value="specialization">Specializace</TabsTrigger>
          </TabsList>
          <TabsContent value="software" className="mt-4"><KnowledgeTab table="knowledge_software" label="Software" /></TabsContent>
          <TabsContent value="pdm_plm" className="mt-4"><KnowledgeTab table="knowledge_pdm_plm" label="PDM/PLM" /></TabsContent>
          <TabsContent value="oblast" className="mt-4"><KnowledgeTab table="knowledge_oblast" label="Oblast" /></TabsContent>
          <TabsContent value="specialization" className="mt-4"><KnowledgeTab table="knowledge_specialization" label="Specializaci" /></TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
