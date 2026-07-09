import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { RAIL_EL_ENGINEERS } from '@/constants/railElEngineers';
import { normalizeName } from '@/utils/nameNormalization';

export const PlanningAIAnalyzer: React.FC = () => {
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
          body: JSON.stringify({ data: { planningHistoryStats: historyStats }, question: q }),
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
