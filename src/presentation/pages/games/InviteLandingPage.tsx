import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGameByInviteCode } from '../../../infrastructure/repositories/FirestoreGameRepo';
import { getDeviceId, getUserName, setUserName } from '../../../infrastructure/firebase/session';
import { isGameVisible } from '../../../domain/entities/Game';
import type { Game } from '../../../domain/entities/Game';
import { GamePageContainer, Card, PrimaryButton, LoadingScreen, EmptyState } from '../../components/games';

export default function InviteLandingPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(getUserName() || '');
  const showNameInput = !getUserName();

  useEffect(() => {
    if (!inviteCode) return;
    async function load() {
      try {
        const foundGame = await getGameByInviteCode(inviteCode!);
        if (foundGame && isGameVisible(foundGame)) {
          setGame(foundGame);
          if (getUserName()) {
            navigate(`/games/${foundGame.id}`, { replace: true });
            return;
          }
        }
      } catch (err) {
        console.error('Failed to load game:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [inviteCode, navigate]);

  function handleSubmitName(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setUserName(trimmed);
    getDeviceId();
    if (game) {
      navigate(`/games/${game.id}`, { replace: true });
    }
  }

  if (loading) return <LoadingScreen />;
  if (!game) return <EmptyState title="ไม่พบเกม" subtitle="ลิงก์นี้อาจหมดอายุหรือเกมถูกลบแล้ว" />;

  if (showNameInput) {
    return (
      <GamePageContainer centered>
        <Card className="max-w-sm mx-auto">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">🏸</div>
            <h1 className="text-lg font-bold text-slate-800">{game.title}</h1>
            <p className="text-slate-500 text-sm">📍 {game.venue}</p>
          </div>

          <form onSubmit={handleSubmitName} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                ใส่ชื่อของคุณ
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="ชื่อที่จะแสดงในลิสต์"
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-lg focus:border-emerald-400 focus:outline-none"
                autoFocus
                required
              />
            </div>
            <PrimaryButton type="submit" disabled={!name.trim()}>
              เข้าร่วม →
            </PrimaryButton>
          </form>
        </Card>
      </GamePageContainer>
    );
  }

  return null;
}
