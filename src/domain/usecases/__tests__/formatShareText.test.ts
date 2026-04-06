import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { formatShareText } from '../formatShareText';
import type { CostBreakdown } from '../../entities/CostBreakdown';

const breakdowns: CostBreakdown[] = [
  { playerId: 'p1', playerName: "P'Ning", hours: 3, courtCost: 150, shuttlecockCost: 40, organizerCost: 0, total: 190 },
  { playerId: 'p2', playerName: 'Mon',    hours: 3, courtCost: 150, shuttlecockCost: 40, organizerCost: 0, total: 190 },
  { playerId: 'p3', playerName: 'โจโจ้',  hours: 2, courtCost: 100, shuttlecockCost: 13, organizerCost: 0, total: 113 },
];

describe('formatShareText (AC12)', () => {
  test('includes emoji header and date line', () => {
    const text = formatShareText(breakdowns, '2024-01-15T10:00:00.000Z');
    assert.ok(text.includes('🏸'), 'missing 🏸 header');
    assert.ok(text.includes('📅'), 'missing 📅 date');
  });

  test('includes all player names and totals', () => {
    const text = formatShareText(breakdowns, '2024-01-15T10:00:00.000Z');
    assert.ok(text.includes("P'Ning"));
    assert.ok(text.includes('190'));
    assert.ok(text.includes('โจโจ้'));
    assert.ok(text.includes('113'));
  });

  test('includes hours in result lines', () => {
    const text = formatShareText(breakdowns, '2024-01-15T10:00:00.000Z');
    assert.ok(text.includes('3hrs'));
    assert.ok(text.includes('2hrs'));
  });

  test('includes grand total', () => {
    const text = formatShareText(breakdowns, '2024-01-15T10:00:00.000Z');
    assert.ok(text.includes('493'), 'grand total 190+190+113=493 missing');
  });

  test('numbered list starts with highest total', () => {
    const text = formatShareText(breakdowns, '2024-01-15T10:00:00.000Z');
    const firstEntry = text.split('\n').find((l) => l.startsWith('1.'));
    assert.ok(firstEntry?.includes('190'), '1st entry should be 190');
  });
});
