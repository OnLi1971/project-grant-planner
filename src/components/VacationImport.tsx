import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CalendarOff, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getISOWeek, getISOWeekYear } from 'date-fns';
import { usePlanning } from '@/contexts/PlanningContext';
import { normalizeName } from '@/utils/nameNormalization';

const NON_PROJECT = ['NEMOC', 'FREE', 'OVER'];

type Row = {
  konstrukter: string;
  cw: string;
  leaveDays: number;
  currentProject: string;
  currentHours: number;
  newHours: number;
  fullWeek: boolean;
  conflict: boolean;
  selected: boolean;
};

const normalizeProject = (p: string) =>
  normalizeName(p || '').replace(/[^a-z]/g, '');

const countLeaveDays = (cell: any): number => {
  if (cell === null || cell === undefined) return 0;
  const s = String(cell).toUpperCase();
  let n = 0;
  for (const ch of s) if (ch === 'D' || ch === 'O') n++;
  return Math.min(n, 5);
};

const parseDayMonth = (val: any): { d: number; m: number } | null => {
  if (val === null || val === undefined) return null;
  if (val instanceof Date) return { d: val.getDate(), m: val.getMonth() + 1 };
  if (typeof val === 'number') {
    const p = XLSX.SSF.parse_date_code(val);
    if (p) return { d: p.d, m: p.m };
    return null;
  }
  const m = String(val).trim().match(/^(\d{1,2})\.\s*(\d{1,2})\.?$/);
  return m ? { d: parseInt(m[1], 10), m: parseInt(m[2], 10) } : null;
};

export function VacationImport() {
  const fileRef = useRef<HTMLInputElement>(null);
  const { planningData, updatePlanningEntry, updatePlanningHours } = usePlanning();
  const [rows, setRows] = useState<Row[]>([]);
  const [unmatched, setUnmatched] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;

    try {
      const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const grid: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });

      // Najdi řádek s datem pondělí (min. 3 buňky ve tvaru d.m.)
      let dateRowIdx = -1;
      for (let i = 0; i < Math.min(grid.length, 15); i++) {
        const hits = (grid[i] || []).filter(c => parseDayMonth(c)).length;
        if (hits >= 3) { dateRowIdx = i; break; }
      }
      if (dateRowIdx === -1) {
        toast({ title: 'Nerozpoznaná hlavička', description: 'Nenašel jsem řádek s daty pondělí (např. 6.7.)', variant: 'destructive' });
        return;
      }

      // Rok z hlavičky, jinak aktuální
      let year = new Date().getFullYear();
      for (let i = 0; i <= dateRowIdx; i++) {
        for (const c of grid[i] || []) {
          const y = parseInt(String(c).trim(), 10);
          if (y >= 2020 && y <= 2100) { year = y; break; }
        }
      }

      // Mapa sloupec -> CW klíč
      const colToCw = new Map<number, string>();
      (grid[dateRowIdx] || []).forEach((c, colIdx) => {
        const dm = parseDayMonth(c);
        if (!dm) return;
        const monday = new Date(year, dm.m - 1, dm.d);
        const cwNum = getISOWeek(monday);
        const cwYear = getISOWeekYear(monday);
        colToCw.set(colIdx, `CW${String(cwNum).padStart(2, '0')}-${cwYear}`);
      });

      // Aktuální plán
      const planMap = new Map<string, { projekt: string; hours: number }>();
      planningData.forEach(p => {
        planMap.set(`${normalizeName(p.konstrukter)}|${p.cw}`, {
          projekt: p.projekt || 'FREE',
          hours: p.mhTyden || 0,
        });
      });
      const nameByNorm = new Map<string, string>();
      planningData.forEach(p => nameByNorm.set(normalizeName(p.konstrukter), p.konstrukter));

      const parsed: Row[] = [];
      const missing = new Set<string>();

      for (let i = dateRowIdx + 1; i < grid.length; i++) {
        const row = grid[i] || [];
        let nameCellIdx = -1;
        let rawName = '';
        for (let c = 0; c < Math.min(row.length, 4); c++) {
          const m = String(row[c] ?? '').trim().match(/^(.+?)\s*\(([^)]+)\)\s*$/);
          if (m) { nameCellIdx = c; rawName = m[1].trim(); break; }
        }
        if (nameCellIdx === -1) continue;

        const norm = normalizeName(rawName);
        const konstrukter = nameByNorm.get(norm);
        if (!konstrukter) { missing.add(rawName); continue; }

        colToCw.forEach((cw, colIdx) => {
          const leaveDays = countLeaveDays(row[colIdx]);
          if (leaveDays === 0) return;
          const current = planMap.get(`${norm}|${cw}`);
          if (!current) return;
          const fullWeek = leaveDays >= 5;
          const newHours = fullWeek ? 40 : Math.round(7.2 * (5 - leaveDays));
          const conflict = NON_PROJECT.includes(normalizeProject(current.projekt).toUpperCase());
          parsed.push({
            konstrukter,
            cw,
            leaveDays,
            currentProject: current.projekt,
            currentHours: current.hours,
            newHours,
            fullWeek,
            conflict,
            selected: !conflict,
          });
        });
      }

      if (parsed.length === 0 && missing.size === 0) {
        toast({ title: 'Žádné změny', description: 'V souboru nebyly nalezeny dovolené pro existující týdny', variant: 'destructive' });
        return;
      }

      parsed.sort((a, b) => a.konstrukter.localeCompare(b.konstrukter) || a.cw.localeCompare(b.cw));
      setRows(parsed);
      setUnmatched(Array.from(missing));
      setOpen(true);
    } catch (err) {
      console.error(err);
      toast({ title: 'Chyba při čtení souboru', variant: 'destructive' });
    }
  };

  const toggle = (i: number) =>
    setRows(prev => prev.map((r, idx) => (idx === i ? { ...r, selected: !r.selected } : r)));

  const handleConfirm = async () => {
    setImporting(true);
    let ok = 0;
    try {
      for (const r of rows.filter(x => x.selected)) {
        if (r.fullWeek) {
          await updatePlanningEntry(r.konstrukter, r.cw, 'DOVOLENÁ');
          await updatePlanningHours(r.konstrukter, r.cw, 40);
        } else {
          await updatePlanningHours(r.konstrukter, r.cw, r.newHours);
        }
        ok++;
      }
      toast({ title: 'Import dokončen', description: `Aktualizováno ${ok} týdnů` });
      setOpen(false);
      setRows([]);
      setUnmatched([]);
    } catch (err) {
      toast({ title: 'Chyba při importu', description: `Uloženo ${ok} změn před chybou`, variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  const selectedCount = rows.filter(r => r.selected).length;
  const conflictCount = rows.filter(r => r.conflict).length;

  return (
    <>
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
      <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
        <CalendarOff className="h-4 w-4 mr-2" />
        Import dovolených (XLS)
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Náhled importu dovolených</DialogTitle>
          </DialogHeader>

          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="secondary">{rows.length} nalezených změn</Badge>
            <Badge variant="secondary">{selectedCount} vybráno</Badge>
            {conflictCount > 0 && <Badge variant="destructive">{conflictCount} konfliktů</Badge>}
            {unmatched.length > 0 && <Badge variant="outline">{unmatched.length} nespárovaných jmen</Badge>}
          </div>

          {unmatched.length > 0 && (
            <div className="text-xs text-muted-foreground border rounded p-2">
              Nespárovaní konstruktéři (přeskočeni): {unmatched.join(', ')}
            </div>
          )}

          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead className="text-xs">Konstruktér</TableHead>
                  <TableHead className="text-xs">CW</TableHead>
                  <TableHead className="text-xs">Dny volna</TableHead>
                  <TableHead className="text-xs">Projekt</TableHead>
                  <TableHead className="text-xs">Akce</TableHead>
                  <TableHead className="text-xs">Stav</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={`${r.konstrukter}-${r.cw}`}>
                    <TableCell>
                      <Checkbox checked={r.selected} onCheckedChange={() => toggle(i)} />
                    </TableCell>
                    <TableCell className="text-xs">{r.konstrukter}</TableCell>
                    <TableCell className="text-xs">{r.cw}</TableCell>
                    <TableCell className="text-xs">{r.leaveDays}</TableCell>
                    <TableCell className="text-xs">{r.currentProject}</TableCell>
                    <TableCell className="text-xs">
                      {r.fullWeek ? 'DOVOLENÁ, 40 h' : `hodiny ${r.currentHours} → ${r.newHours} h`}
                    </TableCell>
                    <TableCell className="text-xs">
                      {r.conflict ? <Badge variant="destructive">konflikt</Badge> : <Badge variant="secondary">OK</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Zrušit</Button>
            <Button onClick={handleConfirm} disabled={importing || selectedCount === 0}>
              {importing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importuji...</> : `Importovat ${selectedCount} změn`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
