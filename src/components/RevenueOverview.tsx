import React, { useState, useMemo } from 'react';
import { usePlanning } from '@/contexts/PlanningContext';
import { projects, customers, programs } from '@/data/projectsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Filter } from 'lucide-react';

export const RevenueOverview = () => {
  const { planningData } = usePlanning();
  const [filterType, setFilterType] = useState<'all' | 'customer' | 'program' | 'project'>('all');
  const [filterValue, setFilterValue] = useState<string>('all');

  // Funkce pro výpočet počtu dnů v měsíci
  const getDaysInMonth = (month: string, year: number = 2024): number => {
    const monthMapping: { [key: string]: number } = {
      'August': 8,
      'September': 9,
      'October': 10,
      'November': 11,
      'December': 12
    };
    
    const monthNum = monthMapping[month];
    return new Date(year, monthNum, 0).getDate();
  };

  // Funkce pro výpočet pracovních dnů v měsíci (5 dnů v týdnu)
  const getWorkingDaysInMonth = (month: string): number => {
    const totalDays = getDaysInMonth(month);
    // Přibližný výpočet: 5/7 ze všech dnů (pondělí-pátek)
    return Math.round((totalDays * 5) / 7);
  };

  // Mapování kalendářních týdnů na měsíce
  const weekToMonthMapping: { [key: string]: string } = {
    'CW32': 'August', 'CW33': 'August', 'CW34': 'August', 'CW35': 'August',
    'CW36': 'September', 'CW37': 'September', 'CW38': 'September', 'CW39': 'September',
    'CW40': 'October', 'CW41': 'October', 'CW42': 'October', 'CW43': 'October', 'CW44': 'October',
    'CW45': 'November', 'CW46': 'November', 'CW47': 'November', 'CW48': 'November',
    'CW49': 'December', 'CW50': 'December', 'CW51': 'December', 'CW52': 'December'
  };

  // Filtrovaná data podle vybraného filtru
  const filteredData = useMemo(() => {
    if (filterType === 'all' || filterValue === 'all') {
      return planningData;
    }

    return planningData.filter(entry => {
      const project = projects.find(p => p.code === entry.projekt);
      if (!project) return false;

      switch (filterType) {
        case 'customer':
          return project.customerId === filterValue;
        case 'program':
          return project.programId === filterValue;
        case 'project':
          return project.id === filterValue;
        default:
          return true;
      }
    });
  }, [planningData, filterType, filterValue]);

  // Výpočet revenue po měsících s filtrováním
  const calculateMonthlyRevenue = (data = filteredData) => {
    const monthlyRevenue: { [month: string]: number } = {};

    // Spočítáme revenue pro každý měsíc
    Object.keys(weekToMonthMapping).forEach(week => {
      const month = weekToMonthMapping[week];
      if (!monthlyRevenue[month]) {
        monthlyRevenue[month] = 0;
      }
    });

    // Projdeme všechny záznamy v plánovacích datech
    data.forEach(entry => {
      const month = weekToMonthMapping[entry.cw];
      if (!month || entry.mhTyden === 0) return;

      // Najdeme projekt podle kódu
      const project = projects.find(p => p.code === entry.projekt);
      if (!project) return;

      let hourlyRate = 0;
      
      // Určíme hodinovou sazbu podle typu projektu
      if (project.projectType === 'WP' && project.averageHourlyRate) {
        hourlyRate = project.averageHourlyRate;
      } else if (project.projectType === 'Hodinovka' && project.budget) {
        hourlyRate = project.budget;
      }

      // Přičteme týdenní revenue k měsíčnímu součtu
      monthlyRevenue[month] += entry.mhTyden * hourlyRate;
    });

    return monthlyRevenue;
  };

  const monthlyRevenue = calculateMonthlyRevenue();
  const months = ['August', 'September', 'October', 'November', 'December'];
  const totalRevenue = Object.values(monthlyRevenue).reduce((sum, revenue) => sum + revenue, 0);

  // Data pro graf
  const chartData = months.map(month => ({
    month: month.slice(0, 3), // Zkrácené názvy měsíců
    revenue: monthlyRevenue[month] || 0,
    revenueFormatted: (monthlyRevenue[month] || 0).toLocaleString('cs-CZ')
  }));

  // Možnosti pro filtrování
  const getFilterOptions = () => {
    switch (filterType) {
      case 'customer':
        return customers.map(c => ({ value: c.id, label: c.name }));
      case 'program':
        return programs.map(p => ({ value: p.id, label: p.name }));
      case 'project':
        return projects.filter(p => p.projectType === 'WP' && p.averageHourlyRate).map(p => ({ value: p.id, label: p.name }));
      default:
        return [];
    }
  };

  const filterOptions = getFilterOptions();

  // Reset filter value when filter type changes
  const handleFilterTypeChange = (value: string) => {
    setFilterType(value as any);
    setFilterValue('all');
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card-custom">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Revenue - Obrat po měsících
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Label className="font-medium">Filtrovat podle:</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="filterType">Typ filtru</Label>
                <Select value={filterType} onValueChange={handleFilterTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Vše</SelectItem>
                    <SelectItem value="customer">Zákazník</SelectItem>
                    <SelectItem value="program">Program</SelectItem>
                    <SelectItem value="project">Projekt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {filterType !== 'all' && (
                <div>
                  <Label htmlFor="filterValue">Hodnota</Label>
                  <Select value={filterValue} onValueChange={setFilterValue}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Vše</SelectItem>
                      {filterOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Celkový obrat */}
          <div className="mb-6">
            <div className="text-2xl font-bold text-primary">
              Celkový obrat: {totalRevenue.toLocaleString('cs-CZ')} Kč
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {filterType !== 'all' && filterValue !== 'all' 
                ? `Filtrováno podle: ${filterType === 'customer' ? 'zákazník' : filterType === 'program' ? 'program' : 'projekt'}`
                : 'Všechny projekty s revenue'
              }
            </p>
          </div>

          {/* Graf */}
          <div className="h-80 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis 
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toLocaleString('cs-CZ')} Kč`, 'Revenue']}
                  labelFormatter={(label) => `Měsíc: ${label}`}
                />
                <Legend />
                <Bar 
                  dataKey="revenue" 
                  fill="hsl(var(--primary))" 
                  name="Revenue (Kč)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailní tabulka */}
      <Card className="shadow-card-custom">
        <CardHeader>
          <CardTitle>Detailní rozpis</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Měsíc</TableHead>
                <TableHead>Pracovní dny</TableHead>
                <TableHead>Kalendářní dny</TableHead>
                <TableHead className="text-right">Obrat (Kč)</TableHead>
                <TableHead className="text-right">% z celku</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {months.map((month) => {
                const revenue = monthlyRevenue[month] || 0;
                const percentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
                const workingDays = getWorkingDaysInMonth(month);
                const totalDays = getDaysInMonth(month);

                return (
                  <TableRow key={month}>
                    <TableCell className="font-medium">{month}</TableCell>
                    <TableCell>{workingDays}</TableCell>
                    <TableCell>{totalDays}</TableCell>
                    <TableCell className="text-right font-mono">
                      {revenue.toLocaleString('cs-CZ')} Kč
                    </TableCell>
                    <TableCell className="text-right">
                      {percentage.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Metodika výpočtu:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Týdenní hodiny se násobí hodinovou sazbou projektu</li>
              <li>• WP projekty používají průměrnou hodinovou cenu (pokud je zadána)</li>
              <li>• Hodinovky používají zadanou hodinovou cenu</li>
              <li>• Projekty bez sazby (FREE, DOVOLENÁ) se nezapočítávají do revenue</li>
              <li>• Filtrování umožňuje zobrazit revenue pouze pro vybrané zákazníky, programy nebo projekty</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};