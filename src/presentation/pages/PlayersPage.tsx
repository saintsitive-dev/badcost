import PageHeader from '../components/PageHeader';
import { usePlayers } from '../context/PlayersContext';
import InstallBanner from '../components/InstallBanner';
import AddPlayerForm from '../components/AddPlayerForm';
import type { Player } from '../../domain/entities/Player';

function PlayerPill({ player, onToggleFav, onDelete }: {
  player: Player;
  onToggleFav: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-2 rounded-full border-2 transition-colors ${
      player.isFavorite ? 'border-yellow-400 bg-yellow-50' : 'border-slate-200 bg-white'
    }`}>
      <button
        onClick={() => onToggleFav(player.id)}
        className="text-base leading-none active:scale-90 transition-transform shrink-0"
        aria-label={player.isFavorite ? 'ยกเลิกรายการโปรด' : 'เพิ่มรายการโปรด'}
      >
        {player.isFavorite ? '⭐' : '☆'}
      </button>
      <span className="text-sm font-medium text-slate-800 max-w-[120px] truncate">{player.name}</span>
      <button
        onClick={() => {
          if (confirm(`ลบ "${player.name}"?`)) onDelete(player.id);
        }}
        className="text-slate-300 hover:text-red-400 active:scale-90 transition-all text-sm leading-none ml-0.5 shrink-0"
        aria-label="ลบ"
      >
        ✕
      </button>
    </div>
  );
}

export default function PlayersPage() {
  const { sortedPlayers, add, remove, toggleFav } = usePlayers();

  const favorites = sortedPlayers.filter((p) => p.isFavorite);
  const rest = sortedPlayers.filter((p) => !p.isFavorite);

  return (
    <div>
      {/* AC1 */}
      <PageHeader title="ผู้เล่น 🏸" subtitle={`ทั้งหมด ${sortedPlayers.length} คน`} />

      {/* PWA install banner */}
      <InstallBanner />

      {/* AC2, AC14: Add player form with duplicate prevention */}
      <div className="mb-5">
        <AddPlayerForm allPlayers={sortedPlayers} onAdd={(name) => add(name)} />
      </div>

      {/* AC1, AC3, AC4: Pill grid */}
      {sortedPlayers.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="text-5xl mb-3">👥</div>
          <p className="text-base">ยังไม่มีผู้เล่น<br />เพิ่มชื่อด้านบนได้เลย</p>
        </div>
      ) : (
        <>
          {favorites.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">⭐ รายการโปรด</p>
              <div className="flex flex-wrap gap-2">
                {favorites.map((p) => (
                  <PlayerPill key={p.id} player={p} onToggleFav={toggleFav} onDelete={remove} />
                ))}
              </div>
            </div>
          )}
          {rest.length > 0 && (
            <div>
              {favorites.length > 0 && (
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">ผู้เล่นทั้งหมด</p>
              )}
              <div className="flex flex-wrap gap-2">
                {rest.map((p) => (
                  <PlayerPill key={p.id} player={p} onToggleFav={toggleFav} onDelete={remove} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
