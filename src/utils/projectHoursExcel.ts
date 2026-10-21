import ExcelJS from 'exceljs';

export interface ExcelCellSnapshot {
  value: string | number;
  background: string;
  color: string;
  bold: boolean;
  italic: boolean;
  align: 'left' | 'center';
  colSpan: number;
  format?: string;
  total?: boolean;
}

export const COL_A = 47;
export const COL_PERIOD = 12.15; // ≈ 90 px, same as the app's month columns
export const COL_PERIOD_PX = COL_PERIOD * 7 + 5;
const ROW_PX = 20;
export interface ChartImages {
  base64: string; width: number; height: number;
  axis?: string; axisWidth?: number; plotHeight?: number;
  legend?: string; legendWidth?: number; legendHeight?: number; periods?: number;
}

export async function projectHoursWorkbook(rows: ExcelCellSnapshot[][], headerRows: number, chart: ChartImages) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Project Grant Planner';
  const sheet = workbook.addWorksheet('Project Hours Matrix', {
    views: [{ state: 'frozen', xSplit: 1, ySplit: headerRows }],
    pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  rows.forEach((row, index) => {
    let column = 1;
    row.forEach(item => {
      const cell = sheet.getCell(index + 1, column);
      cell.value = item.value;
      if (item.total && typeof item.value === 'number' && column > 2) {
        cell.value = { formula: `SUM(B${index + 1}:${sheet.getColumn(column - 1).letter}${index + 1})`, result: item.value };
      }
      cell.font = { name: 'Arial', size: 10, color: { argb: item.color }, bold: item.bold, italic: item.italic };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: item.background } };
      cell.alignment = { horizontal: item.align, vertical: 'middle', wrapText: true };
      const border = { style: 'thin' as const, color: { argb: 'FFD1D5DB' } };
      cell.border = { top: border, bottom: border, left: border, right: border };
      cell.numFmt = item.format || '#,##0.0;-#,##0.0;"–"';
      if (item.colSpan > 1) sheet.mergeCells(index + 1, column, index + 1, column + item.colSpan - 1);
      column += item.colSpan;
    });
    sheet.getRow(index + 1).height = index < headerRows ? 34 : 24;
  });
  sheet.getColumn(1).width = COL_A;
  for (let column = 2; column <= sheet.columnCount; column++) sheet.getColumn(column).width = COL_PERIOD;
  const chartRow = rows.length + 3;
  sheet.getCell(chartRow, 1).value = 'Capacity vs. demand [FTE]';
  sheet.getCell(chartRow, 1).font = { name: 'Arial', bold: true, size: 14 };
  const id = workbook.addImage({ base64: chart.base64, extension: 'png' });
  if (chart.axisWidth && chart.periods) {
    // One image anchored cell-to-cell: Excel scales it to exactly column A + N period columns,
    // and column A gets the same width ratio as the chart's axis area, so bars sit under their months.
    const colPx = (chart.width - chart.axisWidth) / chart.periods;
    sheet.getColumn(1).width = Math.max(20, COL_PERIOD * chart.axisWidth / colPx);
    const plotH = chart.plotHeight || chart.height;
    const top = chartRow;
    const span = Math.max(1, Math.round(plotH / ROW_PX));
    for (let r = top + 1; r <= top + span + 1; r++) sheet.getRow(r).height = 15;
    sheet.addImage(id, { tl: { col: 0, row: top }, br: { col: 1 + chart.periods, row: top + span }, editAs: 'twoCell' } as never);
    const legendRow = top + span + 2;
    const legend: [string, string][] = [['■ Delivery', 'FF1D4ED8'], ['▨ Presales', 'FF64748B'], ['━ Max engineers available', 'FFDC2626']];
    legend.forEach(([text, color], i) => {
      const cell = sheet.getCell(legendRow, 2 + i * 2);
      cell.value = text;
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: color } };
    });
  } else {
    sheet.addImage(id, { tl: { col: 0, row: chartRow }, ext: { width: chart.width, height: chart.height }, editAs: 'oneCell' });
  }
  return workbook;
}

// Composite translucent UI colors over their actual parent backgrounds.
function opaqueColor(element: Element, property: 'color' | 'backgroundColor'): string {
  const chain: Element[] = [];
  for (let node: Element | null = element; node; node = node.parentElement) chain.unshift(node);
  let rgb = [255, 255, 255];
  chain.forEach(node => {
    const value = getComputedStyle(node).backgroundColor;
    const parts = value.match(/[\d.]+/g)?.map(Number);
    if (parts && parts.length >= 3) {
      const alpha = parts[3] ?? 1;
      rgb = rgb.map((c, i) => Math.round(parts[i] * alpha + c * (1 - alpha)));
    }
  });
  if (property === 'color') {
    const parts = getComputedStyle(element).color.match(/[\d.]+/g)?.map(Number);
    if (parts && parts.length >= 3) rgb = rgb.map((c, i) => Math.round(parts[i] * (parts[3] ?? 1) + c * (1 - (parts[3] ?? 1))));
  }
  return `FF${rgb.map(c => c.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

export async function exportProjectHours(table: HTMLTableElement, chart: HTMLElement): Promise<Blob> {
  await document.fonts.ready;
  const rows = Array.from(table.rows).map(row => Array.from(row.cells).map(cell => {
    const badge = cell.querySelector('[data-project]');
    const source = badge || cell;
    const style = getComputedStyle(source);
    const numeric = cell.dataset.excelValue;
    return {
      value: numeric === undefined ? cell.innerText : Number(numeric),
      background: opaqueColor(source, 'backgroundColor'), color: opaqueColor(source, 'color'),
      bold: Number(style.fontWeight) >= 600, italic: style.fontStyle === 'italic',
      align: cell.cellIndex === 0 ? 'left' as const : 'center' as const,
      colSpan: cell.colSpan, format: cell.dataset.excelFormat, total: cell.dataset.excelTotal === 'true',
    };
  }));
  const { default: html2canvas } = await import('html2canvas-pro');
  const periods = chart.querySelectorAll('.recharts-xAxis .recharts-cartesian-axis-tick').length;
  // Temporarily resize the chart so each bar band equals one Excel period column (no stretching).
  const original = chart.style.width;
  const gridOf = () => chart.querySelector('.recharts-cartesian-grid')?.getBoundingClientRect();
  const before = gridOf();
  const scroller = chart.querySelector<HTMLElement>('[data-chart-scroll]');
  const scrollerStyle = scroller?.getAttribute('style') ?? null;
  if (scroller) {
    // Aligned chart: reveal its full width instead of the scrolled viewport.
    scroller.style.overflow = 'visible'; scroller.style.width = 'max-content';
    chart.style.width = 'max-content';
  } else if (before && periods > 0) {
    chart.style.width = `${chart.getBoundingClientRect().width - before.width + periods * COL_PERIOD_PX}px`;
    await new Promise(r => setTimeout(r, 400));
  }
  try {
    const canvas = await html2canvas(chart, {
      scale: 2, backgroundColor: '#ffffff',
      onclone: (_document, clone) => {
        clone.querySelectorAll('.recharts-tooltip-wrapper').forEach(node => node.remove());
      },
    });
    const box = chart.getBoundingClientRect();
    const grid = gridOf();
    const xAxis = chart.querySelector('.recharts-xAxis')?.getBoundingClientRect();
    let payload: ChartImages = { base64: canvas.toDataURL('image/png'), width: canvas.width / 2, height: canvas.height / 2 };
    if (grid && grid.width > 0 && periods > 0) {
      const crop = (x: number, y: number, w: number, h: number) => {
        const out = document.createElement('canvas');
        out.width = Math.max(1, Math.round(w * 2)); out.height = Math.max(1, Math.round(h * 2));
        out.getContext('2d')!.drawImage(canvas, Math.round(x * 2), Math.round(y * 2), out.width, out.height, 0, 0, out.width, out.height);
        return out.toDataURL('image/png');
      };
      const left = grid.left - box.left;
      const plotBottom = Math.max(grid.bottom, xAxis?.bottom ?? grid.bottom) - box.top + 4;
      const fullW = left + grid.width;
      payload = {
        ...payload,
        axisWidth: left, plotHeight: plotBottom,
        base64: crop(0, 0, fullW, plotBottom), width: fullW,
        periods,
      };
    }
    const workbook = await projectHoursWorkbook(rows, table.tHead?.rows.length || 1, payload);
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  } finally {
    chart.style.width = original;
    if (scroller) { if (scrollerStyle === null) scroller.removeAttribute('style'); else scroller.setAttribute('style', scrollerStyle); }
  }
}

export async function downloadProjectHours(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type });
  if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: filename }); return; }
    catch (error) { if ((error as DOMException).name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}