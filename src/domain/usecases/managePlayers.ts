import type { Player } from '../entities/Player';

export function addPlayer(players: Player[], name: string): Player[] {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Player name cannot be empty');
  const duplicate = players.find(p => p.name.toLowerCase() === trimmed.toLowerCase());
  if (duplicate) return players;
  return [
    ...players,
    {
      id: crypto.randomUUID(),
      name: trimmed,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    },
  ];
}

export function deletePlayer(players: Player[], id: string): Player[] {
  return players.filter((p) => p.id !== id);
}

export function toggleFavorite(players: Player[], id: string): Player[] {
  return players.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
}

export function sortPlayers(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
    return a.name.localeCompare(b.name, 'th');
  });
}

/** AC14: returns players whose names contain `query` (case-insensitive substring match).
 *  Returns [] when query is empty or whitespace-only. */
export function findSimilarPlayers(players: Player[], query: string): Player[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return players.filter((p) => p.name.toLowerCase().includes(q));
}
