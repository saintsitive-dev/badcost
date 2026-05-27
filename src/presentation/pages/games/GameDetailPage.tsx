import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  subscribeToGame,
  subscribeToParticipants,
  joinGame,
  leaveGame,
  addParticipantByHost,
  removeParticipant,
  updateGame,
} from '../../../infrastructure/repositories/FirestoreGameRepo';
import { getCurrentUser } from '../../../infrastructure/firebase';
import { getDeviceId, getUserName, setUserName } from '../../../infrastructure/firebase/session';
import { formatGameDateThai, isGameFull } from '../../../domain/entities/Game';
import type { Game, Participant } from '../../../domain/entities/Game';
import { GamePageContainer, Card, PrimaryButton, LoadingScreen, EmptyState } from '../../components/games';

export default function GameDetailPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [addName, setAddName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [joinName, setJoinName] = useState('');

  const deviceId = getDeviceId();
  const userName = getUserName();
  const currentUser = getCurrentUser();
  const isHost = currentUser && game?.hostId === currentUser.uid;
  const myParticipant = participants.find(p => p.deviceId === deviceId);
  const isFull = game ? isGameFull(game, participants.length) : false;

  useEffect(() => {
    if (!gameId) return;
    const unsubGame = subscribeToGame(gameId, (g) => { setGame(g); setLoading(false); });
    const unsubParticipants = subscribeToParticipants(gameId, setParticipants);
    return () => { unsubGame(); unsubParticipants(); };
  }, [gameId]);

  async function handleJoin() {
    if (!gameId || !userName) return;
    setJoining(true);
    try {
      await joinGame(gameId, userName, deviceId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เข้าร่วมไม่สำเร็จ';
      alert(msg === 'Game is full' ? 'เต็มแล้ว 📌' : msg);
    } finally {
      setJoining(false);
    }
  }

  async function handleLeave() {
    if (!gameId || !myParticipant) return;
    if (!confirm('ออกจากเกมนี้?')) return;
    await leaveGame(gameId, myParticipant.id).catch(console.error);
  }

  async function handleAddPlayer(e: React.FormEvent) {
    e.preventDefault();
    if (!gameId || !addName.trim()) return;
    try {
      await addParticipantByHost(gameId, addName.trim());
      setAddName('');
      setShowAddForm(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เพิ่มไม่สำเร็จ';
      alert(msg);
    }
  }

  async function handleRemove(participantId: string) {
    if (!gameId || !confirm('ลบผู้เล่นนี้?')) return;
    await removeParticipant(gameId, participantId).catch(console.error);
  }

  async function handleUpdateMax() {
    if (!gameId || !game) return;
    const newMax = prompt('จำนวนคนสูงสุดใหม่ (ว่าง = ไม่จำกัด)', game.maxPlayers?.toString() || '');
    if (newMax === null) return;
    const maxPlayers = newMax.trim() ? Number(newMax) : null;
    await updateGame(gameId, { maxPlayers } as Partial<Game>).catch(console.error);
  }

  function copyInviteLink() {
    if (!game) return;
    const base = import.meta.env.BASE_URL;
    const link = `${window.location.origin}${base}games/invite/${game.inviteCode}`;
    navigator.clipboard.writeText(link);
    alert('คัดลอกลิงก์แล้ว! 📋');
  }

  if (loading) return <LoadingScreen />;
  if (!game) return <EmptyState title="ไม่พบเกม" />;

  const emptySlots = game.maxPlayers ? Math.max(0, game.maxPlayers - participants.length) : 0;

  return (
    <GamePageContainer>
      {/* Back navigation */}
      <button
        onClick={() => navigate('/games/manage')}
        className="text-sm text-slate-500 mb-3 flex items-center gap-1 active:text-slate-700"
      >
        ← กลับหน้ารายการ
      </button>

      {/* Game Info */}
      <Card className="mb-4">
        <h1 className="text-lg font-bold text-slate-800">{game.title} สนาม: {game.venue}</h1>
        <div className="mt-2 space-y-1 text-sm text-slate-600">
          <p>📅 วันที่เล่น : {formatGameDateThai(game.date)}</p>
          <p>⏰ เวลา : {game.startTime}-{game.endTime}</p>
          <p>⏱ จำนวนชั่วโมง : {game.hours} ชม.</p>
          {game.courts && <p>🏸 จำนวนคอร์ด : {game.courts}</p>}
          {game.zone && <p>📍 โซน : {game.zone}</p>}
          {game.maxPlayers && <p>📌 Max : {game.maxPlayers}</p>}
        </div>

        {isHost && (
          <HostActions
            onCopyLink={copyInviteLink}
            onEditMax={handleUpdateMax}
            onConvert={() => navigate(`/games/${game.id}/start-cost`)}
          />
        )}
      </Card>

      {/* Participant List */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800">
            🌟 ใครสนใจลงชื่อ ({participants.length}{game.maxPlayers ? `/${game.maxPlayers}` : ''})
          </h2>
          {isFull && <span className="text-xs bg-red-100 text-red-600 rounded-full px-2 py-0.5">เต็มแล้ว 📌</span>}
        </div>

        <ParticipantList
          participants={participants}
          emptySlots={emptySlots}
          deviceId={deviceId}
          onRemove={handleRemove}
        />

        {/* Host: Add participant */}
        {isHost && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            {showAddForm ? (
              <form onSubmit={handleAddPlayer} className="flex gap-2">
                <input
                  type="text"
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  placeholder="ชื่อผู้เล่น"
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                  autoFocus
                />
                <button type="submit" className="bg-emerald-500 text-white rounded-lg px-3 py-2 text-sm">เพิ่ม</button>
                <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 text-sm">ยกเลิก</button>
              </form>
            ) : (
              <button onClick={() => setShowAddForm(true)} className="text-sm text-emerald-600 font-medium">
                + เพิ่มผู้เล่น
              </button>
            )}
          </div>
        )}

        {/* Participant: Join/Leave */}
        {!isHost && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            {myParticipant ? (
              <button
                onClick={handleLeave}
                className="w-full bg-red-50 text-red-600 font-medium rounded-xl py-3 hover:bg-red-100 active:scale-[0.98] transition"
              >
                ออกจากเกม
              </button>
            ) : !userName ? (
              <form onSubmit={async (e) => {
                e.preventDefault();
                const trimmed = joinName.trim();
                if (!trimmed || !gameId) return;
                setUserName(trimmed);
                setJoining(true);
                try {
                  await joinGame(gameId, trimmed, deviceId);
                } catch (err: unknown) {
                  const msg = err instanceof Error ? err.message : 'เข้าร่วมไม่สำเร็จ';
                  alert(msg === 'Game is full' ? 'เต็มแล้ว 📌' : msg);
                } finally {
                  setJoining(false);
                }
              }} className="space-y-2">
                <input
                  type="text"
                  value={joinName}
                  onChange={e => setJoinName(e.target.value)}
                  placeholder="ใส่ชื่อของคุณ"
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base focus:border-emerald-400 focus:outline-none"
                  required
                />
                <PrimaryButton type="submit" disabled={joining || isFull || !joinName.trim()}>
                  {joining ? 'กำลังเข้าร่วม...' : isFull ? 'เต็มแล้ว 📌' : '🌟 ลงชื่อเข้าร่วม'}
                </PrimaryButton>
              </form>
            ) : (
              <PrimaryButton onClick={handleJoin} disabled={joining || isFull}>
                {joining ? 'กำลังเข้าร่วม...' : isFull ? 'เต็มแล้ว 📌' : '🌟 ลงชื่อเข้าร่วม'}
              </PrimaryButton>
            )}
          </div>
        )}

        {/* Non-host: Add other player */}
        {!isHost && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            {showAddForm ? (
              <form onSubmit={handleAddPlayer} className="flex gap-2">
                <input
                  type="text"
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  placeholder="ชื่อผู้เล่นที่ต้องการเพิ่ม"
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                  autoFocus
                />
                <button type="submit" className="bg-emerald-500 text-white rounded-lg px-3 py-2 text-sm">เพิ่ม</button>
                <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 text-sm">ยกเลิก</button>
              </form>
            ) : (
              <button onClick={() => setShowAddForm(true)} className="text-sm text-emerald-600 font-medium">
                + เพิ่มผู้เล่นคนอื่น
              </button>
            )}
          </div>
        )}
      </Card>
    </GamePageContainer>
  );
}

function HostActions({ onCopyLink, onEditMax, onConvert }: {
  onCopyLink: () => void;
  onEditMax: () => void;
  onConvert: () => void;
}) {
  return (
    <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
      <button onClick={onCopyLink} className="text-xs bg-blue-50 text-blue-600 rounded-lg px-3 py-1.5 active:scale-95 transition">
        📋 คัดลอกลิงก์
      </button>
      <button onClick={onEditMax} className="text-xs bg-slate-50 text-slate-600 rounded-lg px-3 py-1.5 active:scale-95 transition">
        ✏️ แก้ Max
      </button>
      <button onClick={onConvert} className="text-xs bg-emerald-50 text-emerald-600 rounded-lg px-3 py-1.5 active:scale-95 transition">
        💰 คิดค่าแบด
      </button>
    </div>
  );
}

function ParticipantList({ participants, emptySlots, deviceId, onRemove }: {
  participants: Participant[];
  emptySlots: number;
  deviceId: string;
  onRemove: (id: string) => void;
}) {
  return (
    <ol className="space-y-1">
      {participants.map((p, i) => (
        <li key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50">
          <span className="text-slate-700">
            <span className="text-slate-400 mr-2">{i + 1}.</span>
            {p.name}
            {p.deviceId === deviceId && <span className="text-xs text-emerald-500 ml-1">(คุณ)</span>}
          </span>
          <button onClick={() => onRemove(p.id)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
        </li>
      ))}
      {Array.from({ length: emptySlots }).map((_, i) => (
        <li key={`empty-${i}`} className="py-1.5 px-2 text-slate-300">
          <span className="mr-2">{participants.length + i + 1}.</span>
        </li>
      ))}
    </ol>
  );
}
