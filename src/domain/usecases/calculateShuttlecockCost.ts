import type { ShuttlecockTier } from '../entities/GameEvent';

/**
 * AC7 (extended): shuttlecock cost per player with multi-tier pricing support.
 *
 * `tiers` is an array of { price, count } pairs — e.g. 3 shuttles at 30฿
 * and 5 at 25฿. Total cost = Σ(price × count).
 *
 * For per-hour distribution (shuttlecocksPerHour has values), an effective
 * cost-per-unit = totalCost / totalCount is derived and applied per hour,
 * using the same "last-N hours" participation model as court costs.
 *
 * If no per-hour data: total cost split equally among all players (ceil).
 * If tiers is empty or all-zero: every player pays 0.
 */
export function calculateShuttlecockCost(
  tiers: ShuttlecockTier[],
  shuttlecocksPerHour: Record<string, number>,
  playerHours: Record<string, number>,
): Record<string, number> {
  const playerIds = Object.keys(playerHours);
  if (playerIds.length === 0) return {};

  const totalCost = tiers.reduce((s, t) => s + t.price * t.count, 0);
  const totalCount = tiers.reduce((s, t) => s + t.count, 0);

  if (totalCost === 0) {
    return Object.fromEntries(playerIds.map((id) => [id, 0]));
  }

  const hasPerHourData = Object.values(shuttlecocksPerHour).some((v) => v > 0);

  if (!hasPerHourData) {
    const perPlayer = Math.ceil(totalCost / playerIds.length);
    return Object.fromEntries(playerIds.map((id) => [id, perPlayer]));
  }

  const effectiveCostPerUnit = totalCount > 0 ? totalCost / totalCount : 0;
  const maxHours = Math.max(...Object.values(playerHours), 1);
  const rawCosts: Record<string, number> = Object.fromEntries(playerIds.map((id) => [id, 0]));

  for (const [hourStr, count] of Object.entries(shuttlecocksPerHour)) {
    if (count <= 0) continue;
    const hour = parseInt(hourStr, 10);
    const minHoursToQualify = maxHours - hour + 1;
    const eligible = playerIds.filter((id) => (playerHours[id] ?? 1) >= minHoursToQualify);
    if (eligible.length === 0) continue;
    const share = (effectiveCostPerUnit * count) / eligible.length;
    for (const id of eligible) rawCosts[id] += share;
  }

  return Object.fromEntries(Object.entries(rawCosts).map(([id, cost]) => [id, Math.ceil(cost)]));
}
