import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { usePlayers } from '../context/PlayersContext';
import { useEventData } from '../hooks/useEventData';
import { calculateCourtCost } from '../../domain/usecases/calculateCourtCost';
import { calculateShuttlecockCost } from '../../domain/usecases/calculateShuttlecockCost';
import { calculateOrganizerFee } from '../../domain/usecases/calculateOrganizerFee';
import { calculateTotalCost } from '../../domain/usecases/calculateTotalCost';
import { formatShareText } from '../../domain/usecases/formatShareText';
import type { CostBreakdown } from '../../domain/entities/CostBreakdown';

function CostRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-sm py-0.5">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-700">{value} ฿</span>
    </div>
  );
}

function PlayerResult({ b, rank }: { b: CostBreakdown; rank: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50"
      >
        <span className="w-7 h-7 rounded-full bg-green-100 text-green-700 font-bold text-sm flex items-center justify-center shrink-0">
          {rank}
        </span>
        <span className="flex-1 text-base font-semibold text-slate-900 truncate">{b.playerName}</span>
        <span className="text-sm text-slate-400 mr-1">{b.hours} ชม.</span>
        <span className="text-xl font-bold text-green-700">{b.total} ฿</span>
        <span className="text-slate-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-3 pt-1 border-t border-slate-100">
          <CostRow label="ค่าสนาม" value={b.courtCost} />
          <CostRow label="ค่าลูก" value={b.shuttlecockCost} />
          <CostRow label="ค่าจัดการ" value={b.organizerCost} />
        </div>
      )}
    </div>
  );
}

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { event } = useEventData(id!);
  const { players } = usePlayers();
  const [copied, setCopied] = useState(false);

  const breakdown = useMemo(() => {
    if (!event) return [];
    const hasPerHourCourts = Object.values(event.courtsPerHour ?? {}).some((v) => v > 0);
    const courtCosts = calculateCourtCost(
      event.courtCostPerHour,
      event.numCourts ?? 1,
      hasPerHourCourts ? event.courtsPerHour : {},
      event.playerHours,
    );
    const hasPerHourShuttles = Object.values(event.shuttlecocksPerHour).some((v) => v > 0);
    const shuttlecockCosts = calculateShuttlecockCost(
      event.shuttlecockCostPerUnit,
      event.totalShuttlecocks,
      hasPerHourShuttles ? event.shuttlecocksPerHour : {},
      event.playerHours,
    );
    const organizerFees = calculateOrganizerFee(event.organizerFee, event.playerIds);
    return calculateTotalCost(event.playerIds, event.playerHours, courtCosts, shuttlecockCosts, organizerFees, players);
  }, [event, players]);

  if (!event) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p className="text-4xl mb-3">😕</p>
        <p>ไม่พบข้อมูลเกม</p>
      </div>
    );
  }

  const grandTotal = breakdown.reduce((s, b) => s + b.total, 0);
  const dateLabel = new Date(event.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

  async function handleCopy() {
    if (!event) return;
    const text = formatShareText(breakdown, event.date);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback for older browsers
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div>
      <PageHeader title="สรุปค่าใช้จ่าย 🏸" subtitle={dateLabel} backTo={`/event/${id}`} />

      {/* Total badge */}
      <div className="bg-green-600 text-white rounded-2xl px-4 py-4 mb-5 flex items-center justify-between shadow-md">
        <span className="text-base font-medium opacity-90">รวมทั้งหมด</span>
        <span className="text-2xl font-bold">{grandTotal} บาท</span>
      </div>

      {/* Per-player results */}
      <div className="mb-24">
        {breakdown.map((b, i) => (
          <PlayerResult key={b.playerId} b={b} rank={i + 1} />
        ))}
      </div>

      {/* Sticky action buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-40">
        <div className="max-w-md mx-auto px-4 pt-3 pb-2 flex gap-3">
          <button
            onClick={() => navigate(`/event/${id}`)}
            className="flex-1 h-12 border-2 border-slate-200 text-slate-700 rounded-2xl font-semibold text-base active:scale-95 transition-transform"
          >
            ← แก้ไข
          </button>
          <button
            onClick={handleCopy}
            className={`flex-1 h-12 rounded-2xl font-bold text-base active:scale-95 transition-all shadow-sm ${
              copied ? 'bg-slate-700 text-white' : 'bg-green-600 text-white'
            }`}
          >
            {copied ? '✓ คัดลอกแล้ว!' : '📋 Copy สำหรับ LINE'}
          </button>
        </div>
      </div>
    </div>
  );
}
