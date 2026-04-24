import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { usePlayers } from '../context/PlayersContext';
import { useEventData } from '../hooks/useEventData';
import { calculateCourtCost } from '../../domain/usecases/calculateCourtCost';
import { calculateShuttlecockCost } from '../../domain/usecases/calculateShuttlecockCost';
import { calculateOrganizerFee } from '../../domain/usecases/calculateOrganizerFee';
import { calculateTotalCost } from '../../domain/usecases/calculateTotalCost';
import type { ShuttlecockTier } from '../../domain/entities/GameEvent';

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm mb-4 overflow-hidden">
      <div className="px-4 py-3 bg-green-50 border-b border-green-100">
        <h2 className="text-sm font-bold text-green-700 uppercase tracking-wide">{title}</h2>
      </div>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

function NumberInput({
  label, value, onChange, unit = 'บาท', min = 0, hint,
}: { label: string; value: number; onChange: (v: number) => void; unit?: string; min?: number; hint?: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center gap-2">
        <label className="flex-1 text-sm font-medium text-slate-700">{label}</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={min}
            value={value || ''}
            onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
            placeholder="0"
            className="w-24 h-10 px-3 text-right text-base rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <span className="text-sm text-slate-500 w-8">{unit}</span>
        </div>
      </div>
      {hint && <p className="text-xs text-slate-400 mt-1 text-right pr-16">{hint}</p>}
    </div>
  );
}

function CountStepper({ label, value, onChange, unit }: { label: string; value: number; onChange: (v: number) => void; unit: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 last:mb-0">
      <span className="flex-1 text-sm font-medium text-slate-700">{label}</span>
      <div className="flex items-center gap-2">
        <button onClick={() => onChange(Math.max(1, value - 1))}
          className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-lg flex items-center justify-center active:scale-90 transition-transform">−</button>
        <span className="w-12 text-center text-base font-bold text-slate-900">{value}</span>
        <button onClick={() => onChange(value + 1)}
          className="w-9 h-9 rounded-xl bg-green-100 text-green-700 font-bold text-lg flex items-center justify-center active:scale-90 transition-transform">+</button>
        <span className="text-sm text-slate-500 w-12">{unit}</span>
      </div>
    </div>
  );
}

function Toggle({ label, enabled, onToggle }: { label: string; enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 text-sm mt-2 font-medium transition-colors ${enabled ? 'text-green-600' : 'text-slate-400'}`}
    >
      <span className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${enabled ? 'bg-green-500' : 'bg-slate-200'}`}>
        <span className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
      </span>
      {label}
    </button>
  );
}

function HoursStepper({ name, hours, onChange }: { name: string; hours: number; onChange: (h: number) => void }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <span className="flex-1 text-base text-slate-800 truncate">{name}</span>
      <div className="flex items-center gap-2">
        <button onClick={() => onChange(Math.max(1, hours - 1))}
          className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-lg flex items-center justify-center active:scale-90 transition-transform">−</button>
        <span className="w-10 text-center text-base font-semibold text-slate-900">{hours} ชม.</span>
        <button onClick={() => onChange(hours + 1)}
          className="w-8 h-8 rounded-lg bg-green-100 text-green-700 font-bold text-lg flex items-center justify-center active:scale-90 transition-transform">+</button>
      </div>
    </div>
  );
}

function PerHourInput({
  value, onChange, label, unit,
}: { value: number; onChange: (v: number) => void; label: string; unit: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 last:mb-0">
      <label className="flex-1 text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={value || ''}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          placeholder="0"
          className="w-20 h-10 px-3 text-right text-base rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <span className="text-sm text-slate-500 w-12">{unit}</span>
      </div>
    </div>
  );
}

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { event, update } = useEventData(id!);
  const { players } = usePlayers();
  const [perHourCourts, setPerHourCourts] = useState(false);
  const [perHourShuttles, setPerHourShuttles] = useState(false);

  if (!event) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p className="text-4xl mb-3">😕</p><p>ไม่พบข้อมูลเกม</p>
      </div>
    );
  }

  const eventPlayers = players.filter((p) => event.playerIds.includes(p.id));
  const maxHours = Math.max(...Object.values(event.playerHours), 1);
  const hourTiers = Array.from({ length: maxHours }, (_, i) => i + 1);

  // Players present in hour N using last-N model
  const playersAtHour = (hour: number) =>
    eventPlayers.filter((p) => (event.playerHours[p.id] ?? 1) >= maxHours - hour + 1);

  const numCourts = event.numCourts ?? 1;
  const totalCourtPerHour = numCourts * event.courtCostPerHour;

  // Tiers: use stored tiers, or auto-migrate from legacy single-price fields
  const storedTiers = event.shuttlecockTiers ?? [];
  const effectiveTiers: ShuttlecockTier[] = storedTiers.length > 0
    ? storedTiers
    : (event.shuttlecockCostPerUnit > 0 || event.totalShuttlecocks > 0)
      ? [{ price: event.shuttlecockCostPerUnit, count: event.totalShuttlecocks }]
      : [{ price: 0, count: 0 }];

  const totalShuttlecockCost = effectiveTiers.reduce((s, t) => s + t.price * t.count, 0);
  const totalShuttlecockCount = effectiveTiers.reduce((s, t) => s + t.count, 0);

  function updateTier(index: number, field: 'price' | 'count', value: number) {
    if (!event) return;
    const next = effectiveTiers.map((t, i) => i === index ? { ...t, [field]: value } : t);
    update({ ...event, shuttlecockTiers: next });
  }
  function addTier() {
    if (!event) return;
    update({ ...event, shuttlecockTiers: [...effectiveTiers, { price: 0, count: 0 }] });
  }
  function removeTier(index: number) {
    if (!event) return;
    const next = effectiveTiers.filter((_, i) => i !== index);
    update({ ...event, shuttlecockTiers: next.length > 0 ? next : [{ price: 0, count: 0 }] });
  }

  const courtCosts = useMemo(
    () => calculateCourtCost(
      event.courtCostPerHour,
      event.numCourts ?? 1,
      perHourCourts ? event.courtsPerHour : {},
      event.playerHours,
    ),
    [event.courtCostPerHour, event.numCourts, event.courtsPerHour, event.playerHours, perHourCourts],
  );
  const shuttlecockCosts = useMemo(
    () => calculateShuttlecockCost(
      effectiveTiers,
      perHourShuttles ? event.shuttlecocksPerHour : {},
      event.playerHours,
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [totalShuttlecockCost, totalShuttlecockCount, event.shuttlecocksPerHour, event.playerHours, perHourShuttles],
  );
  const organizerFees = useMemo(
    () => calculateOrganizerFee(event.organizerFee, event.playerIds),
    [event.organizerFee, event.playerIds],
  );
  const breakdown = useMemo(
    () => calculateTotalCost(event.playerIds, event.playerHours, courtCosts, shuttlecockCosts, organizerFees, players),
    [event.playerIds, event.playerHours, courtCosts, shuttlecockCosts, organizerFees, players],
  );

  function setHours(playerId: string, hours: number) {
    if (!event) return;
    update({ ...event, playerHours: { ...event.playerHours, [playerId]: hours } });
  }
  function setCourtsForHour(hour: number, courts: number) {
    if (!event) return;
    update({ ...event, courtsPerHour: { ...event.courtsPerHour, [String(hour)]: courts } });
  }
  function setShuttlesForHour(hour: number, count: number) {
    if (!event) return;
    update({ ...event, shuttlecocksPerHour: { ...event.shuttlecocksPerHour, [String(hour)]: count } });
  }

  const dateLabel = new Date(event.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div>
      <PageHeader title="คำนวณค่าใช้จ่าย" subtitle={dateLabel} backTo="/history" />

      {/* Hours per player */}
      <SectionCard title="⏱ ชั่วโมงที่เล่น">
        {eventPlayers.map((p) => (
          <HoursStepper
            key={p.id}
            name={p.name}
            hours={event.playerHours[p.id] ?? 1}
            onChange={(h) => setHours(p.id, h)}
          />
        ))}
      </SectionCard>

      {/* Court cost — AC6 */}
      <SectionCard title="🏟 ค่าสนาม">
        <NumberInput
          label="ราคาต่อคอร์ตต่อชม."
          value={event.courtCostPerHour}
          onChange={(v) => update({ ...event, courtCostPerHour: v })}
        />
        <CountStepper
          label="จำนวนคอร์ต"
          value={numCourts}
          onChange={(v) => update({ ...event, numCourts: v })}
          unit="คอร์ต"
        />
        {totalCourtPerHour > 0 && (
          <p className="text-xs text-green-700 bg-green-50 rounded-xl px-3 py-2 mb-2">
            💡 รวม {totalCourtPerHour} บาทต่อชม. ({numCourts} คอร์ต × {event.courtCostPerHour} บาท)
          </p>
        )}

        <Toggle
          label="ระบุจำนวนคอร์ตแต่ละชั่วโมง (ถ้าต่างกัน)"
          enabled={perHourCourts}
          onToggle={() => setPerHourCourts((m) => !m)}
        />

        {perHourCourts && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            {hourTiers.map((hour) => {
              const names = playersAtHour(hour).map((p) => p.name).join(', ');
              return (
                <PerHourInput
                  key={hour}
                  value={event.courtsPerHour[String(hour)] ?? 0}
                  onChange={(v) => setCourtsForHour(hour, v)}
                  label={`ชม.ที่ ${hour}`}
                  unit={`คอร์ต (${names})`}
                />
              );
            })}
          </div>
        )}

        {event.courtCostPerHour > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-2">ค่าสนามต่อคน</p>
            {breakdown.map((b) => (
              <div key={b.playerId} className="flex justify-between text-sm py-0.5">
                <span className="text-slate-600">{b.playerName}</span>
                <span className="font-semibold text-slate-800">{b.courtCost} บาท ({b.hours} ชม.)</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Shuttlecock cost — AC7 (multi-tier) */}
      <SectionCard title="🏸 ค่าลูก">
        {/* Tier rows */}
        {effectiveTiers.map((tier, i) => (
          <div key={i} className="flex items-center gap-2 mb-3">
            <span className="text-xs text-slate-400 w-10 shrink-0 text-center">ชุด {i + 1}</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={tier.price || ''}
              onChange={(e) => updateTier(i, 'price', Math.max(0, Number(e.target.value) || 0))}
              placeholder="0"
              className="w-20 h-10 px-3 text-right text-base rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <span className="text-sm text-slate-500">฿/ลูก ×</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={tier.count || ''}
              onChange={(e) => updateTier(i, 'count', Math.max(0, Number(e.target.value) || 0))}
              placeholder="0"
              className="w-16 h-10 px-3 text-right text-base rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <span className="text-sm text-slate-500 flex-1">ลูก</span>
            {effectiveTiers.length > 1 && (
              <button
                onClick={() => removeTier(i)}
                className="w-8 h-8 rounded-lg text-slate-300 hover:text-red-400 flex items-center justify-center text-sm active:scale-90 transition-all"
                aria-label="ลบชุดนี้"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        {/* Add tier button */}
        <button
          onClick={addTier}
          className="w-full h-9 border border-dashed border-slate-300 text-slate-500 rounded-xl text-sm font-medium active:scale-95 transition-transform mb-2"
        >
          + เพิ่มช่วงราคา
        </button>

        {/* Summary hint */}
        {totalShuttlecockCost > 0 && (
          <p className="text-xs text-green-700 bg-green-50 rounded-xl px-3 py-2 mb-2">
            💡 รวม {totalShuttlecockCost} บาท ({totalShuttlecockCount} ลูก)
          </p>
        )}

        <Toggle
          label="ระบุลูกแต่ละชั่วโมง (ถ้าต่างกัน)"
          enabled={perHourShuttles}
          onToggle={() => setPerHourShuttles((m) => !m)}
        />

        {perHourShuttles && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            {hourTiers.map((hour) => {
              const names = playersAtHour(hour).map((p) => p.name).join(', ');
              return (
                <PerHourInput
                  key={hour}
                  value={event.shuttlecocksPerHour[String(hour)] ?? 0}
                  onChange={(v) => setShuttlesForHour(hour, v)}
                  label={`ชม.ที่ ${hour}`}
                  unit={`ลูก (${names})`}
                />
              );
            })}
          </div>
        )}

        {totalShuttlecockCost > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-2">ค่าลูกต่อคน</p>
            {breakdown.map((b) => (
              <div key={b.playerId} className="flex justify-between text-sm py-0.5">
                <span className="text-slate-600">{b.playerName}</span>
                <span className="font-semibold text-slate-800">{b.shuttlecockCost} บาท</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Organizer fee — AC8 */}
      <SectionCard title="📋 ค่าจัดการ">
        <NumberInput
          label="ค่าจัดการรวม"
          value={event.organizerFee}
          onChange={(v) => update({ ...event, organizerFee: v })}
        />
        {event.organizerFee > 0 && (
          <p className="text-sm text-slate-500 mt-1">
            คนละ {Math.ceil(event.organizerFee / event.playerIds.length)} บาท ({event.playerIds.length} คน)
          </p>
        )}
      </SectionCard>

      {/* Live summary */}
      <SectionCard title="💰 สรุปเบื้องต้น">
        {breakdown.map((b) => (
          <div key={b.playerId} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <div>
              <p className="text-base font-semibold text-slate-900">{b.playerName}</p>
              <p className="text-xs text-slate-400">{b.hours} ชม. · สนาม {b.courtCost} + ลูก {b.shuttlecockCost} + จัดการ {b.organizerCost}</p>
            </div>
            <span className="text-lg font-bold text-green-700">{b.total} ฿</span>
          </div>
        ))}
      </SectionCard>

      <button
        onClick={() => {
          update({ ...event, isFinalized: true });
          navigate(`/event/${event.id}/result`);
        }}
        className="w-full h-14 bg-green-600 text-white text-lg font-bold rounded-2xl shadow-md active:scale-[0.98] transition-all mb-4"
      >
        ดูผลลัพธ์ →
      </button>
    </div>
  );
}
