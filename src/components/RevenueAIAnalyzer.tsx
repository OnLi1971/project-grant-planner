import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2 } from 'lucide-react';
import type { PlanningEntry } from '@/types/planning';

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
      label: 'Compare Q3 & Q4',
      question: `Compare Q3 and Q4 revenue. Identify key differences, growth/decline drivers, and highlight top projects in each quarter.`,
    },
    {
      label: 'Top Projects',
      question: `Analyze the top projects by revenue. What are the main revenue drivers and which projects contribute most?`,
    },
    {
      label: 'Trend Analysis',
      question: `Describe the revenue trend over the displayed periods. What patterns, risks, or opportunities do you see?`,
    },
  ];

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
