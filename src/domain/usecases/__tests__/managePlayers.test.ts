import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { addPlayer, deletePlayer, toggleFavorite, sortPlayers } from '../managePlayers';
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
