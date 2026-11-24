import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getExactProjectColor, PROJECT_EXACT_COLORS } from './colorSystem';

// Both projects used to fall back to the shared `ST_` prefix colour (#1E3A8A),
// which made them indistinguishable in every view.
const ST_PREFIX_FALLBACK = '#1E3A8A';

test('ST_TRAM_BELEHRAD and ST_TRAM_OSTRAVA have different colours', () => {
  const belehrad = getExactProjectColor('ST_TRAM_BELEHRAD');
  const ostrava = getExactProjectColor('ST_TRAM_OSTRAVA');

  assert.ok(belehrad, 'ST_TRAM_BELEHRAD needs an exact colour');
  assert.ok(ostrava, 'ST_TRAM_OSTRAVA needs an exact colour');
  assert.notEqual(belehrad, ostrava);
});

test('neither TRAM project falls back to the shared ST_ prefix colour', () => {
  assert.notEqual(getExactProjectColor('ST_TRAM_BELEHRAD'), ST_PREFIX_FALLBACK);
  assert.notEqual(getExactProjectColor('ST_TRAM_OSTRAVA'), ST_PREFIX_FALLBACK);
});

test('the two new TRAM colours do not collide with any existing project colour', () => {
  const newCodes = ['ST_TRAM_BELEHRAD', 'ST_TRAM_OSTRAVA'];
  const newColors = newCodes.map((code) => PROJECT_EXACT_COLORS[code]);

  for (const [code, color] of Object.entries(PROJECT_EXACT_COLORS)) {
    if (newCodes.includes(code)) continue;
    assert.ok(!newColors.includes(color), `${code} already uses ${color}`);
  }
});
