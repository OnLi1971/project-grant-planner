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
import { getWorkingDaysInCW } from '@/utils/workingDays';

// Počet pracovních dnů v týdnu (bez svátků) podle klíče CWxx-YYYY
const workingDaysForCw = (cw: string): number => {
  const m = cw.match(/CW(\d+)-(\d+)/);
  if (!m) return 5;
  return getWorkingDaysInCW(parseInt(m[1]), parseInt(m[2]));
};

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
  status?: string;
  tentative?: boolean;
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

// Plné datum (d.m.yyyy / Date / Excel serial)
const parseFullDate = (val: any): Date | null => {
  if (val === null || val === undefined || val === '') return null;
  if (val instanceof Date) return new Date(val.getFullYear(), val.getMonth(), val.getDate());
  if (typeof val === 'number') {
    const p = XLSX.SSF.parse_date_code(val);
    return p ? new Date(p.y, p.m - 1, p.d) : null;
  }
  const m = String(val).trim().match(/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})$/);
  return m ? new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10)) : null;
};

const isTentativeStatus = (stav: string) => {
  const s = normalizeName(stav || '');
  return s.includes('nova') || s.includes('nove') || s.includes('predschvalena') || s.includes('predschvalene');
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

      // === Nový formulář: seznam Uživatel / Datum od / Datum do / Počet dní / Typ / Aktuální stav ===
      let listHeaderIdx = -1;
      for (let i = 0; i < Math.min(grid.length, 20); i++) {
        const cells = (grid[i] || []).map(c => normalizeName(String(c ?? '')));
        if (cells.some(c => c.startsWith('uzivatel')) && cells.some(c => c.startsWith('datum od'))) {
          listHeaderIdx = i;
          break;
        }
      }

      if (listHeaderIdx !== -1) {
        const header = (grid[listHeaderIdx] || []).map(c => normalizeName(String(c ?? '')));
        const findCol = (pred: (c: string) => boolean) => header.findIndex(pred);
        const cUser = findCol(c => c.startsWith('uzivatel'));
        const cFrom = findCol(c => c.startsWith('datum od'));
        const cTo = findCol(c => c.startsWith('datum do'));
        const cTyp = findCol(c => c === 'typ');
        const cStav = findCol(c => c.includes('stav'));

        // Aktuální plán + mapa jmen
        const planMapL = new Map<string, { projekt: string; hours: number }>();
        planningData.forEach(p => {
          planMapL.set(`${normalizeName(p.konstrukter)}|${p.cw}`, {
            projekt: p.projekt || 'FREE',
            hours: p.mhTyden || 0,
          });
        });
        const nameByNormL = new Map<string, string>();
        planningData.forEach(p => nameByNormL.set(normalizeName(p.konstrukter), p.konstrukter));

        // agregace: jméno|cw -> { dny, tentative }
        const agg = new Map<string, { konstrukter: string; norm: string; cw: string; days: number; tentative: boolean; statuses: Set<string> }>();
        const missingL = new Set<string>();

        for (let i = listHeaderIdx + 1; i < grid.length; i++) {
          const row = grid[i] || [];
          const rawUser = String(row[cUser] ?? '').trim();
          if (!rawUser) continue;
          const nameMatch = rawUser.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
          const rawName = (nameMatch ? nameMatch[1] : rawUser).trim();
          const from = parseFullDate(row[cFrom]);
          const to = parseFullDate(row[cTo]) || from;
          if (!from || !to) continue;

          const stav = cStav >= 0 ? String(row[cStav] ?? '').trim() : '';
          const tentative = isTentativeStatus(stav);

          const norm = normalizeName(rawName);
          const konstrukter = nameByNormL.get(norm);
          if (!konstrukter) { missingL.add(rawName); continue; }

          for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
            const dow = d.getDay();
            if (dow === 0 || dow === 6) continue; // jen pracovní dny
            const cw = `CW${String(getISOWeek(d)).padStart(2, '0')}-${getISOWeekYear(d)}`;
            const key = `${norm}|${cw}`;
            const cur = agg.get(key);
            if (cur) {
              cur.days = Math.min(5, cur.days + 1);
              cur.tentative = cur.tentative || tentative;
              if (stav) cur.statuses.add(stav);
            } else {
              agg.set(key, { konstrukter, norm, cw, days: 1, tentative, statuses: new Set(stav ? [stav] : []) });
            }
          }
        }

        const parsedL: Row[] = [];
        agg.forEach(a => {
          // Týden nemusí v plánu existovat (např. CW53-2026) – uložení ho vytvoří
          const existing = planMapL.get(`${a.norm}|${a.cw}`);
          const current = existing ?? { projekt: 'FREE', hours: 0 };
          const wd = workingDaysForCw(a.cw);
          const fullWeek = a.days >= wd;
          const newHours = fullWeek ? 40 : Math.round(7.2 * (wd - a.days));
          const conflict = !!existing && NON_PROJECT.includes(normalizeProject(current.projekt).toUpperCase());
          parsedL.push({
            konstrukter: a.konstrukter,
            cw: a.cw,
            leaveDays: a.days,
            currentProject: current.projekt,
            currentHours: current.hours,
            newHours,
            fullWeek,
            conflict,
            selected: !conflict,
            status: Array.from(a.statuses).join(', '),
            tentative: a.tentative,
          });
        });

        if (parsedL.length === 0 && missingL.size === 0) {
          toast({ title: 'Žádné změny', description: 'V souboru nebyly nalezeny dovolené pro existující týdny', variant: 'destructive' });
          return;
        }

        parsedL.sort((a, b) => a.konstrukter.localeCompare(b.konstrukter) || a.cw.localeCompare(b.cw));
        setRows(parsedL);
        setUnmatched(Array.from(missingL));
        setOpen(true);
        return;
      }

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
          const existing = planMap.get(`${norm}|${cw}`);
          const current = existing ?? { projekt: 'FREE', hours: 0 };
          const wd = workingDaysForCw(cw);
          const fullWeek = leaveDays >= wd;
          const newHours = fullWeek ? 40 : Math.round(7.2 * (wd - leaveDays));
          const conflict = !!existing && NON_PROJECT.includes(normalizeProject(current.projekt).toUpperCase());
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
          await updatePlanningEntry(r.konstrukter, r.cw, 'DOVOLENÁ', !!r.tentative);
          await updatePlanningHours(r.konstrukter, r.cw, 40, 5);
        } else {
          await updatePlanningHours(r.konstrukter, r.cw, r.newHours, r.leaveDays);
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
                      <div className="flex flex-col gap-1">
                        {r.conflict ? <Badge variant="destructive">konflikt</Badge> : <Badge variant="secondary">OK</Badge>}
                        {r.status && (
                          <Badge variant="outline" className={r.tentative ? 'bg-success/10 text-success border-success/40' : 'bg-success/30 border-success'}>
                            {r.status}
                          </Badge>
                        )}
                      </div>
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
