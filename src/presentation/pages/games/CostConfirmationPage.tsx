import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGameById, subscribeToParticipants } from '../../../infrastructure/repositories/FirestoreGameRepo';
import { LocalStorageEventRepo } from '../../../infrastructure/repositories/LocalStorageEventRepo';
import { usePlayers } from '../../context/PlayersContext';
import type { Game, Participant } from '../../../domain/entities/Game';
import type { GameEvent } from '../../../domain/entities/GameEvent';
import { GamePageContainer, Card, PrimaryButton, SecondaryButton, LoadingScreen, EmptyState } from '../../components/games';

const eventRepo = new LocalStorageEventRepo();

export default function CostConfirmationPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { players, add: addPlayerToContext } = usePlayers();
  const [game, setGame] = useState<Game | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Track which participants are included and their hours
  const [included, setIncluded] = useState<Record<string, boolean>>({});
  const [hours, setHours] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!gameId) return;
    getGameById(gameId).then(g => { setGame(g); setLoading(false); });
    const unsub = subscribeToParticipants(gameId, (p) => {
      setParticipants(p);
      // Initialize included/hours for new participants
      setIncluded(prev => {
        const next = { ...prev };
        p.forEach(pt => { if (!(pt.id in next)) next[pt.id] = true; });
        return next;
      });
      setHours(prev => {
        const next = { ...prev };
        p.forEach(pt => { if (!(pt.id in next)) next[pt.id] = 2; });
        return next;
      });
    });
    return unsub;
  }, [gameId]);

  // Re-set default hours when game loads
  useEffect(() => {
    if (!game) return;
    setHours(prev => {
      const next = { ...prev };
      participants.forEach(pt => { if (!(pt.id in next)) next[pt.id] = game.hours || 2; });
      return next;
    });
  }, [game, participants]);

  function toggleInclude(participantId: string) {
    setIncluded(prev => ({ ...prev, [participantId]: !prev[participantId] }));
  }

  function adjustHours(participantId: string, delta: number) {
    setHours(prev => ({
      ...prev,
      [participantId]: Math.max(1, (prev[participantId] || 1) + delta),
    }));
  }

  async function handleStart() {
    if (!game || !gameId) return;
    setSubmitting(true);

    try {
      const selectedParticipants = participants.filter(p => included[p.id]);
      const playerIds: string[] = [];
      const playerHours: Record<string, number> = {};

      for (const p of selectedParticipants) {
        let existing = players.find(pl => pl.name.toLowerCase() === p.name.toLowerCase());
        if (!existing) {
          existing = addPlayerToContext(p.name);
        }
        playerIds.push(existing.id);
        playerHours[existing.id] = hours[p.id] || game.hours || 1;
      }

      const newEvent: GameEvent = {
        id: crypto.randomUUID(),
        date: new Date(`${game.date}T${game.startTime}`).toISOString(),
        playerIds,
        playerHours,
        courtCostPerHour: 0,
        numCourts: parseInt(game.courts) || 1,
        courtsPerHour: {},
        shuttlecockCostPerUnit: 0,
        totalShuttlecocks: 0,
        shuttlecocksPerHour: {},
        shuttlecockTiers: [],
        organizerFee: 0,
        isFinalized: false,
        createdAt: new Date().toISOString(),
      };

      eventRepo.save(newEvent);
      navigate(`/event/${newEvent.id}`, { replace: true });
    } catch (err) {
      console.error('Failed to start cost calculation:', err);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingScreen />;
  if (!game) return <EmptyState title="ไม่พบเกม" />;

  const selectedCount = participants.filter(p => included[p.id]).length;

  return (
    <GamePageContainer>
      <Card>
        <h1 className="text-lg font-bold text-slate-800 mb-1">💰 คิดค่าแบด</h1>
        <p className="text-sm text-slate-500 mb-4">
          เลือกผู้เล่นและปรับชั่วโมงก่อนเริ่มคิดค่าใช้จ่าย
        </p>

        {/* Player list with hours */}
        <div className="space-y-2 mb-4">
          {participants.map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                included[p.id] ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-100 bg-slate-50 opacity-50'
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleInclude(p.id)}
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                  included[p.id] ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'
                }`}
              >
                {included[p.id] && '✓'}
              </button>

              {/* Name */}
              <span className="flex-1 text-slate-800 font-medium truncate">{p.name}</span>

              {/* Hours stepper */}
              {included[p.id] && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => adjustHours(p.id, -1)}
                    disabled={hours[p.id] <= 1}
                    className="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold disabled:opacity-30"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-medium text-slate-700">
                    {hours[p.id] || game.hours}
                  </span>
                  <button
                    onClick={() => adjustHours(p.id, 1)}
                    className="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold"
                  >
                    +
                  </button>
                  <span className="text-xs text-slate-400 ml-1">ชม.</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {participants.length === 0 && (
          <div className="text-center py-6 text-slate-400 text-sm">
            ยังไม่มีผู้เล่น กลับไปเพิ่มคนก่อน
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <SecondaryButton onClick={() => navigate(`/games/${gameId}`)} className="flex-1">
            ← กลับ
          </SecondaryButton>
          <PrimaryButton onClick={handleStart} disabled={submitting || selectedCount === 0}>
            {submitting ? 'กำลังสร้าง...' : `เริ่มคิดค่าแบด (${selectedCount} คน) →`}
          </PrimaryButton>
        </div>
      </Card>
    </GamePageContainer>
  );
}
