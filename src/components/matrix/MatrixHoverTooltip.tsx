import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';

export type HoveredMatrixTooltip =
  | {
      kind: 'week';
      rect: { left: number; top: number; bottom: number; width: number };
      project: string;
      week: string;
    }
  | {
      kind: 'split';
      rect: { left: number; top: number; bottom: number; width: number };
      primaryProject: string;
      secondaryProject: string;
      week: string;
      hours: number;
      hours2: number;
    }
  | {
      kind: 'month';
      rect: { left: number; top: number; bottom: number; width: number };
      project: string;
      monthName: string;
      monthWeeks: string[];
    };

export interface MatrixHoverTooltipHandle {
  show: (payload: HoveredMatrixTooltip) => void;
  hide: () => void;
}

interface MatrixHoverTooltipProps {
  getProjectDisplayName: (project: string) => string;
  getFullMonthNameEN: (fullName: string) => string;
  getEngineersForProjectInWeek: (
    projectName: string,
    week: string
  ) => { name: string; isTentative: boolean; hours: number }[];
  getEngineersForProjectInMonth: (
    projectName: string,
    monthName: string,
    monthWeeks: string[]
  ) => { name: string; isTentative: boolean; hours: number; isPartial: boolean }[];
}

export const MatrixHoverTooltip = React.forwardRef<MatrixHoverTooltipHandle, MatrixHoverTooltipProps>(
  (
    {
      getProjectDisplayName,
      getFullMonthNameEN,
      getEngineersForProjectInWeek,
      getEngineersForProjectInMonth,
    },
    ref
  ) => {
    const [tooltip, setTooltip] = useState<HoveredMatrixTooltip | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        show(payload) {
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            timerRef.current = null;
            setTooltip(payload);
          }, 200);
        },
        hide() {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
          setTooltip(null);
        },
      }),
      []
    );

    useEffect(() => {
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }, []);

    if (!tooltip) return null;

    const centerX = tooltip.rect.left + tooltip.rect.width / 2;
    const maxX = typeof window !== 'undefined' ? window.innerWidth - 180 : centerX;
    const left = Math.min(Math.max(centerX, 180), Math.max(180, maxX));
    const showAbove = tooltip.rect.top > 240;
    const top = showAbove ? tooltip.rect.top - 8 : tooltip.rect.bottom + 8;
    const transform = showAbove ? 'translate(-50%, -100%)' : 'translate(-50%, 0)';

    let content: React.ReactNode = null;

    if (tooltip.kind === 'split') {
      content = (
        <div className="text-sm">
          <div className="font-semibold">
            {getProjectDisplayName(tooltip.secondaryProject)} - {tooltip.week}
          </div>
          <div className="text-xs text-muted-foreground">
            Split week: {tooltip.hours}h {getProjectDisplayName(tooltip.primaryProject)} + {tooltip.hours2}h{' '}
            {getProjectDisplayName(tooltip.secondaryProject)}
          </div>
        </div>
      );
    } else if (tooltip.kind === 'week') {
      const engineers = getEngineersForProjectInWeek(tooltip.project, tooltip.week);
      const tentativeCount = engineers.filter((e) => e.isTentative).length;
      const partialCount = engineers.filter((e) => e.hours > 0 && e.hours < 35).length;
      const fullCount = engineers.filter((e) => e.hours >= 35).length;
      const isFreeProject = tooltip.project === 'FREE';
      const totalHours = engineers.reduce((sum, e) => sum + e.hours, 0);

      content = (
        <div className="text-sm">
          <div className="font-semibold mb-1">
            {getProjectDisplayName(tooltip.project)} - {tooltip.week}
          </div>
          <div className="text-xs text-muted-foreground mb-2 space-y-0.5">
            <div>
              {isFreeProject ? 'Available:' : 'Allocated:'} {engineers.length} engineers
            </div>
            <div className="text-blue-400">📊 Total: {totalHours}h</div>
            {fullCount > 0 && (
              <div className="text-green-500">
                ● {isFreeProject ? 'Free capacity' : 'Fully allocated'}: {fullCount}
              </div>
            )}
            {partialCount > 0 && <div className="text-orange-400">◐ Partial: {partialCount}</div>}
            {tentativeCount > 0 && <div className="text-yellow-400">⚠ Tentative: {tentativeCount}</div>}
          </div>
          <div className="flex flex-col gap-0.5 max-h-[200px] overflow-y-auto">
            {engineers.map((eng) => (
              <div key={eng.name} className="text-xs flex items-center gap-1.5">
                <span className={eng.isTentative ? 'text-yellow-400' : ''}>{eng.name}</span>
                {eng.hours >= 35 ? (
                  <span className="text-green-500 text-[10px]">{isFreeProject ? '(free)' : '(full)'}</span>
                ) : (
                  eng.hours > 0 && <span className="text-orange-400 text-[10px]">({eng.hours}h)</span>
                )}
                {eng.isTentative && <span className="text-yellow-400 text-[10px]">(tentative)</span>}
              </div>
            ))}
          </div>
        </div>
      );
    } else {
      const engineers = getEngineersForProjectInMonth(tooltip.project, tooltip.monthName, tooltip.monthWeeks);
      const tentativeCount = engineers.filter((e) => e.isTentative).length;
      const avgHoursPerWeek =
        tooltip.monthWeeks.length > 0 ? engineers.map((e) => e.hours / tooltip.monthWeeks.length) : [];
      const fullCount = engineers.filter((_, i) => avgHoursPerWeek[i] >= 35).length;
      const partialCount = engineers.filter((_, i) => avgHoursPerWeek[i] > 0 && avgHoursPerWeek[i] < 35).length;
      const totalHours = engineers.reduce((sum, e) => sum + e.hours, 0);
      const avgHoursPerWeekTotal =
        tooltip.monthWeeks.length > 0 ? Math.round(totalHours / tooltip.monthWeeks.length) : totalHours;
      const isFreeProject = tooltip.project === 'FREE';

      content = (
        <div className="text-sm">
          <div className="font-semibold mb-1">
            {getProjectDisplayName(tooltip.project)} - {getFullMonthNameEN(tooltip.monthName)}
          </div>
          <div className="text-xs text-muted-foreground mb-2 space-y-0.5">
            <div>
              {isFreeProject ? 'Available:' : 'Allocated:'} {engineers.length} engineers
            </div>
            <div className="text-blue-400">
              📊 Total: {totalHours}h ({avgHoursPerWeekTotal}h/week)
            </div>
            {fullCount > 0 && (
              <div className="text-green-500">
                ● {isFreeProject ? 'Free capacity' : 'Fully allocated'}: {fullCount}
              </div>
            )}
            {partialCount > 0 && <div className="text-orange-400">◐ Partial: {partialCount}</div>}
            {tentativeCount > 0 && <div className="text-yellow-400">⚠ Tentative: {tentativeCount}</div>}
          </div>
          <div className="flex flex-col gap-0.5 max-h-[200px] overflow-y-auto">
            {engineers.map((eng, i) => {
              const avgHours = avgHoursPerWeek[i] || 0;
              return (
                <div key={eng.name} className="text-xs flex items-center gap-1.5">
                  <span className={eng.isTentative ? 'text-yellow-400' : ''}>{eng.name}</span>
                  {avgHours >= 35 ? (
                    <span className="text-green-500 text-[10px]">(full)</span>
                  ) : (
                    avgHours > 0 && <span className="text-orange-400 text-[10px]">({Math.round(avgHours)}h/w)</span>
                  )}
                  {eng.isTentative && <span className="text-yellow-400 text-[10px]">(tentative)</span>}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div
        role="tooltip"
        style={{ left, top, transform }}
        className="fixed z-50 pointer-events-none overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md max-w-[350px]"
      >
        {content}
      </div>
    );
  }
);

MatrixHoverTooltip.displayName = 'MatrixHoverTooltip';