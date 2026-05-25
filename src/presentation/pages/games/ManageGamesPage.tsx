import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGamesByHost, deleteGame } from '../../../infrastructure/repositories/FirestoreGameRepo';
import { onAuthChange } from '../../../infrastructure/firebase';
import { formatGameDateThai } from '../../../domain/entities/Game';
import type { Game } from '../../../domain/entities/Game';
import { GamePageContainer, Card, LoadingScreen } from '../../components/games';

export default function ManageGamesPage() {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (!user) {
        navigate('/games/login');
        return;
      }
      try {
        const hostGames = await getGamesByHost(user.uid);
        setGames(hostGames);
      } catch (err) {
        console.error('Failed to load games:', err);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [navigate]);

  async function handleDelete(gameId: string) {
    if (!confirm('ลบเกมนี้? ข้อมูลผู้เข้าร่วมจะหายหมด')) return;
    try {
      await deleteGame(gameId);
      setGames(prev => prev.filter(g => g.id !== gameId));
    } catch (err) {
      console.error('Failed to delete game:', err);
      alert('ลบไม่สำเร็จ');
    }
  }

  function copyInviteLink(inviteCode: string) {
    const base = import.meta.env.BASE_URL;
    const link = `${window.location.origin}${base}games/invite/${inviteCode}`;
    navigator.clipboard.writeText(link);
    alert('คัดลอกลิงก์แล้ว! 📋');
  }

  if (loading) return <LoadingScreen />;

  return (
    <GamePageContainer>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-800">🏸 เกมของฉัน</h1>
        <button
          onClick={() => navigate('/games/create')}
          className="bg-emerald-500 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-emerald-600 active:scale-95 transition"
        >
          + สร้างเกม
        </button>
      </div>

      {games.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-slate-400">ยังไม่มีเกม</p>
          <p className="text-sm text-slate-400 mt-1">กดปุ่ม "สร้างเกม" เพื่อเริ่มต้น</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {games.map(game => (
            <GameCard
              key={game.id}
              game={game}
              onView={() => navigate(`/games/${game.id}`)}
              onCopyLink={() => copyInviteLink(game.inviteCode)}
              onDelete={() => handleDelete(game.id)}
            />
          ))}
        </div>
      )}
    </GamePageContainer>
  );
}

function GameCard({ game, onView, onCopyLink, onDelete }: {
  game: Game;
  onView: () => void;
  onCopyLink: () => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1 cursor-pointer" onClick={onView}>
          <div className="font-medium text-slate-800">{game.title}</div>
          <div className="text-sm text-slate-500 mt-1">📍 {game.venue}</div>
          <div className="text-sm text-slate-500">📅 {formatGameDateThai(game.date)}</div>
          <div className="text-sm text-slate-500">⏰ {game.startTime}-{game.endTime}</div>
        </div>
        <StatusBadge status={game.status} />
      </div>

      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
        <button onClick={onCopyLink} className="flex-1 text-sm bg-blue-50 text-blue-600 rounded-lg py-2 hover:bg-blue-100 active:scale-95 transition">
          📋 คัดลอกลิงก์
        </button>
        <button onClick={onView} className="flex-1 text-sm bg-slate-50 text-slate-600 rounded-lg py-2 hover:bg-slate-100 active:scale-95 transition">
          👁 ดูรายละเอียด
        </button>
        <button onClick={onDelete} className="text-sm bg-red-50 text-red-500 rounded-lg px-3 py-2 hover:bg-red-100 active:scale-95 transition">
          🗑
        </button>
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: Game['status'] }) {
  const config: Record<Game['status'], string> = {
    open: '🟢 เปิดรับ',
    full: '🔴 เต็ม',
    closed: '⚫ ปิดแล้ว',
  };
  return <span className="text-xs whitespace-nowrap">{config[status]}</span>;
}
