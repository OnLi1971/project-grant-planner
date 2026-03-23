

## Plan: Add legend for Allocation Ratio and Stability Index

### Change in `src/components/PlanningHistoryDialog.tsx`

Add an info legend box below or after the two index cards explaining what each metric means and how to interpret the values.

**Implementation:**

1. Add a small collapsible or always-visible legend section after the statistics grid (or below the two index cards) with:

```
Alokační poměr (alokace / dealokace):
  > 1.0 = tým roste (více alokací než dealokací)
  = 1.0 = tým je stabilní
  < 1.0 = tým se zmenšuje

Index stability (1 − dealokace/alokace), v %:
  > 0% = stabilní/rostoucí tým
  = 0% = vyrovnaný stav
  < 0% = nestabilní, více odchodů než příchodů
```

2. Use a small `Alert` or a subtle `div` with `text-xs text-muted-foreground` styling, with an info icon, placed right after the statistics grid.

### File
- `src/components/PlanningHistoryDialog.tsx` — add legend block after the stats grid row

