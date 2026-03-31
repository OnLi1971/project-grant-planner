

## Zobrazit 0% místo prázdných buněk v Utilization Gridu

### Změna v `src/components/UtilizationGrid.tsx`

Aktuálně se prázdné buňky zobrazují když `pct === 0` (podmínka `pct > 0 ? ... : ''`). Stačí změnit na vždy zobrazovat hodnotu:

- Weekly renderování: `{Math.round(pct)}%` místo `{pct > 0 ? \`${Math.round(pct)}%\` : ''}`
- Monthly renderování: totéž

Obě místa — cca řádky s `pct > 0 ?` v JSX renderování tabulky.

