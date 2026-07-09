import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { RAIL_EL_ENGINEERS } from '@/constants/railElEngineers';
import { normalizeName } from '@/utils/nameNormalization';
import type { PlanningEntry } from '@/types/planning';

interface PlanningAIAnalyzerProps {
  planningData?: PlanningEntry[];
  visibleWeeks?: string[];
  visibleEngineerNames?: string[];
}

const PARTIAL_UTILIZATION_THRESHOLD = 35;
const REGIME_PROJECTS = new Set(['FREE', 'DOVOLENÁ', 'DOVOLENA', 'NEMOC', 'OVER', 'DEPARTED']);

export const PlanningAIAnalyzer: React.FC<PlanningAIAnalyzerProps> = ({
  planningData = [],
  visibleWeeks = [],
  visibleEngineerNames = [],
}) => {
  const [question, setQuestion] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [historyStats, setHistoryStats] = useState<any>(null);

  useEffect(() => {
    const allowed = new Set(RAIL_EL_ENGINEERS.map(n => normalizeName(n)));
    const since = new Date();
    since.setDate(since.getDate() - 30);
    (async () => {
      const { data } = await supabase
        .from('planning_changes')
        .select('konstrukter, cw, year, change_type, old_value, new_value, changed_at')
        .gte('changed_at', since.toISOString())
        .order('changed_at', { ascending: false })
        .limit(2000);
      if (!data) return;
      const rows = data.filter((c: any) => allowed.has(normalizeName(c.konstrukter)));
      const projectChanges = rows.filter((c: any) => c.change_type === 'project');
      const tentativeChanges = rows.filter((c: any) => c.change_type === 'tentative');
      const freeToProject = projectChanges.filter((c: any) =>
        (c.old_value === 'FREE' || c.old_value === null) &&
        c.new_value !== 'FREE' && c.new_value !== 'DOVOLENÁ' && c.new_value !== 'OVER'
      );
      const projectToFree = projectChanges.filter((c: any) =>
        c.old_value !== 'FREE' && c.old_value !== 'DOVOLENÁ' && c.old_value !== 'OVER' &&
        (c.new_value === 'FREE' || c.new_value === null)
      );
      const perEngineer: Record<string, { allocated: number; deallocated: number }> = {};
      for (const c of freeToProject) {
        perEngineer[c.konstrukter] = perEngineer[c.konstrukter] || { allocated: 0, deallocated: 0 };
        perEngineer[c.konstrukter].allocated++;
      }
      for (const c of projectToFree) {
        perEngineer[c.konstrukter] = perEngineer[c.konstrukter] || { allocated: 0, deallocated: 0 };
        perEngineer[c.konstrukter].deallocated++;
      }
      const topEngineers = Object.entries(perEngineer)
        .map(([name, s]) => ({ name, allocated: s.allocated, deallocated: s.deallocated, net: s.allocated - s.deallocated }))
        .sort((a, b) => Math.abs(b.net) - Math.abs(a.net))
        .slice(0, 10);
      const recentChanges = rows.slice(0, 30).map((c: any) => ({
        engineer: c.konstrukter, cw: c.cw, year: c.year, type: c.change_type,
        from: c.old_value, to: c.new_value, at: c.changed_at,
      }));
      setHistoryStats({
        periodDays: 30,
        allocations: freeToProject.length,
        deallocations: projectToFree.length,
        netChange: freeToProject.length - projectToFree.length,
        tentativeToFinal: tentativeChanges.filter((c: any) => c.new_value === 'false').length,
        finalToTentative: tentativeChanges.filter((c: any) => c.new_value === 'true').length,
        netAllocationRatio: projectToFree.length > 0 ? freeToProject.length / projectToFree.length : null,
        stabilityIndex: freeToProject.length > 0 ? 1 - (projectToFree.length / freeToProject.length) : null,
        topEngineers,
        recentChanges,
      });
    })();
  }, []);

  const planningSummary = useMemo(() => {
    if (planningData.length === 0) {
      return {
        partial_definition: `Partially utilized = project allocation >0 and <=${PARTIAL_UTILIZATION_THRESHOLD} Mh/week. Example: 20Mh/week counts.`,
        overall_partial_engineers: [],
        months: [],
      };
    }

    const visibleEngineerSet = visibleEngineerNames.length > 0
      ? new Set(visibleEngineerNames.map(name => normalizeName(name)))
      : new Set(RAIL_EL_ENGINEERS.map(name => normalizeName(name)));
    const visibleWeekSet = visibleWeeks.length > 0 ? new Set(visibleWeeks) : null;

    const filtered = planningData.filter(entry => {
      const engineerKey = normalizeName(entry.konstrukter);
      return visibleEngineerSet.has(engineerKey) && (!visibleWeekSet || visibleWeekSet.has(entry.cw));
    });

    const overallPartial: Record<string, {
      weeks: number;
      totalProjectHours: number;
      minProjectHours: number;
      maxFreeCapacity: number;
      projects: Set<string>;
      examples: { week: string; month: string; project: string; project_hours: number; free_capacity_hours: number }[];
    }> = {};

    const byMonth: Record<string, {
      freeByEngineer: Record<string, number>;
      partialByEngineer: Record<string, {
        weeks: number;
        totalProjectHours: number;
        minProjectHours: number;
        maxFreeCapacity: number;
        projects: Set<string>;
      }>;
    }> = {};

    for (const entry of filtered) {
      const month = entry.mesic || 'Unknown';
      const project = entry.projekt || 'FREE';
      const normalizedProject = project.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
      const hours = Number(entry.mhTyden || 0);

      if (!byMonth[month]) {
        byMonth[month] = { freeByEngineer: {}, partialByEngineer: {} };
      }

      if (normalizedProject === 'FREE') {
        byMonth[month].freeByEngineer[entry.konstrukter] = (byMonth[month].freeByEngineer[entry.konstrukter] || 0) + hours;
        continue;
      }

      if (REGIME_PROJECTS.has(normalizedProject) || hours <= 0 || hours > PARTIAL_UTILIZATION_THRESHOLD) {
        continue;
      }

      const freeCapacityHours = Math.max(0, 40 - hours);
      const overall = overallPartial[entry.konstrukter] || {
        weeks: 0,
        totalProjectHours: 0,
        minProjectHours: hours,
        maxFreeCapacity: freeCapacityHours,
        projects: new Set<string>(),
        examples: [],
      };
      overall.weeks += 1;
      overall.totalProjectHours += hours;
      overall.minProjectHours = Math.min(overall.minProjectHours, hours);
      overall.maxFreeCapacity = Math.max(overall.maxFreeCapacity, freeCapacityHours);
      overall.projects.add(project);
      if (overall.examples.length < 8) {
        overall.examples.push({
          week: entry.cw,
          month,
          project,
          project_hours: hours,
          free_capacity_hours: freeCapacityHours,
        });
      }
      overallPartial[entry.konstrukter] = overall;

      const monthly = byMonth[month].partialByEngineer[entry.konstrukter] || {
        weeks: 0,
        totalProjectHours: 0,
        minProjectHours: hours,
        maxFreeCapacity: freeCapacityHours,
        projects: new Set<string>(),
      };
      monthly.weeks += 1;
      monthly.totalProjectHours += hours;
      monthly.minProjectHours = Math.min(monthly.minProjectHours, hours);
      monthly.maxFreeCapacity = Math.max(monthly.maxFreeCapacity, freeCapacityHours);
      monthly.projects.add(project);
      byMonth[month].partialByEngineer[entry.konstrukter] = monthly;
    }

    const mapPartial = (items: typeof overallPartial) => Object.entries(items)
      .map(([name, stats]) => ({
        name,
        weeks_partial: stats.weeks,
        avg_project_hours_per_week: Math.round(stats.totalProjectHours / stats.weeks),
        min_project_hours_per_week: stats.minProjectHours,
        max_free_capacity_hours_per_week: stats.maxFreeCapacity,
        projects: Array.from(stats.projects).sort(),
        examples: 'examples' in stats ? stats.examples : undefined,
      }))
      .sort((a, b) => a.avg_project_hours_per_week - b.avg_project_hours_per_week || b.weeks_partial - a.weeks_partial);

    const months = Object.entries(byMonth).map(([month, stats]) => ({
      month,
      partial_engineers: mapPartial(stats.partialByEngineer as typeof overallPartial),
      free_engineers: Object.entries(stats.freeByEngineer)
        .map(([name, hours]) => ({ name, free_hours: Math.round(hours) }))
        .sort((a, b) => b.free_hours - a.free_hours),
    }));

    return {
      partial_definition: `Partially utilized = project allocation >0 and <=${PARTIAL_UTILIZATION_THRESHOLD} Mh/week. Example: 20Mh/week counts.`,
      visible_engineers_count: visibleEngineerSet.size,
      visible_weeks_count: visibleWeekSet?.size || null,
      overall_partial_engineers: mapPartial(overallPartial),
      months,
    };
  }, [planningData, visibleEngineerNames, visibleWeeks]);

  const callAI = async (q: string) => {
    setLoading(true);
    setError('');
    setAnalysis('');
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-revenue-analyze`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ data: { planningHistoryStats: historyStats, planningSummary }, question: q }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setAnalysis(json.analysis || '');
    } catch (e: any) {
      setError(e.message || 'Failed to get AI analysis');
    } finally {
      setLoading(false);
    }
  };

  const presets = [
    {
      label: 'Planning History (30d)',
      question: `Summarize the last 30 days of planning changes from planningHistoryStats. Explain allocations, deallocations, net change, net allocation ratio and stability index for team health. Highlight top engineers by net change and give concrete recent examples.`,
    },
    {
      label: 'Team Stability',
      question: `Assess team stability using planningHistoryStats. Are we adding more work than we lose? Which engineers churn the most? Any warning signs?`,
    },
    {
      label: 'Partial Capacity',
      question: `List partially utilized engineers from planningSummary.overall_partial_engineers. Include engineers with 20Mh/week, 25Mh/week or any project allocation <=35Mh/week. Show name, avg_project_hours_per_week, weeks_partial, max_free_capacity_hours_per_week and example weeks/projects. Do not answer only with FREE engineers.`,
    },
  ];

  return (
    <Card className="shadow-card-custom">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          Planning AI Analyst (RAIL+EL, last 30 days)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {presets.map(p => (
            <Button key={p.label} variant="outline" size="sm" onClick={() => callAI(p.question)} disabled={loading}>
              {p.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Ask about planning history, allocations, team stability..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && question.trim()) callAI(question.trim()); }}
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={() => question.trim() && callAI(question.trim())} disabled={loading || !question.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ask'}
          </Button>
        </div>
        {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">{error}</div>}
        {analysis && (
          <div className="bg-muted/50 p-4 rounded-md border">
            <Label className="text-xs text-muted-foreground mb-2 block">AI Analysis</Label>
            <div className="text-sm whitespace-pre-wrap leading-relaxed">{analysis}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
