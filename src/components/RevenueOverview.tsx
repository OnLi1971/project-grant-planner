import React from 'react';
import { usePlanning } from '@/contexts/PlanningContext';
import { projects } from '@/data/projectsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const RevenueOverview = () => {
  const { planningData } = usePlanning();

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

  // Výpočet revenue po měsících
  const calculateMonthlyRevenue = () => {
    const monthlyRevenue: { [month: string]: number } = {};

    // Spočítáme revenue pro každý měsíc
    Object.keys(weekToMonthMapping).forEach(week => {
      const month = weekToMonthMapping[week];
      if (!monthlyRevenue[month]) {
        monthlyRevenue[month] = 0;
      }
    });

    // Projdeme všechny záznamy v plánovacích datech
    planningData.forEach(entry => {
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

  return (
    <Card className="shadow-card-custom">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💰 Revenue - Obrat po měsících
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="text-2xl font-bold text-primary">
            Celkový obrat: {totalRevenue.toLocaleString('cs-CZ')} Kč
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Výpočet zahrnuje přepočet týdenních hodin na měsíční podle pracovních dnů
          </p>
        </div>

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
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};