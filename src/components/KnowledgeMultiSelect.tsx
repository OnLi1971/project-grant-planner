import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { KnowledgeItem } from '@/hooks/useKnowledgeData';

interface KnowledgeMultiSelectProps {
  items: KnowledgeItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  isLoading?: boolean;
}

export function KnowledgeMultiSelect({ items, selectedIds, onChange, placeholder = 'Vyberte...', isLoading }: KnowledgeMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter(i => i !== id)
        : [...selectedIds, id]
    );
  };

  const selectedNames = items.filter(i => selectedIds.includes(i.id)).map(i => i.name);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between h-auto min-h-10">
          <div className="flex flex-wrap gap-1">
            {selectedNames.length > 0
              ? selectedNames.map(name => <Badge key={name} variant="secondary" className="text-xs">{name}</Badge>)
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
  );
}
