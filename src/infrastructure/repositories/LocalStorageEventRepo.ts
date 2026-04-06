import type { IEventRepository } from '../../application/ports/IEventRepository';
import type { GameEvent } from '../../domain/entities/GameEvent';

const KEY = 'badcost:events';

export class LocalStorageEventRepo implements IEventRepository {
  private load(): GameEvent[] {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as GameEvent[]) : [];
    } catch {
      return [];
    }
  }

  private persist(events: GameEvent[]): void {
    localStorage.setItem(KEY, JSON.stringify(events));
  }

  getAll(): GameEvent[] {
    return this.load().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  getById(id: string): GameEvent | undefined {
    return this.load().find((e) => e.id === id);
  }

  save(event: GameEvent): void {
    const events = this.load();
    const idx = events.findIndex((e) => e.id === event.id);
    if (idx >= 0) events[idx] = event;
    else events.push(event);
    this.persist(events);
  }

  delete(id: string): void {
    this.persist(this.load().filter((e) => e.id !== id));
  }
}
