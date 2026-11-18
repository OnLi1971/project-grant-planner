import { describe, expect, test } from 'bun:test';
import { compareProjectsForManagement } from './projectSort';

describe('compareProjectsForManagement', () => {
  test('řadí primárně podle zákazníka A-Z', () => {
    const rows = [
      { customerName: 'SAFRAN', projectName: 'SAF INT', code: 'SAF_INT' },
      { customerName: 'BUCHER', projectName: 'BUCH INT', code: 'BUCH_INT' },
      { customerName: 'AIRBUS', projectName: 'AIRB INT', code: 'AIRB_INT' },
      { customerName: 'ST', projectName: 'ST EMU INT', code: 'ST_EMU_INT' },
    ];
    const sorted = [...rows].sort(compareProjectsForManagement);
    expect(sorted.map(r => r.code)).toEqual(['AIRB_INT', 'BUCH_INT', 'SAF_INT', 'ST_EMU_INT']);
  });

  test('v rámci zákazníka řadí podle názvu projektu', () => {
    const rows = [
      { customerName: 'ST', projectName: 'ST MAINZ', code: 'ST_MAINZ' },
      { customerName: 'ST', projectName: 'ST EMU INT', code: 'ST_EMU_INT' },
      { customerName: 'ST', projectName: 'ST ELEKTRO', code: 'ST_ELEKTRO' },
    ];
    const sorted = [...rows].sort(compareProjectsForManagement);
    expect(sorted.map(r => r.code)).toEqual(['ST_ELEKTRO', 'ST_EMU_INT', 'ST_MAINZ']);
  });

  test('projekty bez zákazníka jsou až za ostatními', () => {
    const rows = [
      { customerName: null, projectName: 'FREE', code: 'FREE' },
      { customerName: 'AIRBUS', projectName: 'AIRB INT', code: 'AIRB_INT' },
      { customerName: '', projectName: 'DOVOLENÁ', code: 'DOVOLENÁ' },
    ];
    const sorted = [...rows].sort(compareProjectsForManagement);
    expect(sorted.map(r => r.code)).toEqual(['AIRB_INT', 'DOVOLENÁ', 'FREE']);
  });

  test('řadí i české znaky a bez diakritiky správně', () => {
    const rows = [
      { customerName: 'ČZ', projectName: 'C', code: 'C' },
      { customerName: 'Bucher', projectName: 'B', code: 'B' },
      { customerName: 'Aero', projectName: 'A', code: 'A' },
    ];
    const sorted = [...rows].sort(compareProjectsForManagement);
    expect(sorted.map(r => r.code)).toEqual(['A', 'B', 'C']);
  });
});
