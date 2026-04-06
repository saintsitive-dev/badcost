import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { usePlayers } from '../context/PlayersContext';
import InstallBanner from '../components/InstallBanner';
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
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  function handleAdd() {
    if (!name.trim()) { setError('กรุณาใส่ชื่อผู้เล่น'); return; }
    try {
      add(name.trim());
      setName('');
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const favorites = sortedPlayers.filter((p) => p.isFavorite);
  const rest = sortedPlayers.filter((p) => !p.isFavorite);

  return (
    <div>
      {/* AC1 */}
      <PageHeader title="ผู้เล่น 🏸" subtitle={`ทั้งหมด ${sortedPlayers.length} คน`} />

      {/* PWA install banner */}
      <InstallBanner />

      {/* AC2: Add player form */}
      <div className="flex gap-2 mb-5">
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="ชื่อผู้เล่น (ไทย / English)"
          className="flex-1 h-12 px-4 rounded-2xl border border-slate-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={handleAdd}
          className="h-12 px-5 bg-green-600 text-white rounded-2xl text-base font-semibold active:scale-95 transition-transform shadow-sm"
        >
          เพิ่ม
        </button>
      </div>
      {error && <p className="text-red-500 text-sm -mt-3 mb-3 px-1">{error}</p>}

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
