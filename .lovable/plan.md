

## Přidat filtr konstruktérů do UtilizationGrid (stejný jako v matici)

### Co se změní

Do `src/components/UtilizationGrid.tsx` přidám filtr konstruktérů ve stejném stylu jako v `ProjectAssignmentMatrix` — Popover s checkboxy, hledáním, tlačítky Vše/Nic, a napojením na uložené pohledy (`useCustomEngineerViews`).

### Implementace

**Nové importy**: `Popover`, `PopoverTrigger`, `PopoverContent`, `Checkbox`, `Input`, `ScrollArea`, `Separator`, `Users`, `Save`, `Trash2`, `ChevronDown` + `useCustomEngineerViews` hook + `useAuth`

**Nové stavy**:
- `selectedEngineers: string[]` — vybraní konstruktéři (prázdný = všichni)
- `selectedViewId: string | null` — ID uloženého pohledu
- `customViewName: string` — název pro uložení nového pohledu

**UI**: Vedle company filtru přidat Popover tlačítko „Konstruktéři (N)" obsahující:
1. Uložené pohledy (z `useCustomEngineerViews`) — kliknutím se načtou
2. Seznam konstruktérů s checkboxy a hledáním
3. Tlačítka „Vše" / „Nic"
4. Input + tlačítko „Uložit" pro uložení nového pohledu

**Filtrování**: Rozšířit `filteredEngineers` useMemo — po company filtru aplikovat `selectedEngineers`:
```typescript
if (selectedEngineers.length > 0) {
  list = list.filter(e => selectedEngineers.includes(e.jmeno));
}
```

### Dotčený soubor
- `src/components/UtilizationGrid.tsx`

