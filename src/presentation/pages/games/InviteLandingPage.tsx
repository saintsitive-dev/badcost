import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGameByInviteCode } from '../../../infrastructure/repositories/FirestoreGameRepo';
import { isGameVisible } from '../../../domain/entities/Game';
import { LoadingScreen, EmptyState } from '../../components/games';

export default function InviteLandingPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!inviteCode) return;
    async function load() {
      try {
        const foundGame = await getGameByInviteCode(inviteCode!);
        if (foundGame && isGameVisible(foundGame)) {
          navigate(`/games/${foundGame.id}`, { replace: true });
          return;
        }
      } catch (err) {
        console.error('Failed to load game:', err);
      }
      setError(true);
    }
    load();
  }, [inviteCode, navigate]);

  if (error) return <EmptyState title="ไม่พบเกม" subtitle="ลิงก์นี้อาจหมดอายุหรือเกมถูกลบแล้ว" />;
  return <LoadingScreen />;
}
