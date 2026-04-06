/**
 * AC6: court cost per player using "last-N hours" participation model.
 *
 * Tier model: a player with H hours out of maxH total participates in the
 * LAST H hours of the session (i.e. hours where hour >= maxH - H + 1).
 * This correctly handles late joiners:
 *   - 3-hour player (maxH=3): participates in hours 1, 2, 3
 *   - 1-hour late joiner:     participates in hour 3 only
 *
 * For each hour N:
 *   courtsThisHour = courtsPerHour[N] ?? numCourts
 *   totalCost      = courtsThisHour × courtCostPerHour
 *   split among eligible players (those with hours >= maxH - N + 1)
 *
 * Each player's accumulated share is ceil'd at the end.
 */
export function calculateCourtCost(
  courtCostPerHour: number,
  numCourts: number,
  courtsPerHour: Record<string, number>,
  playerHours: Record<string, number>,
): Record<string, number> {
  const playerIds = Object.keys(playerHours);
  if (playerIds.length === 0) return {};

  const maxHours = Math.max(...Object.values(playerHours), 1);
  const rawCosts: Record<string, number> = Object.fromEntries(playerIds.map((id) => [id, 0]));

  for (let hour = 1; hour <= maxHours; hour++) {
    const courts = courtsPerHour[String(hour)] ?? numCourts;
    const totalCost = courts * courtCostPerHour;
    const minHoursToQualify = maxHours - hour + 1;
    const eligible = playerIds.filter((id) => (playerHours[id] ?? 1) >= minHoursToQualify);
    if (eligible.length === 0 || totalCost === 0) continue;
    const share = totalCost / eligible.length;
    for (const id of eligible) rawCosts[id] += share;
  }

  return Object.fromEntries(Object.entries(rawCosts).map(([id, cost]) => [id, Math.ceil(cost)]));
}
