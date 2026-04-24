import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateShuttlecockCost } from '../calculateShuttlecockCost';

// Shorthand helpers
const tier = (price: number, count: number) => ({ price, count });

describe('calculateShuttlecockCost — equal split (no per-hour data)', () => {
  test('single tier: splits equally', () => {
    // 20 × 6 = 120, 3 players → 40 each
    const r = calculateShuttlecockCost([tier(20, 6)], {}, { p1: 2, p2: 2, p3: 2 });
    assert.equal(r.p1, 40);
    assert.equal(r.p2, 40);
    assert.equal(r.p3, 40);
  });

  test('single tier: rounds up per player (AC10)', () => {
    // 20 × 5 = 100, 100/3 = 33.33 → 34
    const r = calculateShuttlecockCost([tier(20, 5)], {}, { p1: 1, p2: 1, p3: 1 });
    assert.equal(r.p1, 34);
  });

  test('returns empty for no players', () => {
    assert.deepEqual(calculateShuttlecockCost([tier(20, 6)], {}, {}), {});
  });

  test('empty tiers returns zero for all players', () => {
    const r = calculateShuttlecockCost([], {}, { p1: 1, p2: 1 });
    assert.equal(r.p1, 0);
    assert.equal(r.p2, 0);
  });

  test('all-zero tiers returns zero for all players', () => {
    const r = calculateShuttlecockCost([tier(0, 5), tier(20, 0)], {}, { p1: 1 });
    assert.equal(r.p1, 0);
  });
});

describe('calculateShuttlecockCost — multi-tier pricing (equal split)', () => {
  test('two tiers: total = sum of tier costs, split equally', () => {
    // 3 × 30 + 5 × 20 = 90 + 100 = 190, 3 players → ceil(190/3) = 64
    const r = calculateShuttlecockCost([tier(30, 3), tier(20, 5)], {}, { p1: 1, p2: 1, p3: 1 });
    assert.equal(r.p1, 64);
    assert.equal(r.p2, 64);
    assert.equal(r.p3, 64);
  });

  test('three tiers: all costs summed before split', () => {
    // 2×50 + 3×30 + 4×20 = 100+90+80 = 270, 2 players → ceil(270/2) = 135
    const r = calculateShuttlecockCost([tier(50, 2), tier(30, 3), tier(20, 4)], {}, { p1: 1, p2: 1 });
    assert.equal(r.p1, 135);
    assert.equal(r.p2, 135);
  });

  test('single expensive tier behaves like old single-price', () => {
    // same result as old calculateShuttlecockCost(15, 4, {}, {p1:1, p2:1})
    // 60 / 2 = 30
    const r = calculateShuttlecockCost([tier(15, 4)], {}, { p1: 1, p2: 1 });
    assert.equal(r.p1, 30);
    assert.equal(r.p2, 30);
  });
});

describe('calculateShuttlecockCost — per-hour split (last-N hours model)', () => {
  // maxH = 3, players: p1=3hrs, p2=2hrs, p3=1hr (late joiner)
  // hour 1 (first): eligible if hours >= 3-1+1=3 → only p1
  // hour 2:          eligible if hours >= 3-2+1=2 → p1, p2
  // hour 3 (last):   eligible if hours >= 3-3+1=1 → all

  test('single tier: hour-1 shuttles paid by full-duration players only', () => {
    // effectiveCPU = 20/2 = 10, 2 count in hour 1 → 10×2 = 20, only p1
    const r = calculateShuttlecockCost([tier(10, 2)], { '1': 2 }, { p1: 3, p2: 2, p3: 1 });
    assert.equal(r.p1, 20);
    assert.equal(r.p2, 0);
    assert.equal(r.p3, 0);
  });

  test('single tier: last-hour shuttles shared by everyone', () => {
    // 3 × 10 = 30, effectiveCPU=10, hour3 → all eligible → 10 each
    const r = calculateShuttlecockCost([tier(10, 3)], { '3': 3 }, { p1: 3, p2: 2, p3: 1 });
    assert.equal(r.p1, 10);
    assert.equal(r.p2, 10);
    assert.equal(r.p3, 10);
  });

  test('single tier: 3-hr player pays most, late joiner pays least', () => {
    const r = calculateShuttlecockCost([tier(10, 9)], { '1': 3, '2': 3, '3': 3 }, { p1: 3, p2: 2, p3: 1 });
    assert.ok(r.p1 > r.p2, 'p1 (3hrs) > p2 (2hrs)');
    assert.ok(r.p2 > r.p3, 'p2 (2hrs) > p3 (1hr late joiner)');
  });

  test('single tier: ignores zero-count per-hour entries', () => {
    const with0 = calculateShuttlecockCost([tier(10, 2)], { '1': 2, '2': 0 }, { p1: 2, p2: 1 });
    const without = calculateShuttlecockCost([tier(10, 2)], { '1': 2 }, { p1: 2, p2: 1 });
    assert.deepEqual(with0, without);
  });

  test('multi-tier + per-hour: uses effective cost-per-unit across tiers', () => {
    // tiers: 2×30 + 3×20 = 60+60 = 120 total, 5 count → effectiveCPU = 24
    // shuttlecocksPerHour: {1: 2, 2: 3}
    // maxH = 2, p1=2hrs, p2=1hr
    // hour 1 (first): eligible if hrs >= 2 → only p1: 2×24/1 = 48
    // hour 2 (last):  eligible if hrs >= 1 → both:  3×24/2 = 36 each
    // p1: ceil(48 + 36) = 84, p2: ceil(36) = 36
    const r = calculateShuttlecockCost(
      [tier(30, 2), tier(20, 3)],
      { '1': 2, '2': 3 },
      { p1: 2, p2: 1 },
    );
    assert.equal(r.p1, 84);
    assert.equal(r.p2, 36);
  });
});

