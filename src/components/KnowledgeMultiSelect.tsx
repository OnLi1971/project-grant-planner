import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { KnowledgeItem } from '@/hooks/useKnowledgeData';

export type LeveledSelection = { id: string; level: number };

interface KnowledgeMultiSelectProps {
  items: KnowledgeItem[];
  selectedItems: LeveledSelection[];
  onChange: (items: LeveledSelection[]) => void;
  placeholder?: string;
  isLoading?: boolean;
  showLevels?: boolean;
}

export function KnowledgeMultiSelect({ items, selectedItems, onChange, placeholder = 'Vyberte...', isLoading, showLevels = false }: KnowledgeMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedIds = selectedItems.map(s => s.id);

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedItems.filter(i => i.id !== id));
    } else {
      onChange([...selectedItems, { id, level: 1 }]);
    }
  };

  const setLevel = (id: string, level: number) => {
    onChange(selectedItems.map(i => i.id === id ? { ...i, level } : i));
  };

  const selectedWithNames = selectedItems
    .map(s => ({ ...s, name: items.find(i => i.id === s.id)?.name }))
    .filter(s => s.name);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between h-auto min-h-10">
            <div className="flex flex-wrap gap-1">
              {selectedWithNames.length > 0
                ? selectedWithNames.map(s => (
                    <Badge key={s.id} variant="secondary" className="text-xs">
                      {s.name}{showLevels ? ` (${s.level})` : ''}
                    </Badge>
                  ))
                : <span className="text-muted-foreground">{placeholder}</span>
              }
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Hledat..." />
            <CommandList>
              <CommandEmpty>{isLoading ? 'Načítám...' : 'Nic nenalezeno'}</CommandEmpty>
              <CommandGroup>
                {items.map(item => (
                  <CommandItem key={item.id} value={item.name} onSelect={() => toggle(item.id)}>
                    <Check className={cn('mr-2 h-4 w-4', selectedIds.includes(item.id) ? 'opacity-100' : 'opacity-0')} />
                    {item.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {showLevels && selectedWithNames.length > 0 && (
        <div className="space-y-1">
          {selectedWithNames.map(s => (
            <div key={s.id} className="flex items-center gap-2 text-sm">
              <span className="flex-1 truncate">{s.name}</span>
              <Select value={String(s.level)} onValueChange={v => setLevel(s.id, Number(v))}>
                <SelectTrigger className="w-20 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(l => (
                    <SelectItem key={l} value={String(l)}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
