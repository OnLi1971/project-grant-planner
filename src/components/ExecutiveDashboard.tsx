import React, { useState, useMemo, useEffect } from 'react';
import { usePlanning } from '@/contexts/PlanningContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target, Calendar, Award, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getWeekToMonthFractions } from '@/utils/workingDays';

interface DatabaseProject {
  id: string;
  name: string;
  code: string;
  customer_id: string;
  project_manager_id: string;
  program_id: string;
  project_type: string;
  budget?: number;
  hourly_rate?: number;
  average_hourly_rate?: number;
  project_status?: string;
  probability?: number;
  presales_phase?: string;
  presales_start_date?: string;
  presales_end_date?: string;
}

interface DatabaseCustomer {
  id: string;
  name: string;
  code: string;
}

interface DatabaseProgram {
  id: string;
  name: string;
  code: string;
}

export const ExecutiveDashboard = () => {
  const { planningData } = usePlanning();
  const [currency, setCurrency] = useState<'CZK' | 'USD'>('CZK');
  const [timePeriod, setTimePeriod] = useState<'current' | 'ytd' | 'quarter'>('current');
  const [projects, setProjects] = useState<DatabaseProject[]>([]);
  const [customers, setCustomers] = useState<DatabaseCustomer[]>([]);
  const [programs, setPrograms] = useState<DatabaseProgram[]>([]);
  const [loading, setLoading] = useState(true);

  const exchangeRate = 23;

  const formatCurrency = (value: number): string => {
    if (currency === 'USD') {
      const usdValue = value / exchangeRate;
      return `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    return `${value.toLocaleString('cs-CZ')} Kč`;
  };

  const formatShort = (value: number): string => {
    if (currency === 'USD') {
      const usdValue = value / exchangeRate;
      if (usdValue >= 1_000_000) return `$${(usdValue / 1_000_000).toFixed(1)}M`;
      if (usdValue >= 1_000) return `$${Math.round(usdValue / 1_000)}k`;
      return `$${Math.round(usdValue)}`;
    }
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M Kč`;
    if (value >= 1_000) return `${Math.round(value / 1_000)}k Kč`;
    return `${Math.round(value)} Kč`;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsResponse, customersResponse, programsResponse] = await Promise.all([
        supabase.from('projects').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('programs').select('*')
      ]);

      if (projectsResponse.data) setProjects(projectsResponse.data);
      if (customersResponse.data) setCustomers(customersResponse.data);
      if (programsResponse.data) setPrograms(programsResponse.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  // Dynamic week-to-month mapping using shared utility
  const getWeekMapping = (cw: number, year: number): { [month: string]: number } => {
    const cwKey = year === 2025 ? `CW${cw}` : `CW${String(cw).padStart(2, '0')}-${year}`;
    const fractions = getWeekToMonthFractions(cwKey);
    if (fractions.length === 0) return {};
    const result: { [month: string]: number } = {};
    fractions.forEach(f => { result[f.monthKey] = f.fraction; });
    return result;
  };

  const calculateMonthlyRevenueByProject = () => {
    const monthlyData: { [key: string]: { [projectCode: string]: number } } = {};
    
    const months = [
      'srpen_2025', 'září_2025', 'říjen_2025', 'listopad_2025', 'prosinec_2025',
      'leden_2026', 'únor_2026', 'březen_2026', 'duben_2026', 'květen_2026', 'červen_2026',
      'červenec_2026', 'srpen_2026', 'září_2026', 'říjen_2026', 'listopad_2026', 'prosinec_2026'
    ];
    
    months.forEach(month => {
      monthlyData[month] = {};
    });

    // Seznam neproduktivních aktivit, které negenerují zisk
    const nonRevenueActivities = ['FREE', 'Dovolena', 'DOVOLENÁ', 'Nemoc', 'NEMOC', 'Školení', 'ŠKOLENÍ', 'Interní', 'INTERNÍ'];

    planningData.forEach(entry => {
      const projekt = entry.projekt?.trim();
      if (!projekt || projekt === '') return;
      
      // Přeskočit neproduktivní aktivity (case-insensitive porovnání)
      if (nonRevenueActivities.some(activity => 
        activity.toLowerCase() === projekt.toLowerCase()
      )) return;

      const project = projects.find(p => p.code?.trim() === projekt);
      if (!project) return;

      const cwMatch = entry.cw.toString().match(/CW(\d+)/);
      const cw = cwMatch ? parseInt(cwMatch[1]) : parseInt(entry.cw.toString());
      const yearMatch = entry.cw.toString().match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1]) : 2025;
      const mhTyden = entry.mhTyden || 0;
      const weekMapping = getWeekMapping(cw, year);
      
      if (Object.keys(weekMapping).length > 0 && mhTyden > 0) {
        Object.entries(weekMapping).forEach(([month, ratio]) => {
          const hoursForMonth = mhTyden * (ratio as number);
          let revenue = 0;

          if (project.project_type === 'WP' && project.average_hourly_rate) {
            revenue = hoursForMonth * project.average_hourly_rate;
          } else if (project.project_type === 'Hodinovka' && project.hourly_rate) {
            revenue = hoursForMonth * project.hourly_rate;
          }

          if (project.project_status === 'Pre sales' && project.probability) {
            revenue *= (project.probability / 100);
          }

          if (!monthlyData[month][projekt]) {
            monthlyData[month][projekt] = 0;
          }
          monthlyData[month][projekt] += revenue;
        });
      }
    });

    return monthlyData;
  };

  const monthlyRevenueByProject = useMemo(() => calculateMonthlyRevenueByProject(), [planningData, projects]);

  // Výpočet KPI dat
  const kpiData = useMemo(() => {
    const allMonths = [
      'srpen_2025', 'září_2025', 'říjen_2025', 'listopad_2025', 'prosinec_2025',
      'leden_2026', 'únor_2026', 'březen_2026', 'duben_2026', 'květen_2026', 'červen_2026',
      'červenec_2026', 'srpen_2026', 'září_2026', 'říjen_2026', 'listopad_2026', 'prosinec_2026'
    ];

    let currentMonths: string[] = [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    switch (timePeriod) {
      case 'current':
        // Aktuální a následující 2 měsíce
        currentMonths = allMonths.slice(0, 3);
        break;
      case 'quarter':
        // Q4 2025
        currentMonths = ['říjen_2025', 'listopad_2025', 'prosinec_2025'];
        break;
      case 'ytd':
        // Celý rozpočet 2025-2026
        currentMonths = allMonths;
        break;
    }

    let totalRevenue = 0;
    let realizaceRevenue = 0;
    let presalesRevenue = 0;
    const projectRevenues: { [key: string]: number } = {};

    currentMonths.forEach(month => {
      const monthData = monthlyRevenueByProject[month] || {};
      Object.entries(monthData).forEach(([projectCode, revenue]) => {
        totalRevenue += revenue;
        projectRevenues[projectCode] = (projectRevenues[projectCode] || 0) + revenue;
        
        const project = projects.find(p => p.code === projectCode);
        if (project?.project_status === 'Pre sales') {
          presalesRevenue += revenue;
        } else {
          realizaceRevenue += revenue;
        }
      });
    });

    const topProjects = Object.entries(projectRevenues)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([code, revenue]) => {
        const project = projects.find(p => p.code === code);
        return {
          code,
          name: project?.name || code,
          revenue,
          customer: customers.find(c => c.id === project?.customer_id)?.name || 'N/A'
        };
      });

    return {
      totalRevenue,
      realizaceRevenue,
      presalesRevenue,
      topProjects,
      realizacePercentage: totalRevenue > 0 ? (realizaceRevenue / totalRevenue) * 100 : 0,
      presalesPercentage: totalRevenue > 0 ? (presalesRevenue / totalRevenue) * 100 : 0
    };
  }, [monthlyRevenueByProject, projects, customers, timePeriod]);

  // Data pro trend graf
  const trendData = useMemo(() => {
    const months = ['srpen_2025', 'září_2025', 'říjen_2025', 'listopad_2025', 'prosinec_2025', 'leden_2026'];
    return months.map(month => {
      const monthData = monthlyRevenueByProject[month] || {};
      const total = Object.values(monthData).reduce((sum, value) => sum + value, 0);
      const monthLabels: { [key: string]: string } = {
        'srpen_2025': 'Srp', 'září_2025': 'Zář', 'říjen_2025': 'Říj', 
        'listopad_2025': 'Lis', 'prosinec_2025': 'Pro', 'leden_2026': 'Led'
      };
      return {
        month: monthLabels[month],
        revenue: total
      };
    });
  }, [monthlyRevenueByProject]);

  // Data pro pie chart
  const pieData = [
    { name: 'Realizace', value: kpiData.realizaceRevenue, fill: 'hsl(var(--primary))' },
    { name: 'Presales', value: kpiData.presalesRevenue, fill: 'hsl(var(--secondary))' }
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-64">Načítání...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filtry */}
      <div className="flex gap-4 mb-6 items-end">
        <div className="space-y-2">
          <Label htmlFor="currency">Měna</Label>
          <Select value={currency} onValueChange={(value: 'CZK' | 'USD') => setCurrency(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CZK">CZK</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="period">Období</Label>
          <Select value={timePeriod} onValueChange={(value: 'current' | 'ytd' | 'quarter') => setTimePeriod(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Aktuální 3 měsíce</SelectItem>
              <SelectItem value="quarter">Q4 2025</SelectItem>
              <SelectItem value="ytd">Celý rok 2025-2026</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" size="sm" onClick={() => loadData()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Obnovit data
        </Button>
      </div>

      {/* KPI Karty */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celkový Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatShort(kpiData.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(kpiData.totalRevenue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Realizace</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatShort(kpiData.realizaceRevenue)}</div>
            <Progress value={kpiData.realizacePercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {kpiData.realizacePercentage.toFixed(1)}% z celkového revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatShort(kpiData.presalesRevenue)}</div>
            <Progress value={kpiData.presalesPercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {kpiData.presalesPercentage.toFixed(1)}% z celkového revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Projekt</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{kpiData.topProjects[0]?.name || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              {kpiData.topProjects[0] ? formatShort(kpiData.topProjects[0].revenue) : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grafy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <XAxis dataKey="month" />
                <YAxis tickFormatter={formatShort} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Rozdělení Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Projekty */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Projektů podle Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {kpiData.topProjects.map((project, index) => (
              <div key={project.code} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-muted-foreground">{project.customer}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatShort(project.revenue)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};