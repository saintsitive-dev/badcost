/** AC8: organizer fee split equally — ceil(fee / totalPlayers) per player */
export function calculateOrganizerFee(
  fee: number,
  playerIds: string[],
): Record<string, number> {
  if (playerIds.length === 0) return {};
  const perPlayer = Math.ceil(fee / playerIds.length);
  return Object.fromEntries(playerIds.map((id) => [id, perPlayer]));
}
