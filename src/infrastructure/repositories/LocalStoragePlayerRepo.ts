import type { IPlayerRepository } from '../../application/ports/IPlayerRepository';
import type { Player } from '../../domain/entities/Player';

const KEY = 'badcost:players';

export class LocalStoragePlayerRepo implements IPlayerRepository {
  getAll(): Player[] {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as Player[]) : [];
    } catch {
      return [];
    }
  }

  save(players: Player[]): void {
    localStorage.setItem(KEY, JSON.stringify(players));
  }
}
