

## Plán: Přidat řádek "Celkem FTE" do ProjectAssignmentMatrix

### Změna v `src/components/ProjectAssignmentMatrix.tsx`

Přidat nový summary řádek **"Celkem FTE"** hned za řádek "Počet hodin" (řádky ~1413-1478). Hodnota v každé buňce = hodin / 40, zaokrouhleno na 1 desetinné místo.

#### Implementace

Nový `<tr>` za řádkem "Počet hodin", se stejnou logikou výpočtu hodin, ale výsledek dělený 40:

```tsx
{!customerViewMode && (
<tr className="bg-secondary/10 border-t border-secondary/20">
  <td className="border border-border p-2 font-bold sticky left-0 bg-secondary/10 z-10 text-foreground text-sm">
    Celkem FTE
  </td>
  {viewMode === 'weeks' ? (
    months.map((month, monthIndex) => 
      month.weeks.map((week, weekIndex) => {
        const totalHours = filteredEngineers.reduce((sum, engineer) => {
          const projectData = matrixData[engineer][week];
          const project = projectData?.projekt;
          const hours = projectData?.hours || 0;
          if (project === 'FREE' || project === 'DOVOLENÁ' || project === 'OVER') return sum;
          return sum + hours;
        }, 0);
        const fte = (totalHours / 40).toFixed(1);
        return (
          <td key={week} className={`border border-border p-1 text-center font-semibold ${
            monthIndex > 0 && weekIndex === 0 ? 'border-l-4 border-l-primary/50' : ''
          }`}>
            <div className="text-sm text-foreground">{fte}</div>
          </td>
        );
      })
    )
  ) : (
    /* stejná logika pro měsíční pohled, totalHours / 40 */
  )}
</tr>
)}
```

Vloží se na řádek ~1478, těsně za uzavírací `)}` řádku "Počet hodin" a před řádek "Vytížení".

