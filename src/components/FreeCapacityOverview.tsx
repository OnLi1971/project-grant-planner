import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Calendar, Filter, Download, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { usePlanning } from '@/contexts/PlanningContext';
import { getWeek } from 'date-fns';

// Funkce pro výpočet aktuálního kalendářního týdne
const getCurrentWeek = (): number => {
  return getWeek(new Date(), { weekStartsOn: 1 });
};

// Funkce pro generování týdnů od aktuálního týdne do půlky příštího roku
const getAllWeeks = (): string[] => {
  const currentWeek = getCurrentWeek();
  const startWeek = Math.max(32, currentWeek); // Začneme od aktuálního týdne, ale minimálně od CW32
  
  const weeks = [];
  // CW32-52 pro rok 2025
  for (let cw = startWeek; cw <= 52; cw++) {
    weeks.push(`CW${cw.toString().padStart(2, '0')}`);
  }
  // CW01-26 pro rok 2026
  for (let cw = 1; cw <= 26; cw++) {
    weeks.push(`CW${cw.toString().padStart(2, '0')}`);
  }
  return weeks;
};

const weeks = getAllWeeks();

const months = [
  { name: 'srpen', weeks: ['CW32', 'CW33', 'CW34', 'CW35'] },
  { name: 'září', weeks: ['CW36', 'CW37', 'CW38', 'CW39'] },
  { name: 'říjen', weeks: ['CW40', 'CW41', 'CW42', 'CW43', 'CW44'] },
  { name: 'listopad', weeks: ['CW45', 'CW46', 'CW47', 'CW48'] },
  { name: 'prosinec', weeks: ['CW49', 'CW50', 'CW51', 'CW52'] },
  { name: 'leden', weeks: ['CW01', 'CW02', 'CW03', 'CW04', 'CW05'] },
  { name: 'únor', weeks: ['CW06', 'CW07', 'CW08', 'CW09'] },
  { name: 'březen', weeks: ['CW10', 'CW11', 'CW12', 'CW13', 'CW14'] },
  { name: 'duben', weeks: ['CW15', 'CW16', 'CW17', 'CW18'] },
  { name: 'květen', weeks: ['CW19', 'CW20', 'CW21', 'CW22', 'CW23'] },
  { name: 'červen', weeks: ['CW24', 'CW25', 'CW26'] }
].map(month => ({
  ...month,
  weeks: month.weeks.filter(week => weeks.includes(week))
})).filter(month => month.weeks.length > 0);

const getProjectBadgeStyle = (projekt: string) => {
  if (!projekt || projekt === 'FREE' || projekt === 'NEMOC' || projekt === 'OVER') return 'bg-success/20 text-success border-success/30';
  if (projekt === 'DOVOLENÁ') return 'bg-accent text-accent-foreground border-accent';
  if (projekt === 'NEMOC') return 'bg-destructive/20 text-destructive border-destructive/30';
  if (projekt === 'OVER') return 'bg-warning/20 text-warning border-warning/30';
  if (projekt.startsWith('ST_')) return 'bg-primary/20 text-primary border-primary/30';
  if (projekt.startsWith('NU_')) return 'bg-warning/20 text-warning-foreground border-warning/30';
  if (projekt.startsWith('WA_')) return 'bg-success/30 text-success-foreground border-success/40';
  if (projekt.startsWith('SAF_')) return 'bg-accent/30 text-accent-foreground border-accent/40';
  if (projekt.startsWith('BUCH_')) return 'bg-muted text-muted-foreground border-muted-foreground/30';
  if (projekt.startsWith('AIRB_')) return 'bg-secondary text-secondary-foreground border-secondary';
  return 'bg-muted text-muted-foreground border-border';
};

const getProjectBadge = (projekt: string | null) => {
  if (!projekt || projekt === 'FREE') return <Badge variant="secondary" className="bg-success/20 text-success">Volný</Badge>;
  if (projekt === 'DOVOLENÁ') return <Badge variant="outline" className="border-accent">Dovolená</Badge>;
  if (projekt === 'NEMOC') return <Badge variant="outline" className="border-destructive text-destructive">Nemoc</Badge>;
  if (projekt === 'OVER') return <Badge variant="outline" className="border-warning text-warning">Režie</Badge>;
  
  return <Badge variant="outline">{projekt}</Badge>;
};

export const FreeCapacityOverview = () => {
  const { planningData } = usePlanning();
  
  // Filter states
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  
  // Debug logging to check data reactivity
  console.log('FreeCapacityOverview: planningData updated', planningData.length, 'entries');

  // Helper to extract CW number from full format (e.g., "CW08-2026" -> "CW08")
  const extractCW = (cwFull: string): string => {
    return cwFull.replace(/-\d{4}$/, '');
  };

  // Enhanced data processing with better reactivity
  const processedData = useMemo(() => {
    console.log('FreeCapacityOverview: Processing data with', planningData.length, 'entries');
    const engineersMap: { [key: string]: { cw: string; cwFull: string; projekt: string; isTentative: boolean }[] } = {};
    
    // Skupinování dat podle konstruktéra
    planningData.forEach(entry => {
      if (!engineersMap[entry.konstrukter]) {
        engineersMap[entry.konstrukter] = [];
      }
      const cwShort = extractCW(entry.cw);
      engineersMap[entry.konstrukter].push({
        cw: cwShort,
        cwFull: entry.cw,
        projekt: entry.projekt,
        isTentative: entry.is_tentative || false
      });
    });

    // Seřazení týdnů chronologicky
    Object.keys(engineersMap).forEach(engineer => {
      engineersMap[engineer].sort((a, b) => {
        const aNum = parseInt(a.cw.replace('CW', ''));
        const bNum = parseInt(b.cw.replace('CW', ''));
        return aNum - bNum;
      });
    });

    console.log('FreeCapacityOverview: Processed engineers:', Object.keys(engineersMap).length);
    return engineersMap;
  }, [planningData]);

  // Get filtered weeks based on selections
  const filteredWeeks = useMemo(() => {
    if (selectedWeeks.length > 0) {
      return selectedWeeks;
    }
    if (selectedMonths.length > 0) {
      return months
        .filter(month => selectedMonths.includes(month.name))
        .flatMap(month => month.weeks);
    }
    return weeks; // Show all weeks if no filter
  }, [selectedWeeks, selectedMonths]);

  // Filtrování inženýrů s volnými kapacitami
  const engineersWithFreeCapacity = useMemo(() => {
    return Object.keys(processedData)
      .filter(engineer => {
        const engineerData = processedData[engineer];
        // Filter by selected weeks/months
        const relevantWeeks = engineerData.filter(week => filteredWeeks.includes(week.cw));
        // Consider FREE, empty projekt, or weeks with 0 hours as free capacity
        return relevantWeeks.some(week => 
          week.projekt === 'FREE' || 
          week.projekt === '' || 
          !week.projekt
        );
      })
      .map(engineer => {
        const engineerData = processedData[engineer];
        // Filter by selected weeks/months
        const relevantWeeks = engineerData.filter(week => filteredWeeks.includes(week.cw));
        // Consider FREE, empty projekt, or weeks with 0 hours as free capacity
        const freeWeeks = relevantWeeks.filter(week => 
          week.projekt === 'FREE' || 
          week.projekt === '' || 
          !week.projekt
        );
        const totalWeeks = relevantWeeks.length;
        const busyWeeks = totalWeeks - freeWeeks.length;
        
        return {
          name: engineer,
          freeWeeks: freeWeeks.length,
          busyWeeks,
          totalWeeks,
          freePercentage: totalWeeks > 0 ? Math.round((freeWeeks.length / totalWeeks) * 100) : 0,
          weeks: engineerData
        };
      })
      .filter(engineer => engineer.totalWeeks > 0) // Only show engineers with data in selected period
      .sort((a, b) => b.freeWeeks - a.freeWeeks);
  }, [processedData, filteredWeeks]);

  // Summary statistics: total hours, final, tentative
  const summaryStats = useMemo(() => {
    const HOURS_PER_WEEK = 36;
    let totalAllocatedWeeks = 0;
    let finalWeeks = 0;
    let tentativeWeeks = 0;
    const totalEngineersSet = new Set<string>();
    const finalEngineersSet = new Set<string>();
    const tentativeEngineersSet = new Set<string>();

    engineersWithFreeCapacity.forEach(engineer => {
      const relevantWeeks = engineer.weeks.filter(week => filteredWeeks.includes(week.cw));
      relevantWeeks.forEach(week => {
        const isFree = week.projekt === 'FREE' || week.projekt === '' || !week.projekt;
        if (!isFree) {
          totalAllocatedWeeks++;
          totalEngineersSet.add(engineer.name);
          if (week.isTentative) {
            tentativeWeeks++;
            tentativeEngineersSet.add(engineer.name);
          } else {
            finalWeeks++;
            finalEngineersSet.add(engineer.name);
          }
        }
      });
    });

    return {
      totalHours: totalAllocatedWeeks * HOURS_PER_WEEK,
      finalHours: finalWeeks * HOURS_PER_WEEK,
      tentativeHours: tentativeWeeks * HOURS_PER_WEEK,
      totalWeeks: totalAllocatedWeeks,
      finalWeeks,
      tentativeWeeks,
      totalEngineers: totalEngineersSet.size,
      finalEngineers: finalEngineersSet.size,
      tentativeEngineers: tentativeEngineersSet.size,
    };
  }, [engineersWithFreeCapacity, filteredWeeks]);

  // Celkové statistiky
  const totalEngineers = Object.keys(processedData).length;
  const engineersWithFree = engineersWithFreeCapacity.length;
  const totalFreeWeeks = engineersWithFreeCapacity.reduce((sum, eng) => sum + eng.freeWeeks, 0);
  const avgFreePercentage = engineersWithFree > 0 
    ? Math.round(engineersWithFreeCapacity.reduce((sum, eng) => sum + eng.freePercentage, 0) / engineersWithFree)
    : 0;

  // Funkce pro export do Excelu
  const exportToExcel = () => {
    if (engineersWithFreeCapacity.length === 0) {
      return;
    }

    // Připravení dat pro export
    const exportData = [];
    
    // Hlavičky
    const headers = [
      'Konstruktér',
      'Volné týdny',
      'Vytížené týdny', 
      'Volná kapacita %',
      ...filteredWeeks
    ];
    exportData.push(headers);

    // Data konstruktérů
    engineersWithFreeCapacity.forEach(engineer => {
      const row = [
        engineer.name,
        engineer.freeWeeks,
        engineer.busyWeeks,
        engineer.freePercentage + '%',
        ...filteredWeeks.map(week => {
          const weekData = engineer.weeks.find(w => w.cw === week);
          const isFree = weekData?.projekt === 'FREE' || 
                         weekData?.projekt === 'NEMOC' || 
                         weekData?.projekt === 'OVER' || 
                         weekData?.projekt === '' || 
                         !weekData?.projekt;
          return isFree ? 'FREE' : (weekData?.projekt || '');
        })
      ];
      exportData.push(row);
    });

    // Vytvoření workbooku a worksheetu
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(exportData);

    // Nastavení šířky sloupců
    const columnWidths = [
      { wch: 20 }, // Konstruktér
      { wch: 12 }, // Volné týdny
      { wch: 15 }, // Vytížené týdny
      { wch: 15 }, // Volná kapacita %
      ...filteredWeeks.map(() => ({ wch: 8 })) // Týdny
    ];
    ws['!cols'] = columnWidths;

    // Přidání worksheetu do workbooku
    XLSX.utils.book_append_sheet(wb, ws, 'Volné kapacity');

    // Generování názvu souboru s aktuálním datem
    const currentDate = new Date().toISOString().split('T')[0];
    let fileName = `volne-kapacity-${currentDate}.xlsx`;
    
    // Přidání filtru do názvu souboru
    if (selectedWeeks.length > 0) {
      fileName = `volne-kapacity-${selectedWeeks.join('-')}-${currentDate}.xlsx`;
    } else if (selectedMonths.length > 0) {
      fileName = `volne-kapacity-${selectedMonths.join('-')}-${currentDate}.xlsx`;
    }

    // Export souboru
    XLSX.writeFile(wb, fileName);
  };

  // Funkce pro export do PDF
  const exportToPDF = async () => {
    if (engineersWithFreeCapacity.length === 0) {
      return;
    }

    const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
    
    // Nastavení fontu a základních stylů
    pdf.setFont('helvetica');
    
    // Hlavička
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Přehled volných kapacit konstruktérů', 20, 20);
    
    // Datum a filtry
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleDateString('cs-CZ');
    let filterText = '';
    if (selectedWeeks.length > 0) {
      filterText = ` | Filtr: ${selectedWeeks.join(', ')}`;
    } else if (selectedMonths.length > 0) {
      filterText = ` | Filtr: ${selectedMonths.join(', ')}`;
    }
    pdf.text(`Vygenerováno: ${currentDate}${filterText}`, 20, 30);
    
    // Souhrnné statistiky
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Souhrnné statistiky', 20, 45);
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Celkem konstruktérů s volnými kapacitami: ${engineersWithFree}`, 20, 55);
    pdf.text(`Celkem volných týdnů: ${totalFreeWeeks}`, 20, 62);
    pdf.text(`Průměrná volná kapacita: ${avgFreePercentage}%`, 20, 69);
    
    // Tabulka - hlavičky
    let yPos = 85;
    const colWidths = [40, 20, 25, 25]; // Konstruktér, Volné týdny, Vytížené týdny, Kapacita %
    const weekColWidth = (297 - 20 - colWidths.reduce((a, b) => a + b, 0) - 10) / filteredWeeks.length; // Zbývající prostor pro týdny
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    
    // Hlavička tabulky
    pdf.rect(20, yPos - 5, colWidths[0], 8);
    pdf.text('Konstruktér', 22, yPos);
    
    pdf.rect(20 + colWidths[0], yPos - 5, colWidths[1], 8);
    pdf.text('Volné', 22 + colWidths[0], yPos);
    
    pdf.rect(20 + colWidths[0] + colWidths[1], yPos - 5, colWidths[2], 8);
    pdf.text('Vytížené', 22 + colWidths[0] + colWidths[1], yPos);
    
    pdf.rect(20 + colWidths[0] + colWidths[1] + colWidths[2], yPos - 5, colWidths[3], 8);
    pdf.text('Kapacita %', 22 + colWidths[0] + colWidths[1] + colWidths[2], yPos);
    
    // Týdny
    let weekXPos = 20 + colWidths.reduce((a, b) => a + b, 0);
    filteredWeeks.forEach((week, index) => {
      pdf.rect(weekXPos, yPos - 5, weekColWidth, 8);
      pdf.text(week, weekXPos + 1, yPos);
      weekXPos += weekColWidth;
    });
    
    yPos += 10;
    
    // Data konstruktérů
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    
    engineersWithFreeCapacity.forEach((engineer, index) => {
      if (yPos > 190) { // Nová stránka
        pdf.addPage();
        yPos = 20;
      }
      
      // Alternující barvy řádků
      if (index % 2 === 0) {
        pdf.setFillColor(245, 245, 245);
        pdf.rect(20, yPos - 5, 297 - 40, 8, 'F');
      }
      
      // Konstruktér
      pdf.text(engineer.name.length > 25 ? engineer.name.substring(0, 22) + '...' : engineer.name, 22, yPos);
      
      // Volné týdny
      pdf.text(engineer.freeWeeks.toString(), 22 + colWidths[0], yPos);
      
      // Vytížené týdny
      pdf.text(engineer.busyWeeks.toString(), 22 + colWidths[0] + colWidths[1], yPos);
      
      // Kapacita %
      pdf.text(`${engineer.freePercentage}%`, 22 + colWidths[0] + colWidths[1] + colWidths[2], yPos);
      
      // Projekty po týdnech
      weekXPos = 20 + colWidths.reduce((a, b) => a + b, 0);
      filteredWeeks.forEach(week => {
        const weekData = engineer.weeks.find(w => w.cw === week);
        const isFree = weekData?.projekt === 'FREE' || 
                       weekData?.projekt === 'NEMOC' || 
                       weekData?.projekt === 'OVER' || 
                       weekData?.projekt === '' || 
                       !weekData?.projekt;
        
        if (isFree) {
          pdf.setTextColor(0, 128, 0); // Zelená pro volné
          pdf.text('FREE', weekXPos + 1, yPos);
        } else {
          pdf.setTextColor(0, 0, 0); // Černá pro projekty
          const projektText = weekData?.projekt || '';
          const shortProjekt = projektText.length > 6 ? projektText.substring(0, 6) : projektText;
          pdf.text(shortProjekt, weekXPos + 1, yPos);
        }
        pdf.setTextColor(0, 0, 0); // Reset barvy
        weekXPos += weekColWidth;
      });
      
      yPos += 8;
    });
    
    // Legenda na poslední stránce
    if (yPos > 150) {
      pdf.addPage();
      yPos = 20;
    } else {
      yPos += 15;
    }
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Legenda:', 20, yPos);
    
    yPos += 10;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const legendItems = [
      { code: 'FREE', desc: 'Volný týden', color: [0, 128, 0] },
      { code: 'DOVOLENÁ', desc: 'Dovolená', color: [0, 0, 255] },
      { code: 'NEMOC', desc: 'Nemoc', color: [255, 0, 0] },
      { code: 'ST_XXX', desc: 'ST projekt', color: [128, 0, 128] },
      { code: 'NU_XXX', desc: 'NUVIA projekt', color: [255, 165, 0] }
    ];
    
    legendItems.forEach((item, index) => {
      pdf.setTextColor(item.color[0], item.color[1], item.color[2]);
      pdf.text(item.code, 20, yPos);
      pdf.setTextColor(0, 0, 0);
      pdf.text(` - ${item.desc}`, 45, yPos);
      yPos += 7;
    });
    
    // Generování názvu souboru
    const currentDateStr = new Date().toISOString().split('T')[0];
    let fileName = `volne-kapacity-${currentDateStr}.pdf`;
    
    if (selectedWeeks.length > 0) {
      fileName = `volne-kapacity-${selectedWeeks.join('-')}-${currentDateStr}.pdf`;
    } else if (selectedMonths.length > 0) {
      fileName = `volne-kapacity-${selectedMonths.join('-')}-${currentDateStr}.pdf`;
    }
    
    // Uložení PDF
    pdf.save(fileName);
  };

  return (
    <div className="space-y-6 p-6 bg-background min-h-screen">

      {/* Filter Controls */}
      <Card className="p-4 shadow-card-custom">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filtrovat podle:</span>
          </div>
          
          {/* Week Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Týdny {selectedWeeks.length > 0 && `(${selectedWeeks.length})`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Vybrat týdny</h4>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedWeeks([])}
                  >
                    Zrušit
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                  {weeks.map(week => (
                    <div key={week} className="flex items-center space-x-2">
                      <Checkbox
                        id={week}
                        checked={selectedWeeks.includes(week)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedWeeks([...selectedWeeks, week]);
                            setSelectedMonths([]); // Clear month filter
                          } else {
                            setSelectedWeeks(selectedWeeks.filter(w => w !== week));
                          }
                        }}
                      />
                      <label htmlFor={week} className="text-sm">{week}</label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Month Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Měsíce {selectedMonths.length > 0 && `(${selectedMonths.length})`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Vybrat měsíce</h4>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedMonths([])}
                  >
                    Zrušit
                  </Button>
                </div>
                <div className="space-y-2">
                  {months.map(month => (
                    <div key={month.name} className="flex items-center space-x-2">
                      <Checkbox
                        id={month.name}
                        checked={selectedMonths.includes(month.name)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedMonths([...selectedMonths, month.name]);
                            setSelectedWeeks([]); // Clear week filter
                          } else {
                            setSelectedMonths(selectedMonths.filter(m => m !== month.name));
                          }
                        }}
                      />
                      <label htmlFor={month.name} className="text-sm">{month.name}</label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Clear All Filters */}
          {(selectedWeeks.length > 0 || selectedMonths.length > 0) && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setSelectedWeeks([]);
                setSelectedMonths([]);
              }}
            >
              Zrušit všechny filtry
            </Button>
          )}

          {/* Export Buttons */}
          <div className="ml-auto flex gap-2">
            <Button 
              onClick={exportToExcel}
              disabled={engineersWithFreeCapacity.length === 0}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export do Excel
            </Button>
            
            <Button 
              onClick={exportToPDF}
              disabled={engineersWithFreeCapacity.length === 0}
              className="gap-2"
              variant="outline"
            >
              <FileText className="h-4 w-4" />
              Export do PDF
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 shadow-card-custom">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Celkem hodin (alokováno)</p>
              <p className="text-2xl font-bold">{summaryStats.totalHours.toLocaleString('cs-CZ')} h</p>
              <p className="text-xs text-muted-foreground">{summaryStats.totalWeeks} týdnů · {summaryStats.totalEngineers} konstruktérů</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 shadow-card-custom">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Finální</p>
              <p className="text-2xl font-bold">{summaryStats.finalHours.toLocaleString('cs-CZ')} h</p>
              <p className="text-xs text-muted-foreground">{summaryStats.finalWeeks} týdnů · {summaryStats.finalEngineers} konstruktérů</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 shadow-card-custom">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <AlertCircle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Předběžné</p>
              <p className="text-2xl font-bold">{summaryStats.tentativeHours.toLocaleString('cs-CZ')} h</p>
              <p className="text-xs text-muted-foreground">{summaryStats.tentativeWeeks} týdnů · {summaryStats.tentativeEngineers} konstruktérů</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Engineers with Free Capacity */}
      <Card className="shadow-planning">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Konstruktéři s volnými kapacitami</h2>
          <p className="text-muted-foreground">
            Seřazeno podle počtu volných týdnů
            {selectedWeeks.length > 0 && ` (filtr: ${selectedWeeks.join(', ')})`}
            {selectedMonths.length > 0 && ` (filtr: ${selectedMonths.join(', ')})`}
          </p>
        </div>
        
        <div className="overflow-x-auto overflow-y-auto max-h-[85vh]">
          <table className="w-full">
            <thead className="bg-planning-header text-white sticky top-0 z-10">
              <tr>
                <th className="p-3 text-left font-medium sticky left-0 sticky top-0 z-20 bg-planning-header min-w-[200px]">Konstruktér</th>
                <th className="p-3 text-center font-medium min-w-[100px] sticky top-0 bg-planning-header">Volné týdny</th>
                <th className="p-3 text-center font-medium min-w-[100px] sticky top-0 bg-planning-header">Vytížené týdny</th>
                <th className="p-3 text-center font-medium min-w-[120px] sticky top-0 bg-planning-header">Volná kapacita %</th>
                {months.map(month => {
                  const monthWeeks = month.weeks.filter(week => filteredWeeks.includes(week));
                  return monthWeeks.length > 0 ? (
                    <th key={month.name} className="p-2 text-center font-medium border-l sticky top-0 bg-planning-header" colSpan={monthWeeks.length}>
                      {month.name}
                    </th>
                  ) : null;
                })}
              </tr>
              <tr className="bg-planning-header/80 sticky top-[52px] z-10">
                <th className="p-2 sticky left-0 z-20 bg-planning-header/80"></th>
                <th className="p-2 sticky top-[52px] bg-planning-header/80"></th>
                <th className="p-2 sticky top-[52px] bg-planning-header/80"></th>
                <th className="p-2 sticky top-[52px] bg-planning-header/80"></th>
                {filteredWeeks.map(week => (
                  <th key={week} className="p-1 text-xs border-l min-w-[60px] sticky top-[52px] bg-planning-header/80">
                    {week}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {engineersWithFreeCapacity.map((engineer, index) => (
                <tr 
                  key={engineer.name}
                  className={`
                    border-b transition-colors hover:bg-planning-cell-hover
                    ${index % 2 === 0 ? 'bg-planning-cell' : 'bg-planning-stripe'}
                  `}
                >
                  <td className="p-3 font-medium sticky left-0 z-10 bg-inherit border-r">
                    {engineer.name}
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant="secondary" className="bg-success/20 text-success">
                      {engineer.freeWeeks}
                    </Badge>
                  </td>
                  <td className="p-3 text-center">
                    <Badge variant="outline">
                      {engineer.busyWeeks}
                    </Badge>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-success rounded-full transition-all"
                          style={{ width: `${engineer.freePercentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{engineer.freePercentage}%</span>
                    </div>
                  </td>
                 {filteredWeeks.map(week => {
                    const weekData = engineer.weeks.find(w => w.cw === week);
                    const isFree = weekData?.projekt === 'FREE' || 
                                   weekData?.projekt === 'NEMOC' || 
                                   weekData?.projekt === 'OVER' || 
                                   weekData?.projekt === '' || 
                                   !weekData?.projekt;
                    return (
                      <td key={week} className="p-1 text-center border-l">
                         {weekData && (
                           <div className="text-xs p-1">
                             {isFree ? (
                               <div className="bg-success/20 text-success border border-success/30 px-2 py-1 rounded-md font-medium">
                                 FREE
                               </div>
                             ) : (
                               <div className={`px-2 py-1 rounded-md border ${getProjectBadgeStyle(weekData.projekt)}`}>
                                 {weekData.projekt}
                               </div>
                             )}
                           </div>
                         )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* No Free Capacity Message */}
      {engineersWithFreeCapacity.length === 0 && (
        <Card className="p-8 text-center shadow-card-custom">
          <div className="text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Žádné volné kapacity</p>
            <p className="text-sm">Všichni konstruktéři jsou momentálně plně vytíženi</p>
          </div>
        </Card>
      )}

      {/* Additional Info */}
      <Card className="p-4 shadow-card-custom">
        <div className="text-sm text-muted-foreground">
          <h3 className="font-medium text-foreground mb-2">Legenda:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-green-100 text-green-800 border border-green-300 px-2 py-1 rounded-md text-xs">FREE</div>
              <span>Volný týden</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 text-blue-800 border border-blue-300 px-2 py-1 rounded-md text-xs">DOVOLENÁ</div>
              <span>Dovolená</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-red-100 text-red-800 border border-red-300 px-2 py-1 rounded-md text-xs">NEMOC</div>
              <span>Nemoc</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-yellow-100 text-yellow-800 border border-yellow-300 px-2 py-1 rounded-md text-xs">Režie</div>
              <span>Režijní aktivity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-purple-100 text-purple-800 border border-purple-300 px-2 py-1 rounded-md text-xs">ST_XXX</div>
              <span>ST Projekt</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-orange-100 text-orange-800 border border-orange-300 px-2 py-1 rounded-md text-xs">NU_XXX</div>
              <span>NUVIA projekt</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-teal-100 text-teal-800 border border-teal-300 px-2 py-1 rounded-md text-xs">WA_XXX</div>
              <span>WABTEC projekt</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-pink-100 text-pink-800 border border-pink-300 px-2 py-1 rounded-md text-xs">SAF_XXX</div>
              <span>SAFRAN projekt</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};