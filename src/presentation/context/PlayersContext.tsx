import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import type { Player } from '../../domain/entities/Player';
import { LocalStoragePlayerRepo } from '../../infrastructure/repositories/LocalStoragePlayerRepo';
import { addPlayer, deletePlayer, toggleFavorite, sortPlayers } from '../../domain/usecases/managePlayers';

const repo = new LocalStoragePlayerRepo();

interface PlayersContextValue {
  players: Player[];
  sortedPlayers: Player[];
  add: (name: string) => Player;
  remove: (id: string) => void;
  toggleFav: (id: string) => void;
}

const PlayersContext = createContext<PlayersContextValue | null>(null);

export function PlayersProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>(() => repo.getAll());
  const playersRef = useRef(players);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  const add = useCallback((name: string): Player => {
    const trimmed = name.trim();
    const current = playersRef.current;
    const existing = current.find(p => p.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;
    const updated = addPlayer(current, name);
    playersRef.current = updated;
    setPlayers(updated);
    repo.save(updated);
    return updated[updated.length - 1];
  }, []);

  const remove = useCallback((id: string) => {
    const updated = deletePlayer(playersRef.current, id);
    playersRef.current = updated;
    setPlayers(updated);
    repo.save(updated);
  }, []);

  const toggleFav = useCallback((id: string) => {
    const updated = toggleFavorite(playersRef.current, id);
    playersRef.current = updated;
    setPlayers(updated);
    repo.save(updated);
  }, []);

  return (
    <PlayersContext.Provider value={{ players, sortedPlayers: sortPlayers(players), add, remove, toggleFav }}>
      {children}
    </PlayersContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePlayers() {
  const ctx = useContext(PlayersContext);
  if (!ctx) throw new Error('usePlayers must be used within PlayersProvider');
  return ctx;
}
