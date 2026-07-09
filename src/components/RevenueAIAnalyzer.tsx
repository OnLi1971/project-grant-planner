import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, GitCompare } from 'lucide-react';
import type { PlanningEntry } from '@/types/planning';
import { RAIL_EL_ENGINEERS } from '@/constants/railElEngineers';
import { normalizeName } from '@/utils/nameNormalization';

interface RevenueAIAnalyzerProps {
  chartData: any[];
  projects: { id: string; code: string; name: string; project_status?: string; probability?: number; presales_phase?: string }[];
  viewType: 'mesic' | 'kvartal';
  displayUnit: 'kc' | 'hodiny';
  currency: 'CZK' | 'USD';
  selectedQuarters: string[];
  selectedMonths: string[];
  planningData?: PlanningEntry[];
}

export const RevenueAIAnalyzer: React.FC<RevenueAIAnalyzerProps> = ({
  chartData,
  projects,
  viewType,
  displayUnit,
  currency,
  selectedQuarters,
  selectedMonths,
  planningData,
}) => {
  const [question, setQuestion] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [compareA, setCompareA] = useState<string>('');
  const [compareB, setCompareB] = useState<string>('');

  const periodOptions = useMemo(
    () => chartData.map((d: any) => d.month).filter(Boolean),
    [chartData]
  );
  const periodLabel = viewType === 'kvartal' ? 'quarters' : 'months';

  // Aggregate planning data per month so AI can correlate revenue dips with
  // vacations/sick leave/free capacity (e.g. Christmas in December).
  const planningSummary = useMemo(() => {
    if (!planningData || planningData.length === 0) return [];
    const allowed = new Set(RAIL_EL_ENGINEERS.map(n => normalizeName(n)));
    const filtered = planningData.filter(e => allowed.has(normalizeName(e.konstrukter)));
    if (filtered.length === 0) return [];
    const byMonth: Record<string, {
      total: number; project: number; vacation: number; sick: number;
      free: number; over: number;
      vacationEngineers: Set<string>;
      freeByEngineer: Record<string, number>;
      vacationByEngineer: Record<string, number>;
    }> = {};
    for (const e of filtered) {
      const m = e.mesic;
      if (!m) continue;
      if (!byMonth[m]) byMonth[m] = { total: 0, project: 0, vacation: 0, sick: 0, free: 0, over: 0, vacationEngineers: new Set(), freeByEngineer: {}, vacationByEngineer: {} };
      const h = e.mhTyden || 0;
      const p = (e.projekt || '').toUpperCase();
      byMonth[m].total += h;
      if (p === 'DOVOLENÁ' || p === 'DOVOLENA') {
        byMonth[m].vacation += h;
        byMonth[m].vacationEngineers.add(e.konstrukter);
        byMonth[m].vacationByEngineer[e.konstrukter] = (byMonth[m].vacationByEngineer[e.konstrukter] || 0) + h;
      }
      else if (p === 'NEMOC') byMonth[m].sick += h;
      else if (p === 'FREE') {
        byMonth[m].free += h;
        byMonth[m].freeByEngineer[e.konstrukter] = (byMonth[m].freeByEngineer[e.konstrukter] || 0) + h;
      }
      else if (p === 'OVER') byMonth[m].over += h;
      else byMonth[m].project += h;
    }
    return Object.entries(byMonth).map(([month, v]) => ({
      month,
      total_planned_hours: Math.round(v.total),
      billable_project_hours: Math.round(v.project),
      vacation_hours: Math.round(v.vacation),
      sick_hours: Math.round(v.sick),
      free_hours: Math.round(v.free),
      overtime_hours: Math.round(v.over),
      engineers_on_vacation: v.vacationEngineers.size,
      free_engineers: Object.entries(v.freeByEngineer)
        .map(([name, hours]) => ({ name, hours: Math.round(hours) }))
        .sort((a, b) => b.hours - a.hours),
      vacation_engineers: Object.entries(v.vacationByEngineer)
        .map(([name, hours]) => ({ name, hours: Math.round(hours) }))
        .sort((a, b) => b.hours - a.hours),
    }));
  }, [planningData]);

  const callAI = async (q: string) => {
    setLoading(true);
    setError('');
    setAnalysis('');
    try {
      const dataPayload = {
        chartData,
        projects: projects.map(p => ({
          code: p.code,
          name: p.name,
          status: p.project_status,
          probability: p.probability,
          phase: p.presales_phase,
        })),
        viewType,
        displayUnit,
        currency,
        selectedQuarters,
        selectedMonths,
        planningSummary,
      };


      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-revenue-analyze`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ data: dataPayload, question: q }),
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
      label: 'Top Projects',
      question: `Analyze the top projects by revenue. What are the main revenue drivers and which projects contribute most?`,
    },
    {
      label: 'Trend Analysis',
      question: `Describe the revenue trend over the displayed periods. What patterns, risks, or opportunities do you see?`,
    },
  ];

  const runCompare = () => {
    if (!compareA || !compareB) return;
    callAI(
      `Compare ${compareA} and ${compareB} revenue. Identify key differences, growth/decline drivers, and highlight top projects in each period. Correlate with planning data (vacations, sick leave, free capacity) if relevant.`
    );
  };

  return (
    <Card className="shadow-card-custom">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Analyst
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <Button
              key={p.label}
              variant="outline"
              size="sm"
              onClick={() => callAI(p.question)}
              disabled={loading}
            >
              {p.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 p-3 rounded-md border bg-muted/30">
          <GitCompare className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Compare {periodLabel}:</span>
          <Select value={compareA} onValueChange={setCompareA} disabled={loading}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="Select A" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((o) => (
                <SelectItem key={`a-${o}`} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">vs</span>
          <Select value={compareB} onValueChange={setCompareB} disabled={loading}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder="Select B" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((o) => (
                <SelectItem key={`b-${o}`} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={runCompare}
            disabled={loading || !compareA || !compareB || compareA === compareB}
          >
            Compare
          </Button>
        </div>


        <div className="flex gap-2">
          <Input
            placeholder="Ask anything about revenue..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && question.trim()) {
                callAI(question.trim());
              }
            }}
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={() => question.trim() && callAI(question.trim())}
            disabled={loading || !question.trim()}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ask'}
          </Button>
        </div>

        {error && (
          <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {analysis && (
          <div className="bg-muted/50 p-4 rounded-md border">
            <Label className="text-xs text-muted-foreground mb-2 block">AI Analysis</Label>
            <div className="text-sm whitespace-pre-wrap leading-relaxed">
              {analysis}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
