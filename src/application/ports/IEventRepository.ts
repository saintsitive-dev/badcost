import type { GameEvent } from '../../domain/entities/GameEvent';

export interface IEventRepository {
  getAll(): GameEvent[];
  getById(id: string): GameEvent | undefined;
  save(event: GameEvent): void;
  delete(id: string): void;
}
