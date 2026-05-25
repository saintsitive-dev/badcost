import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateInviteCode,
  isGameVisible,
  isGameFull,
  formatGameDateThai,
} from '../../entities/Game';
import type { Game } from '../../entities/Game';

function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: 'game-1',
    hostId: 'host-1',
    title: 'เปิดตี้ 🏸',
    venue: 'sevendays badminton',
    date: '2026-05-20',
    startTime: '19:00',
    endTime: '21:00',
    hours: 2,
    courts: '3 คอร์ด',
    zone: '3,4,5',
    maxPlayers: 18,
    status: 'open',
    inviteCode: 'abc123',
    createdAt: '2026-05-18T10:00:00.000Z',
    gameDate: '2026-05-20T19:00:00.000Z',
    ...overrides,
  };
}

describe('generateInviteCode', () => {
  it('returns a 6-character alphanumeric string', () => {
    const code = generateInviteCode();
    assert.equal(code.length, 6);
    assert.match(code, /^[a-z0-9]{6}$/);
  });

  it('generates different codes on multiple calls', () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateInviteCode()));
    // With 36^6 possibilities, 20 codes should all be unique
    assert.equal(codes.size, 20);
  });
});

describe('isGameVisible', () => {
  it('returns true for future games', () => {
    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const game = makeGame({ gameDate: futureDate });
    assert.equal(isGameVisible(game), true);
  });

  it('returns true for games less than 1 week old', () => {
    const recentDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const game = makeGame({ gameDate: recentDate });
    assert.equal(isGameVisible(game), true);
  });

  it('returns false for games older than 1 week', () => {
    const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    const game = makeGame({ gameDate: oldDate });
    assert.equal(isGameVisible(game), false);
  });
});

describe('isGameFull', () => {
  it('returns false when maxPlayers is null (unlimited)', () => {
    const game = makeGame({ maxPlayers: null });
    assert.equal(isGameFull(game, 100), false);
  });

  it('returns false when participant count is below max', () => {
    const game = makeGame({ maxPlayers: 18 });
    assert.equal(isGameFull(game, 10), false);
  });

  it('returns true when participant count equals max', () => {
    const game = makeGame({ maxPlayers: 18 });
    assert.equal(isGameFull(game, 18), true);
  });

  it('returns true when participant count exceeds max', () => {
    const game = makeGame({ maxPlayers: 18 });
    assert.equal(isGameFull(game, 20), true);
  });
});

describe('formatGameDateThai', () => {
  it('formats a Wednesday date in Thai', () => {
    // 2026-05-20 is a Wednesday
    const result = formatGameDateThai('2026-05-20');
    assert.match(result, /พุธ/);
    assert.match(result, /20/);
    assert.match(result, /พฤษภา/);
    assert.match(result, /2569/);
  });

  it('formats a Saturday date in Thai', () => {
    // 2026-05-23 is a Saturday
    const result = formatGameDateThai('2026-05-23');
    assert.match(result, /เสาร์/);
    assert.match(result, /23/);
  });

  it('uses Buddhist Era year (CE + 543)', () => {
    const result = formatGameDateThai('2026-01-01');
    assert.match(result, /2569/);
  });
});
