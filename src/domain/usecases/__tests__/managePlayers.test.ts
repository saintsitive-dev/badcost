import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { addPlayer, deletePlayer, toggleFavorite, sortPlayers, findSimilarPlayers } from '../managePlayers';
import type { Player } from '../../entities/Player';

const p = (id: string, name: string, fav = false): Player => ({
  id, name, isFavorite: fav, createdAt: '',
});

describe('addPlayer', () => {
  test('adds a new player with trimmed name', () => {
    const result = addPlayer([], "  P'Ning  ");
    assert.equal(result.length, 1);
    assert.equal(result[0].name, "P'Ning");
    assert.equal(result[0].isFavorite, false);
    assert.ok(result[0].id);
  });

  test('throws when name is empty or whitespace', () => {
    assert.throws(() => addPlayer([], '   '), /empty/i);
    assert.throws(() => addPlayer([], ''), /empty/i);
  });

  test('appends to existing players', () => {
    const result = addPlayer([p('1', 'Mon')], 'โจโจ้');
    assert.equal(result.length, 2);
    assert.equal(result[1].name, 'โจโจ้');
  });

  test('ignores duplicate name (case-insensitive)', () => {
    const existing = [p('1', 'Mon')];
    const result = addPlayer(existing, 'mon');
    assert.equal(result.length, 1);
    assert.equal(result, existing);
  });
});

describe('deletePlayer', () => {
  test('removes player by id', () => {
    const result = deletePlayer([p('1', 'A'), p('2', 'B')], '1');
    assert.equal(result.length, 1);
    assert.equal(result[0].id, '2');
  });

  test('returns same array when id not found', () => {
    const players = [p('1', 'A')];
    assert.equal(deletePlayer(players, '999').length, 1);
  });
});

describe('toggleFavorite', () => {
  test('sets isFavorite to true', () => {
    assert.equal(toggleFavorite([p('1', 'A', false)], '1')[0].isFavorite, true);
  });
  test('sets isFavorite back to false', () => {
    assert.equal(toggleFavorite([p('1', 'A', true)], '1')[0].isFavorite, false);
  });
});

describe('sortPlayers', () => {
  test('puts favorites first', () => {
    const sorted = sortPlayers([p('1', 'Mon', false), p('2', "P'Ning", true)]);
    assert.equal(sorted[0].id, '2');
  });
  test('stable when all non-favorite', () => {
    const sorted = sortPlayers([p('1', 'B'), p('2', 'A')]);
    assert.equal(sorted[0].name, 'A');
  });
});

describe('findSimilarPlayers (AC14)', () => {
  const players = [
    p('1', 'Mon'),
    p('2', "P'Ning"),
    p('3', 'Monica'),
    p('4', 'โจโจ้'),
    p('5', 'โจ'),
  ];

  test('MP-10: returns empty array for empty query', () => {
    assert.deepEqual(findSimilarPlayers(players, ''), []);
  });

  test('MP-11: returns empty array for whitespace-only query', () => {
    assert.deepEqual(findSimilarPlayers(players, '   '), []);
  });

  test('MP-12: exact match (case-insensitive) is returned', () => {
    const result = findSimilarPlayers(players, 'mon');
    const names = result.map((p) => p.name);
    assert.ok(names.includes('Mon'), 'Mon should be found');
  });

  test('MP-13: partial/substring match is returned', () => {
    const result = findSimilarPlayers(players, 'mo');
    const names = result.map((p) => p.name);
    assert.ok(names.includes('Mon'));
    assert.ok(names.includes('Monica'));
  });

  test('MP-14: case-insensitive substring match', () => {
    const result = findSimilarPlayers(players, 'NING');
    assert.equal(result.length, 1);
    assert.equal(result[0].name, "P'Ning");
  });

  test('MP-15: non-matching query returns empty array', () => {
    assert.deepEqual(findSimilarPlayers(players, 'xyz'), []);
  });

  test('MP-16: empty player list returns empty array', () => {
    assert.deepEqual(findSimilarPlayers([], 'Mon'), []);
  });

  test('MP-17: Thai name partial match returns all matches', () => {
    const result = findSimilarPlayers(players, 'โจ');
    const names = result.map((p) => p.name);
    assert.ok(names.includes('โจโจ้'));
    assert.ok(names.includes('โจ'));
  });

  test('MP-18: does not return player whose name does not contain query', () => {
    const result = findSimilarPlayers(players, 'Mon');
    const names = result.map((p) => p.name);
    assert.ok(names.includes('Mon'));
    assert.ok(names.includes('Monica'));
    assert.ok(!names.includes("P'Ning"));
    assert.ok(!names.includes('โจโจ้'));
  });
});

