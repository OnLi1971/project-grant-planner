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
export const COL_PERIOD = 14;
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
      cell.numFmt = item.format || '#,##0.0;(#,##0.0);"–"';
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
  if (chart.axis && chart.legend && chart.periods) {
    // Bars sit exactly under their period columns: axis right-aligned in column A, plot from column B, legend below.
    const colAPx = COL_A * 7 + 5;
    const axisW = Math.min(chart.axisWidth || 60, colAPx);
    const plotH = chart.plotHeight || chart.height;
    const top = chartRow;
    sheet.addImage(workbook.addImage({ base64: chart.axis, extension: 'png' }), { tl: { col: 1 - axisW / colAPx, row: top }, ext: { width: axisW, height: plotH }, editAs: 'oneCell' });
    sheet.addImage(id, { tl: { col: 1, row: top }, ext: { width: chart.width, height: plotH }, editAs: 'oneCell' });
    sheet.addImage(workbook.addImage({ base64: chart.legend, extension: 'png' }), { tl: { col: 1, row: top + plotH / ROW_PX + 0.3 }, ext: { width: chart.legendWidth || 300, height: chart.legendHeight || 30 }, editAs: 'oneCell' });
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
  if (before && periods > 0) {
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
    const legendEl = chart.querySelector('.recharts-legend-wrapper') as HTMLElement | null;
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
      const lg = legendEl?.getBoundingClientRect();
      const legendTop = lg ? lg.top - box.top : plotBottom;
      const legendH = lg ? lg.height : box.height - plotBottom;
      const legendW = lg ? lg.width : grid.width;
      const legendX = lg ? lg.left - box.left : left;
      payload = {
        ...payload,
        axis: crop(0, 0, left, plotBottom), axisWidth: left, plotHeight: plotBottom,
        base64: crop(left, 0, grid.width, plotBottom), width: grid.width,
        legend: crop(legendX, legendTop, legendW, legendH), legendWidth: legendW, legendHeight: legendH,
        periods,
      };
    }
    const workbook = await projectHoursWorkbook(rows, table.tHead?.rows.length || 1, payload);
    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  } finally {
    chart.style.width = original;
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