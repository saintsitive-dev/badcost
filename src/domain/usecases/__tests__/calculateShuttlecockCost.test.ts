import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateShuttlecockCost } from '../calculateShuttlecockCost';

describe('calculateShuttlecockCost — equal split (no per-hour data)', () => {
  test('splits equally when no per-hour data', () => {
    const r = calculateShuttlecockCost(20, 6, {}, { p1: 2, p2: 2, p3: 2 });
    assert.equal(r.p1, 40);
    assert.equal(r.p2, 40);
    assert.equal(r.p3, 40);
  });

  test('rounds up per player (AC10)', () => {
    // 20 × 5 = 100, 100/3 = 33.33 → 34
    const r = calculateShuttlecockCost(20, 5, {}, { p1: 1, p2: 1, p3: 1 });
    assert.equal(r.p1, 34);
  });

  test('returns empty for no players', () => {
    assert.deepEqual(calculateShuttlecockCost(20, 6, {}, {}), {});
  });
});

describe('calculateShuttlecockCost — per-hour split (last-N hours model)', () => {
  // maxH = 3, players: p1=3hrs, p2=2hrs, p3=1hr (late joiner)
  // hour 1 (first): eligible if hours >= 3-1+1=3 → only p1
  // hour 2:          eligible if hours >= 3-2+1=2 → p1, p2
  // hour 3 (last):   eligible if hours >= 3-3+1=1 → all

  test('hour-1 shuttles paid by full-duration players only', () => {
    // 2 shuttles × 10 = 20, only p1 eligible → p1 pays 20
    const r = calculateShuttlecockCost(10, 2, { '1': 2 }, { p1: 3, p2: 2, p3: 1 });
    assert.equal(r.p1, 20);
    assert.equal(r.p2, 0);
    assert.equal(r.p3, 0);
  });

  test('hour-3 (last hour) shuttles shared by everyone', () => {
    // 3 shuttles × 10 = 30 / 3 players = 10 each
    const r = calculateShuttlecockCost(10, 3, { '3': 3 }, { p1: 3, p2: 2, p3: 1 });
    assert.equal(r.p1, 10);
    assert.equal(r.p2, 10);
    assert.equal(r.p3, 10);
  });

  test('3-hr player pays most, late joiner pays least', () => {
    const r = calculateShuttlecockCost(10, 9, { '1': 3, '2': 3, '3': 3 }, { p1: 3, p2: 2, p3: 1 });
    assert.ok(r.p1 > r.p2, 'p1 (3hrs) > p2 (2hrs)');
    assert.ok(r.p2 > r.p3, 'p2 (2hrs) > p3 (1hr late joiner)');
  });

  test('ignores zero-count entries', () => {
    const with0 = calculateShuttlecockCost(10, 2, { '1': 2, '2': 0 }, { p1: 2, p2: 1 });
    const without = calculateShuttlecockCost(10, 2, { '1': 2 }, { p1: 2, p2: 1 });
    assert.deepEqual(with0, without);
  });
});
