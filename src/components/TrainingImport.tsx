import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { TrainingRecord } from '@/hooks/useEngineerTraining';

type Props = {
  engineerId: string;
  onImport: (records: Omit<TrainingRecord, 'engineer_id'>[]) => Promise<void>;
};

function excelDateToISO(val: any): string | null {
  if (!val) return null;
  if (typeof val === 'number') {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  if (typeof val === 'string') {
    const m = val.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  }
  return null;
}

export function TrainingImport({ engineerId, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Omit<TrainingRecord, 'engineer_id'>[]>([]);
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

      const mapped = rows.map(r => {
        const name = r['Název školení'] || r['Nazev skoleni'] || r['name'] || r['Name'] || '';
        const examVal = r['Zkouška'] || r['Zkouska'] || r['has_exam'] || r['Exam'] || '';
        return {
          name: String(name).trim(),
          date_from: excelDateToISO(r['Od'] || r['date_from'] || r['From'] || null),
          date_to: excelDateToISO(r['Do'] || r['date_to'] || r['To'] || null),
          company_trainer: String(r['Firma/Školitel'] || r['Firma'] || r['company_trainer'] || r['Trainer'] || '').trim() || null,
          has_exam: examVal === true || examVal === 'ano' || examVal === 'Ano' || examVal === 'ANO' || examVal === 'yes' || examVal === 'Yes' || examVal === 1 || examVal === '1',
          notes: String(r['Poznámka'] || r['Poznamka'] || r['notes'] || r['Notes'] || '').trim() || null,
        } as Omit<TrainingRecord, 'engineer_id'>;
      }).filter(r => r.name);

      if (mapped.length === 0) {
        toast({ title: 'Prázdný soubor', description: 'Nebyla nalezena žádná data', variant: 'destructive' });
        return;
      }
      setPreview(mapped);
      setOpen(true);
    } catch {
      toast({ title: 'Chyba při čtení souboru', variant: 'destructive' });
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleConfirm = async () => {
    setImporting(true);
    try {
      await onImport(preview);
      setOpen(false);
      setPreview([]);
    } catch {
      toast({ title: 'Chyba při importu', variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
      <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
        <Upload className="mr-1 h-3 w-3" />Import z Excelu
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Náhled importu ({preview.length} záznamů)</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Název</TableHead>
                  <TableHead className="text-xs">Od</TableHead>
                  <TableHead className="text-xs">Do</TableHead>
                  <TableHead className="text-xs">Firma/Školitel</TableHead>
                  <TableHead className="text-xs">Zkouška</TableHead>
                  <TableHead className="text-xs">Poznámka</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs">{r.name}</TableCell>
                    <TableCell className="text-xs">{r.date_from || '-'}</TableCell>
                    <TableCell className="text-xs">{r.date_to || '-'}</TableCell>
                    <TableCell className="text-xs">{r.company_trainer || '-'}</TableCell>
                    <TableCell className="text-xs">{r.has_exam ? 'Ano' : 'Ne'}</TableCell>
                    <TableCell className="text-xs">{r.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Zrušit</Button>
            <Button onClick={handleConfirm} disabled={importing}>
              {importing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importuji...</> : `Importovat ${preview.length} záznamů`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
