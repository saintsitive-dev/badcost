import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateTotalCost } from '../calculateTotalCost';
import type { Player } from '../../entities/Player';

const players: Player[] = [
  { id: 'p1', name: "P'Ning", isFavorite: false, createdAt: '' },
  { id: 'p2', name: 'Mon', isFavorite: false, createdAt: '' },
  { id: 'p3', name: 'โจโจ้', isFavorite: false, createdAt: '' },
];

describe('calculateTotalCost', () => {
  test('sums all cost components (AC11)', () => {
    const result = calculateTotalCost(
      ['p1', 'p2', 'p3'],
      { p1: 3, p2: 3, p3: 2 },
      { p1: 150, p2: 150, p3: 100 },
      { p1: 40, p2: 40, p3: 13 },
      { p1: 0, p2: 0, p3: 0 },
      players,
    );
    const p1 = result.find((r) => r.playerId === 'p1')!;
    assert.equal(p1.courtCost, 150);
    assert.equal(p1.shuttlecockCost, 40);
    assert.equal(p1.organizerCost, 0);
    assert.equal(p1.total, 190);
  });

  test('sorts by total descending', () => {
    const result = calculateTotalCost(
      ['p1', 'p2', 'p3'],
      { p1: 3, p2: 3, p3: 2 },
      { p1: 150, p2: 150, p3: 100 },
      { p1: 40, p2: 40, p3: 13 },
      { p1: 0, p2: 0, p3: 0 },
      players,
    );
    assert.ok(result[0].total >= result[1].total);
    assert.ok(result[1].total >= result[2].total);
  });

  test('uses player name from players array (Thai name)', () => {
    const result = calculateTotalCost(['p3'], { p3: 2 }, { p3: 100 }, { p3: 13 }, { p3: 0 }, players);
    assert.equal(result[0].playerName, 'โจโจ้');
  });

  test('defaults to 0 for missing cost entries', () => {
    const result = calculateTotalCost(['p1'], { p1: 2 }, {}, {}, {}, players);
    assert.equal(result[0].courtCost, 0);
    assert.equal(result[0].total, 0);
  });
});
