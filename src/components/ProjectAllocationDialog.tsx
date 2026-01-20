import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Project, Customer, ProjectManager, Program } from '@/data/projectsData';

export interface AllocationEntry {
  engineer: string;
  week: string;
  hours: number;
  isTentative: boolean;
}

interface ProjectAllocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  allocations: AllocationEntry[];
  projectInfo?: Project;
  customers?: Customer[];
  projectManagers?: ProjectManager[];
  programs?: Program[];
}

export const ProjectAllocationDialog = ({
  open,
  onOpenChange,
  projectName,
  allocations,
  projectInfo,
  customers,
  projectManagers,
  programs,
}: ProjectAllocationDialogProps) => {
  // Get unique weeks sorted chronologically
  const weeks = useMemo(() => {
    const uniqueWeeks = [...new Set(allocations.map(a => a.week))];
    return uniqueWeeks.sort((a, b) => {
      const [, cwA, yearA] = a.match(/CW(\d+)-(\d+)/) || [];
      const [, cwB, yearB] = b.match(/CW(\d+)-(\d+)/) || [];
      const yearDiff = parseInt(yearA) - parseInt(yearB);
      if (yearDiff !== 0) return yearDiff;
      return parseInt(cwA) - parseInt(cwB);
    });
  }, [allocations]);

  // Get unique engineers sorted alphabetically
  const engineers = useMemo(() => {
    const uniqueEngineers = [...new Set(allocations.map(a => a.engineer))];
    return uniqueEngineers.sort((a, b) => a.localeCompare(b, 'cs'));
  }, [allocations]);

  // Create allocation matrix: { engineer: { week: { hours, isTentative } } }
  const allocationMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, { hours: number; isTentative: boolean }>> = {};
    
    engineers.forEach(eng => {
      matrix[eng] = {};
    });
    
    allocations.forEach(a => {
      if (!matrix[a.engineer]) matrix[a.engineer] = {};
      matrix[a.engineer][a.week] = { hours: a.hours, isTentative: a.isTentative };
    });
    
    return matrix;
  }, [allocations, engineers]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalHours = allocations.reduce((sum, a) => sum + a.hours, 0);
    const tentativeAllocations = allocations.filter(a => a.isTentative).length;
    const finalAllocations = allocations.length - tentativeAllocations;
    const tentativeHours = allocations.filter(a => a.isTentative).reduce((sum, a) => sum + a.hours, 0);
    const finalHours = totalHours - tentativeHours;
    
    return {
      totalHours,
      uniqueEngineers: engineers.length,
      tentativeAllocations,
      finalAllocations,
      tentativeHours,
      finalHours,
      avgHoursPerEngineer: engineers.length > 0 ? Math.round(totalHours / engineers.length) : 0,
    };
  }, [allocations, engineers]);

  // Calculate row totals (per engineer)
  const rowTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    engineers.forEach(eng => {
      totals[eng] = weeks.reduce((sum, week) => {
        return sum + (allocationMatrix[eng]?.[week]?.hours || 0);
      }, 0);
    });
    return totals;
  }, [engineers, weeks, allocationMatrix]);

  // Calculate column totals (per week)
  const columnTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    weeks.forEach(week => {
      totals[week] = engineers.reduce((sum, eng) => {
        return sum + (allocationMatrix[eng]?.[week]?.hours || 0);
      }, 0);
    });
    return totals;
  }, [engineers, weeks, allocationMatrix]);

  // Get project metadata
  const customer = customers?.find(c => c.id === projectInfo?.customerId);
  const pm = projectManagers?.find(p => p.id === projectInfo?.projectManagerId);
  const program = programs?.find(p => p.id === projectInfo?.programId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            {projectName}
            {projectInfo?.projectType && (
              <Badge variant="outline" className="text-[10px]">
                {projectInfo.projectType}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Project info */}
        {projectInfo && (
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground border-b pb-2">
            {customer && (
              <div>
                <span className="font-medium text-foreground">Zákazník:</span> {customer.name}
              </div>
            )}
            {program && (
              <div>
                <span className="font-medium text-foreground">Program:</span> {program.code}
              </div>
            )}
            {pm && (
              <div>
                <span className="font-medium text-foreground">PM:</span> {pm.name}
              </div>
            )}
            {projectInfo.averageHourlyRate && (
              <div>
                <span className="font-medium text-foreground">Hod. sazba:</span> {projectInfo.averageHourlyRate} Kč
              </div>
            )}
          </div>
        )}

        {/* Statistics cards */}
        <div className="grid grid-cols-3 gap-2 py-2">
          <Card className="bg-muted/30">
            <CardContent className="p-2 text-center">
              <div className="text-lg font-bold text-primary">{stats.totalHours}h</div>
              <div className="text-[10px] text-muted-foreground">Celkem hodin</div>
            </CardContent>
          </Card>
          <Card className="bg-green-500/10">
            <CardContent className="p-2 text-center">
              <div className="text-lg font-bold text-green-600">{stats.finalHours}h</div>
              <div className="text-[10px] text-muted-foreground">Finální ({stats.finalAllocations})</div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-500/10">
            <CardContent className="p-2 text-center">
              <div className="text-lg font-bold text-yellow-600">{stats.tentativeHours}h</div>
              <div className="text-[10px] text-muted-foreground">Předběžně ({stats.tentativeAllocations})</div>
            </CardContent>
          </Card>
        </div>

        {/* Allocation table */}
        {allocations.length > 0 ? (
          <div className="flex-1 min-h-0 overflow-hidden border rounded-md" style={{ maxHeight: 'calc(80vh - 200px)' }}>
            <ScrollArea className="h-full">
              <div className="min-w-max">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background z-20 min-w-[130px] font-semibold text-xs py-1.5 px-2">
                        Konstruktér
                      </TableHead>
                      {weeks.map(week => (
                        <TableHead key={week} className="text-center min-w-[50px] text-[10px] py-1.5 px-1">
                          {week}
                        </TableHead>
                      ))}
                      <TableHead className="text-center min-w-[50px] font-semibold bg-muted/30 text-xs py-1.5 px-1">
                        Celkem
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {engineers.map((engineer, index) => (
                      <TableRow key={engineer} className={index % 2 === 1 ? 'bg-muted/20' : ''}>
                        <TableCell className="sticky left-0 bg-inherit z-10 font-medium text-xs py-1 px-2">
                          {engineer}
                        </TableCell>
                        {weeks.map(week => {
                          const allocation = allocationMatrix[engineer]?.[week];
                          const hasAllocation = allocation && allocation.hours > 0;
                          const isFullyAllocated = allocation?.hours >= 35;
                          
                          return (
                            <TableCell 
                              key={week} 
                              className={`text-center text-[11px] py-1 px-1 ${
                                hasAllocation 
                                  ? allocation.isTentative 
                                    ? 'bg-yellow-500/20' 
                                    : isFullyAllocated 
                                      ? 'bg-green-500/10' 
                                      : 'bg-orange-500/10'
                                  : ''
                              }`}
                            >
                              {hasAllocation ? (
                                <span className={`font-medium ${
                                  allocation.isTentative 
                                    ? 'text-yellow-600' 
                                    : isFullyAllocated 
                                      ? 'text-green-600' 
                                      : 'text-orange-600'
                                }`}>
                                  {allocation.hours}h
                                  {allocation.isTentative && <span className="text-[9px] ml-0.5">?</span>}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/30">-</span>
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center font-bold bg-muted/30 text-xs py-1 px-1">
                          {rowTotals[engineer]}h
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Column totals row */}
                    <TableRow className="bg-muted/50 border-t-2">
                      <TableCell className="sticky left-0 bg-muted/50 z-10 font-bold text-xs py-1 px-2">
                        Celkem
                      </TableCell>
                      {weeks.map(week => (
                        <TableCell key={week} className="text-center font-bold text-xs py-1 px-1">
                          {columnTotals[week]}h
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-bold bg-primary/10 text-primary text-xs py-1 px-1">
                        {stats.totalHours}h
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Žádné alokace pro tento projekt
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-3 pt-2 border-t text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30"></div>
            <span>Plné vytížení (35+ h)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-500/20 border border-orange-500/30"></div>
            <span>Částečné vytížení</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-500/30 border border-yellow-500/50"></div>
            <span>Předběžná rezervace (?)</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
