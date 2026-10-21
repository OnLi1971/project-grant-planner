# Click summary on chart columns

Clicking a month column in the "Capacity vs. demand" chart (Project Hours Matrix) opens a panel under the chart with a short English summary of that month.

## Example text
"October 2026: Demand is 31.4 FTE (Delivery 27.0, Presales 4.4) against 33.5 FTE available capacity. Surplus of 2.1 FTE. Largest projects: ST_EMU_INT 9.2, NU_CRAIN 5.1, SE_FEM 4.0. 3.5 FTE is blocked by other programs. Without presales the team is at 81 % of capacity."
- Shortage variant: "Shortage of X FTE – additional engineers or re-planning needed."
- Panel shows selected month, close button; clicking another column switches it. Respects the Program / Custom filter.

## Technical
- New pure utility `src/utils/capacityPeriodSummary.ts` building the text from the chart row (delivery/presales per project, capacity, blocked) + test.
- `ProjectCapacityChart.tsx`: `onClick` on Bar/ComposedChart stores selected month; render summary panel with design tokens.
- Rule-based text (no AI), instant and free.
