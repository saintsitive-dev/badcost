/**
 * AC7: shuttlecock cost per player.
 *
 * Uses the same "last-N hours" participation model as court costs:
 * a player with H hours participates in the last H hour-tiers.
 *
 * If shuttlecocksPerHour has any non-zero values:
 *   - For hour N: cost = count × costPerUnit, split among eligible players.
 *   - Eligible = players whose hours >= maxHours - N + 1
 *
 * Otherwise: total cost split equally among all players.
 */
export function calculateShuttlecockCost(
  costPerUnit: number,
  totalShuttlecocks: number,
  shuttlecocksPerHour: Record<string, number>,
  playerHours: Record<string, number>,
): Record<string, number> {
  const playerIds = Object.keys(playerHours);
  if (playerIds.length === 0) return {};

  const hasPerHourData = Object.values(shuttlecocksPerHour).some((v) => v > 0);

  if (!hasPerHourData) {
    const total = costPerUnit * totalShuttlecocks;
    const perPlayer = Math.ceil(total / playerIds.length);
    return Object.fromEntries(playerIds.map((id) => [id, perPlayer]));
  }

  const maxHours = Math.max(...Object.values(playerHours), 1);
  const rawCosts: Record<string, number> = Object.fromEntries(playerIds.map((id) => [id, 0]));

  for (const [hourStr, count] of Object.entries(shuttlecocksPerHour)) {
    if (count <= 0) continue;
    const hour = parseInt(hourStr, 10);
    const minHoursToQualify = maxHours - hour + 1;
    const eligible = playerIds.filter((id) => (playerHours[id] ?? 1) >= minHoursToQualify);
    if (eligible.length === 0) continue;
    const share = (costPerUnit * count) / eligible.length;
    for (const id of eligible) rawCosts[id] += share;
  }

  return Object.fromEntries(Object.entries(rawCosts).map(([id, cost]) => [id, Math.ceil(cost)]));
}
