import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projectHoursWorkbook, type ExcelCellSnapshot } from './projectHoursExcel';

const cell = (value: string | number, extra: Partial<ExcelCellSnapshot> = {}): ExcelCellSnapshot => ({ value, background: 'FF0369A1', color: 'FFFFFFFF', bold: false, italic: false, align: 'center', colSpan: 1, ...extra });
const chart = { base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', width: 1000, height: 420 };

test('keeps monthly numeric hours, total formula and chart on one sheet below all rows', async () => {
  const book = await projectHoursWorkbook([
    [cell('Project'), cell('Oct 26'), cell('Nov 26'), cell('Total [MH]')],
    [cell('ST_ELEKTRO'), cell(123.5), cell(40), cell(163.5, { total: true })],
    [cell('Balance [FTE]'), cell(-2.3), cell(1.4), cell('–')],
  ], 1, chart);
  assert.equal(book.worksheets.length, 1);
  const sheet = book.worksheets[0];
  assert.equal(sheet.getCell('B2').value, 123.5);
  assert.deepEqual(sheet.getCell('D2').value, { formula: 'SUM(B2:C2)', result: 163.5 });
  assert.equal(sheet.getCell('B3').value, -2.3);
  const images = sheet.getImages();
  assert.equal(images.length, 1);
  assert.ok(images[0].range.tl.row > 3);
  const bytes = await book.xlsx.writeBuffer();
  assert.ok(bytes.byteLength > 1000);
});

test('weekly export preserves month grouping and frozen header rows', async () => {
  const book = await projectHoursWorkbook([
    [cell('Project'), cell('November 2026', { colSpan: 2 }), cell('Total [MH]')],
    [cell(''), cell('CW45\n2.11.–6.11.'), cell('CW46\n9.11.–13.11.'), cell('')],
    [cell('ST_ELEKTRO'), cell(36), cell(36), cell(72, { total: true })],
  ], 2, chart);
  const sheet = book.worksheets[0];
  assert.equal(sheet.getCell('C1').master.address, 'B1');
  assert.equal(sheet.getCell('D1').value, 'Total [MH]');
  assert.equal(sheet.views[0].state, 'frozen');
  assert.equal('ySplit' in sheet.views[0] && sheet.views[0].ySplit, 2);
});