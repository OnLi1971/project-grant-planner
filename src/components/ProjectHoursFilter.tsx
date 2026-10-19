import { useState } from 'react';
import { ChevronDown, Folder, Save, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCustomEngineerViews } from '@/hooks/useCustomEngineerViews';
import { normalizeName } from '@/utils/nameNormalization';

export interface ProjectHoursFilterValue { mode: 'program' | 'custom'; programs: string[]; engineers: string[]; viewId?: string | null }
export function ProjectHoursFilter({ value, onChange, names, programs }: { value: ProjectHoursFilterValue; onChange: (value: ProjectHoursFilterValue) => void; names: string[]; programs: string[] }) {
  const { customViews, saveView, updateView, deleteView, isLoading } = useCustomEngineerViews();
  const viewId = value.viewId ?? null;
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const selectedView = customViews.find(view => view.id === viewId);
  const toggleProgram = (program: string) => {
    const previous = value.mode === 'program' ? value.programs : [];
    const next = program === 'All' ? ['All'] : previous.includes(program) ? previous.filter(p => p !== program && p !== 'All') : [...previous.filter(p => p !== 'All'), program];
    onChange({ ...value, mode: 'program', programs: next, viewId: null });
  };
  const save = async (update: boolean) => {
    setBusy(true);
    try {
      if (update && selectedView) await updateView(selectedView.id, selectedView.name, value.engineers);
      else if (name.trim() && await saveView(name.trim(), value.engineers)) setName('');
    } finally { setBusy(false); }
  };
  return <div className="mb-6 max-w-sm">
    <label className="mb-2 block text-sm font-medium">Program / Custom</label>
    <Popover><PopoverTrigger asChild>
      <Button variant="outline" className="w-full justify-between" aria-label="Program / Custom">
        <span className="flex min-w-0 items-center gap-2 truncate">{value.mode === 'custom' && <Folder className="h-4 w-4 shrink-0" />}{value.mode === 'custom' ? selectedView?.name || `Custom (${value.engineers.length})` : value.programs.join(', ') || 'None'}</span><ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger><PopoverContent align="start" className="w-80 max-h-[75vh] overflow-y-auto p-3">
      <div className="mb-1 text-xs font-medium text-muted-foreground">Programs</div>
      {['All', ...programs].map(program => <label key={program} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/50"><Checkbox checked={value.mode === 'program' && value.programs.includes(program)} onCheckedChange={() => toggleProgram(program)} /><span className="text-sm">{program}</span></label>)}
      <label className="mt-2 flex cursor-pointer items-center gap-2 border-t border-border pt-3"><Checkbox checked={value.mode === 'custom'} onCheckedChange={checked => { onChange({ ...value, mode: checked ? 'custom' : 'program' }); }} /><Users className="h-4 w-4" /><span className="text-sm">Custom engineer selection</span></label>
      {value.mode === 'custom' && <div className="mt-3 space-y-3">
        <div className="text-xs font-medium text-muted-foreground">Saved views</div>
        {isLoading && <div className="text-xs text-muted-foreground">Loading…</div>}
        {customViews.map(view => <div key={view.id} className="flex gap-1">
          <Button variant={view.id === viewId ? 'secondary' : 'ghost'} size="sm" className="min-w-0 flex-1 justify-start" onClick={() => { onChange({ ...value, mode: 'custom', engineers: view.engineers, viewId: view.id }); }}><Folder className="mr-2 h-4 w-4 shrink-0" /><span className="truncate">{view.name} ({view.engineers.length})</span></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" aria-label={`Delete ${view.name}`} title={`Delete ${view.name}`} onClick={async () => { if (await deleteView(view.id) && viewId === view.id) onChange({ ...value, viewId: null }); }}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>)}
        <div className="flex items-center justify-between"><span className="text-xs font-medium">Engineers ({value.engineers.length})</span><div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => onChange({ ...value, engineers: names })}>All</Button><Button variant="ghost" size="sm" onClick={() => onChange({ ...value, engineers: [] })}>None</Button></div></div>
        <div className="h-48 overflow-y-auto rounded border border-border p-1">
          {names.map(engineer => <label key={engineer} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-muted/50"><Checkbox checked={value.engineers.some(n => normalizeName(n) === normalizeName(engineer))} onCheckedChange={checked => onChange({ ...value, engineers: checked ? [...value.engineers.filter(n => normalizeName(n) !== normalizeName(engineer)), engineer] : value.engineers.filter(n => normalizeName(n) !== normalizeName(engineer)) })} /><span className="truncate text-xs">{engineer}</span></label>)}
        </div>
        {selectedView && <Button size="sm" className="w-full" disabled={busy || !value.engineers.length} onClick={() => save(true)}><Save className="mr-2 h-4 w-4" />Update {selectedView.name}</Button>}
        <div className="flex gap-2"><Input aria-label="New view name" placeholder="Save as new view…" value={name} onChange={event => setName(event.target.value)} className="min-w-0" /><Button size="icon" aria-label="Save new view" title="Save new view" disabled={busy || !name.trim() || !value.engineers.length} onClick={() => save(false)}><Save className="h-4 w-4" /></Button></div>
      </div>}
    </PopoverContent></Popover>
  </div>;
}