import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Player } from '../../domain/entities/Player';
import { LocalStoragePlayerRepo } from '../../infrastructure/repositories/LocalStoragePlayerRepo';
import { addPlayer, deletePlayer, toggleFavorite, sortPlayers } from '../../domain/usecases/managePlayers';

const repo = new LocalStoragePlayerRepo();

interface PlayersContextValue {
  players: Player[];
  sortedPlayers: Player[];
  add: (name: string) => void;
  remove: (id: string) => void;
  toggleFav: (id: string) => void;
}

const PlayersContext = createContext<PlayersContextValue | null>(null);

export function PlayersProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>(() => repo.getAll());

  const persist = useCallback((updated: Player[]) => {
    setPlayers(updated);
    repo.save(updated);
  }, []);

  const add = useCallback((name: string) => persist(addPlayer(players, name)), [players, persist]);
  const remove = useCallback((id: string) => persist(deletePlayer(players, id)), [players, persist]);
  const toggleFav = useCallback((id: string) => persist(toggleFavorite(players, id)), [players, persist]);

  return (
    <PlayersContext.Provider value={{ players, sortedPlayers: sortPlayers(players), add, remove, toggleFav }}>
      {children}
    </PlayersContext.Provider>
  );
}

export function usePlayers() {
  const ctx = useContext(PlayersContext);
  if (!ctx) throw new Error('usePlayers must be used within PlayersProvider');
  return ctx;
}
