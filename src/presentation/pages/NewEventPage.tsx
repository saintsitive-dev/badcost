import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { usePlayers } from '../context/PlayersContext';
import { createEvent } from '../../domain/usecases/createEvent';
import { LocalStorageEventRepo } from '../../infrastructure/repositories/LocalStorageEventRepo';
import AddPlayerForm from '../components/AddPlayerForm';
import type { Player } from '../../domain/entities/Player';

const repo = new LocalStorageEventRepo();
const QUICK_HOURS = [1, 2, 3, 4];

function toLocalDateTimeValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function PlayerRow({
  player, isSelected, hours,
  onToggle, onHoursChange,
}: {
  player: Player;
  isSelected: boolean;
  hours: number;
  onToggle: () => void;
  onHoursChange: (h: number) => void;
}) {
  return (
    <div className={`rounded-2xl border-2 transition-colors overflow-hidden ${
      isSelected ? 'border-green-500 bg-green-50' : 'border-transparent bg-white'
    }`}>
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
            isSelected ? 'bg-green-600 border-green-600' : 'border-slate-300'
          }`}
          aria-label={isSelected ? 'ยกเลิกเลือก' : 'เลือก'}
        >
          {isSelected && <span className="text-white text-xs font-bold leading-none">✓</span>}
        </button>

        {/* Name — tapping also toggles */}
        <button onClick={onToggle} className="flex-1 text-base font-medium text-slate-800 text-left truncate">
          {player.isFavorite ? '⭐ ' : ''}{player.name}
        </button>

        {/* Per-player hour stepper (only when selected) */}
        {isSelected && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onHoursChange(Math.max(1, hours - 1))}
              className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold flex items-center justify-center active:scale-90 transition-transform shadow-sm text-sm"
            >−</button>
            <span className="w-9 text-center text-sm font-bold text-green-700">{hours}ชม.</span>
            <button
              onClick={() => onHoursChange(hours + 1)}
              className="w-7 h-7 rounded-lg bg-green-100 text-green-700 font-bold flex items-center justify-center active:scale-90 transition-transform text-sm"
            >+</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NewEventPage() {
  const navigate = useNavigate();
  const { sortedPlayers, add } = usePlayers();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [playerHours, setPlayerHours] = useState<Record<string, number>>({});
  const [dateValue, setDateValue] = useState(() => toLocalDateTimeValue(new Date().toISOString()));
  const [bulkHours, setBulkHours] = useState(3);
  const [showAddForm, setShowAddForm] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        // inherit current bulkHours for newly selected player
        setPlayerHours((h) => ({ ...h, [id]: h[id] ?? bulkHours }));
      }
      return next;
    });
  }

  function setHours(id: string, hours: number) {
    setPlayerHours((prev) => ({ ...prev, [id]: hours }));
  }

  /** Set ALL currently selected players to the given hour count */
  function setAllSelectedHours(hours: number) {
    setBulkHours(hours);
    setPlayerHours((prev) => {
      const next = { ...prev };
      selected.forEach((id) => { next[id] = hours; });
      return next;
    });
  }

  function selectAll() {
    const all = new Set(sortedPlayers.map((p) => p.id));
    setSelected(all);
    setPlayerHours((prev) => {
      const next = { ...prev };
      sortedPlayers.forEach((p) => { if (!next[p.id]) next[p.id] = bulkHours; });
      return next;
    });
  }

  function handleStart() {
    if (selected.size === 0) return;
    const ids = [...selected];
    const event = createEvent(ids, new Date(dateValue).toISOString());
    const hours = Object.fromEntries(ids.map((id) => [id, playerHours[id] ?? bulkHours]));
    repo.save({ ...event, playerHours: hours });
    navigate(`/event/${event.id}`);
  }

  const allHoursForSelected = selected.size > 0
    ? [...selected].map((id) => playerHours[id] ?? bulkHours)
    : [];
  const allSameHours = allHoursForSelected.every((h) => h === allHoursForSelected[0]);
  const displayBulk = allSameHours && allHoursForSelected.length > 0 ? allHoursForSelected[0] : bulkHours;

  return (
    <div>
      <PageHeader title="เกมใหม่ 🏸" subtitle="เลือกผู้เล่นและชั่วโมง" />

      {/* Date/time picker */}
      <div className="bg-white rounded-2xl px-4 py-3 shadow-sm mb-4">
        <label className="text-sm font-semibold text-slate-500 block mb-1">วันและเวลา</label>
        <input
          type="datetime-local"
          value={dateValue}
          onChange={(e) => setDateValue(e.target.value)}
          className="w-full text-base text-slate-800 focus:outline-none"
        />
      </div>

      {sortedPlayers.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p>ยังไม่มีผู้เล่น</p>
          <p className="text-sm mt-1">ไปเพิ่มผู้เล่นในแท็บ "ผู้เล่น" ก่อนนะ</p>
        </div>
      ) : (
        <>
          {/* Toolbar: select-all + bulk hour setter */}
          <div className="bg-white rounded-2xl shadow-sm px-4 py-3 mb-3 flex flex-col gap-3">
            {/* Row 1: select all */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">เลือก {selected.size}/{sortedPlayers.length} คน</span>
              <button onClick={selectAll} className="text-sm text-green-600 font-semibold">
                เลือกทั้งหมด
              </button>
            </div>

            {/* Row 2: bulk hours — only shown when ≥1 selected */}
            {selected.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600 shrink-0">ตั้งทุกคน:</span>
                {/* Quick-tap buttons */}
                <div className="flex gap-1.5 flex-1">
                  {QUICK_HOURS.map((h) => (
                    <button
                      key={h}
                      onClick={() => setAllSelectedHours(h)}
                      className={`flex-1 h-9 rounded-xl text-sm font-bold transition-colors ${
                        displayBulk === h && allSameHours
                          ? 'bg-green-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {h}ชม.
                    </button>
                  ))}
                </div>
                {/* Manual stepper for other values */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setAllSelectedHours(Math.max(1, displayBulk - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center justify-center active:scale-90 transition-transform"
                  >−</button>
                  <button
                    onClick={() => setAllSelectedHours(displayBulk + 1)}
                    className="w-8 h-8 rounded-lg bg-green-100 text-green-700 font-bold flex items-center justify-center active:scale-90 transition-transform"
                  >+</button>
                </div>
              </div>
            )}
          </div>

          {/* Player list */}
          <div className="flex flex-col gap-2 mb-4">
            {sortedPlayers.map((p) => (
              <PlayerRow
                key={p.id}
                player={p}
                isSelected={selected.has(p.id)}
                hours={playerHours[p.id] ?? bulkHours}
                onToggle={() => toggle(p.id)}
                onHoursChange={(h) => setHours(p.id, h)}
              />
            ))}
          </div>

          {/* AC13: add player on-the-spot */}
          <div className="mb-6">
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className="w-full h-10 border-2 border-dashed border-slate-300 text-slate-500 rounded-2xl text-sm font-semibold active:scale-95 transition-transform"
            >
              {showAddForm ? '✕ ยกเลิก' : '+ เพิ่มผู้เล่น'}
            </button>
            {showAddForm && (
              <div className="mt-2">
                <AddPlayerForm
                  allPlayers={sortedPlayers}
                  autoFocus
                  onAdd={(name) => {
                    const newPlayer = add(name);
                    setSelected((prev) => new Set([...prev, newPlayer.id]));
                    setPlayerHours((prev) => ({ ...prev, [newPlayer.id]: bulkHours }));
                    setShowAddForm(false);
                  }}
                />
              </div>
            )}
          </div>
        </>
      )}

      <div className="sticky bottom-24">
        <button
          onClick={handleStart}
          disabled={selected.size === 0}
          className="w-full h-14 bg-green-600 disabled:bg-slate-200 disabled:text-slate-400 text-white text-lg font-bold rounded-2xl shadow-md active:scale-[0.98] transition-all"
        >
          {selected.size === 0 ? 'เลือกผู้เล่นก่อน' : `เริ่มเกม (${selected.size} คน) →`}
        </button>
      </div>
    </div>
  );
}
