import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateCourtCost } from '../calculateCourtCost';

// Shorthand: calculateCourtCost(costPerHour, numCourts, courtsPerHour, playerHours)

describe('calculateCourtCost — the reported bug scenario', () => {
  test('1-hour late joiner pays for last hour only (16 players, 15 play 3hrs)', () => {
    // 200/court/hr, 3 courts → 600/hr
    // Hour 1: eligible = 3-hr players (15)  → 600/15 = 40 each
    // Hour 2: eligible = 3-hr players (15)  → 600/15 = 40 each
    // Hour 3: eligible = everyone (16)      → 600/16 = 37.5 → ceil 38 each
    const hours: Record<string, number> = {};
    for (let i = 1; i <= 15; i++) hours[`p${i}`] = 3;
    hours['late'] = 1;

    const r = calculateCourtCost(200, 3, {}, hours);
    assert.equal(r['late'], 38, 'late joiner pays only for hour 3');
    assert.equal(r['p1'], Math.ceil(40 + 40 + 37.5), '3-hr player pays for all 3 hours');
    assert.ok(r['p1'] > r['late'], '3-hr player pays more than late joiner');
  });
});

describe('calculateCourtCost — last-N hours model', () => {
  test('all players same hours → split equally per hour', () => {
    // 3 players × 2 hrs, 1 court × 100/hr
    // Hour 1: eligible if hours ≥ 2-1+1=2 → all 3 → 100/3 each
    // Hour 2: eligible if hours ≥ 2-2+1=1 → all 3 → 100/3 each
    const r = calculateCourtCost(100, 1, {}, { p1: 2, p2: 2, p3: 2 });
    assert.equal(r.p1, Math.ceil(200 / 3));
    assert.equal(r.p2, r.p1);
    assert.equal(r.p3, r.p1);
  });

  test('3-hour player pays more than 1-hour late joiner', () => {
    const r = calculateCourtCost(100, 1, {}, { p1: 3, p2: 1 });
    assert.ok(r.p1 > r.p2);
  });

  test('per-hour courts override numCourts', () => {
    // Hour 1 (first): 2 courts only eligible for 3-hr player
    // Hour 2 (middle): 1 court, eligible for ≥2-hr players
    // Hour 3 (last): 3 courts, everyone
    const r = calculateCourtCost(100, 1, { '1': 2, '2': 1, '3': 3 }, { p1: 3, p2: 2, p3: 1 });
    // p3 (1 hr): only hour 3 → 3×100/3 = 100
    assert.equal(r.p3, 100);
    // p1 (3 hrs): all hours → 2×100/1 + 1×100/2 + 3×100/3 = 200 + 50 + 100 = 350
    assert.equal(r.p1, 350);
  });

  test('ignores zero-court hours', () => {
    const withZero = calculateCourtCost(100, 1, { '1': 0 }, { p1: 1 });
    const withoutOverride = calculateCourtCost(100, 1, {}, { p1: 1 });
    // zero override for hour 1 → no cost for that hour; falls to zero not numCourts
    assert.equal(withZero.p1, 0);
    assert.equal(withoutOverride.p1, 100); // numCourts=1 used
  });

  test('returns empty for no players', () => {
    assert.deepEqual(calculateCourtCost(200, 3, {}, {}), {});
  });

  test('rounds up per player (AC10)', () => {
    // 1 court × 100 = 100/hr, 1 hour, 3 players → ceil(100/3) = 34
    const r = calculateCourtCost(100, 1, {}, { p1: 1, p2: 1, p3: 1 });
    assert.equal(r.p1, 34);
  });
});
