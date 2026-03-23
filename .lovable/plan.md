

## Plan: Show partially free engineers in FREE allocation dialog

### Problem
The FREE project dialog only shows engineers explicitly assigned to FREE. Engineers allocated to other projects with less than 40h/week (e.g., 30h on ST_EMU_INT = 10h free) are not shown.

### Solution
Modify `getAllocationsForProject` in `ProjectAssignmentMatrix.tsx` to add a special case when `projectName === 'FREE'`:

1. **Keep existing logic** for engineers explicitly on FREE
2. **Add partial free capacity**: For each filtered engineer in each week, if their project is NOT FREE/DOVOLENÁ/NEMOC/OVER and hours < 40, calculate `freeHours = 40 - hours` and add an allocation entry marked as partial
3. **Add `isPartialFree` flag** to `AllocationEntry` interface in `ProjectAllocationDialog.tsx`
4. **Style partial entries in yellow** in the dialog table — yellow text and yellow background (similar to tentative styling but distinct)

### Changes

**`src/components/ProjectAllocationDialog.tsx`**:
- Add `isPartialFree?: boolean` to `AllocationEntry` interface
- In cell rendering, add condition: if `isPartialFree`, use yellow styling (e.g., `text-yellow-500`, `bg-yellow-500/15`)

**`src/components/ProjectAssignmentMatrix.tsx`**:
- In `getAllocationsForProject`, when `projectName === 'FREE'`:
  - After collecting explicit FREE engineers, also scan all filtered engineers
  - For each week where engineer has a non-regime project with hours < 40, add entry with `hours: 40 - actualHours`, `isPartialFree: true`
  - Add these engineers to `engineersOnProject` set so they appear in the table

### File list
- `src/components/ProjectAllocationDialog.tsx`
- `src/components/ProjectAssignmentMatrix.tsx`

