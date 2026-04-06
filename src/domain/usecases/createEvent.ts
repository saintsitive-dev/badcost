import type { GameEvent } from '../entities/GameEvent';

export function createEvent(playerIds: string[], date?: string): GameEvent {
  if (playerIds.length === 0) throw new Error('At least one player is required');
  return {
    id: crypto.randomUUID(),
    date: date ?? new Date().toISOString(),
    playerIds,
    playerHours: Object.fromEntries(playerIds.map((id) => [id, 1])),
    courtCostPerHour: 0,
    numCourts: 1,
    courtsPerHour: {},
    shuttlecockCostPerUnit: 0,
    totalShuttlecocks: 0,
    shuttlecocksPerHour: {},
    organizerFee: 0,
    isFinalized: false,
    createdAt: new Date().toISOString(),
  };
}
