import type { Player } from '../entities/Player';
import type { CostBreakdown } from '../entities/CostBreakdown';

/** AC11: aggregate all cost components per player, sorted by total descending */
export function calculateTotalCost(
  playerIds: string[],
  playerHours: Record<string, number>,
  courtCosts: Record<string, number>,
  shuttlecockCosts: Record<string, number>,
  organizerFees: Record<string, number>,
  players: Player[],
): CostBreakdown[] {
  const playerMap = Object.fromEntries(players.map((p) => [p.id, p]));
  return playerIds
    .map((id) => {
      const courtCost = courtCosts[id] ?? 0;
      const shuttlecockCost = shuttlecockCosts[id] ?? 0;
      const organizerCost = organizerFees[id] ?? 0;
      return {
        playerId: id,
        playerName: playerMap[id]?.name ?? id,
        hours: playerHours[id] ?? 0,
        courtCost,
        shuttlecockCost,
        organizerCost,
        total: courtCost + shuttlecockCost + organizerCost,
      };
    })
    .sort((a, b) => b.total - a.total);
}
