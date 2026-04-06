import { useState, useEffect, useCallback } from 'react';
import type { GameEvent } from '../../domain/entities/GameEvent';
import { LocalStorageEventRepo } from '../../infrastructure/repositories/LocalStorageEventRepo';

const repo = new LocalStorageEventRepo();

export function useEventData(id: string) {
  const [event, setEvent] = useState<GameEvent | null>(() => repo.getById(id) ?? null);

  useEffect(() => {
    setEvent(repo.getById(id) ?? null);
  }, [id]);

  const update = useCallback((updated: GameEvent) => {
    repo.save(updated);
    setEvent({ ...updated });
  }, []);

  return { event, update };
}

export function useAllEvents() {
  const [events, setEvents] = useState<GameEvent[]>(() => repo.getAll());

  const refresh = useCallback(() => setEvents(repo.getAll()), []);

  const remove = useCallback((id: string) => {
    repo.delete(id);
    setEvents(repo.getAll());
  }, []);

  return { events, refresh, remove };
}
