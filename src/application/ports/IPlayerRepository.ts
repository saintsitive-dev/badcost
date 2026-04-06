import type { Player } from '../../domain/entities/Player';

export interface IPlayerRepository {
  getAll(): Player[];
  save(players: Player[]): void;
}
