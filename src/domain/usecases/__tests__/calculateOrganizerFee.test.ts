import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateOrganizerFee } from '../calculateOrganizerFee';

describe('calculateOrganizerFee', () => {
  test('splits equally among all players', () => {
    const r = calculateOrganizerFee(300, ['p1', 'p2', 'p3']);
    assert.equal(r.p1, 100);
    assert.equal(r.p2, 100);
    assert.equal(r.p3, 100);
  });

  test('rounds up when not evenly divisible (AC10)', () => {
    // 100 / 3 = 33.33 → ceil = 34
    const r = calculateOrganizerFee(100, ['p1', 'p2', 'p3']);
    assert.equal(r.p1, 34);
    assert.equal(r.p2, 34);
    assert.equal(r.p3, 34);
  });

  test('returns empty for no players', () => {
    assert.deepEqual(calculateOrganizerFee(500, []), {});
  });

  test('single player pays full fee', () => {
    const r = calculateOrganizerFee(150, ['p1']);
    assert.equal(r.p1, 150);
  });
});
