import { useState } from 'react';
import { findSimilarPlayers } from '../../domain/usecases/managePlayers';
import type { Player } from '../../domain/entities/Player';

interface Props {
  allPlayers: Player[];
  onAdd: (name: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

/**
 * AC14: Reusable add-player form with duplicate prevention.
 * - Shows a suggestion dropdown (substring match) while typing.
 * - Disables "เพิ่ม" and shows an error when the trimmed name exactly
 *   matches an existing player (case-insensitive).
 * Used by PlayersPage and the inline form in NewEventPage (AC13).
 */
export default function AddPlayerForm({
  allPlayers,
  onAdd,
  placeholder = 'ชื่อผู้เล่น (ไทย / English)',
  autoFocus = false,
}: Props) {
  const [name, setName] = useState('');
  const [focused, setFocused] = useState(false);

  const trimmed = name.trim();
  const suggestions = trimmed ? findSimilarPlayers(allPlayers, trimmed).slice(0, 5) : [];
  const isExactDuplicate = allPlayers.some(
    (p) => p.name.toLowerCase() === trimmed.toLowerCase(),
  );
  const canAdd = trimmed.length > 0 && !isExactDuplicate;
  const showDropdown = focused && suggestions.length > 0;

  function handleAdd() {
    if (!canAdd) return;
    onAdd(trimmed);
    setName('');
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          autoFocus={autoFocus}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={placeholder}
          className="flex-1 h-12 px-4 rounded-2xl border border-slate-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={handleAdd}
          disabled={!canAdd}
          className="h-12 px-5 bg-green-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl text-base font-semibold active:scale-95 transition-transform shadow-sm"
        >
          เพิ่ม
        </button>
      </div>

      {trimmed && isExactDuplicate && (
        <p className="text-red-500 text-sm mt-1.5 px-1">⚠️ ชื่อนี้มีอยู่แล้ว</p>
      )}

      {showDropdown && (
        <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
          <p className="px-4 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100">
            ชื่อที่คล้ายกัน
          </p>
          {suggestions.map((p) => (
            <div
              key={p.id}
              className="px-4 py-2.5 text-sm text-slate-700 border-b border-slate-100 last:border-0"
            >
              {p.isFavorite ? '⭐ ' : ''}{p.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
