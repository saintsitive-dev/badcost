import { Routes, Route } from 'react-router-dom';
import { PlayersProvider } from './presentation/context/PlayersContext';
import Layout from './presentation/components/Layout';
import PlayersPage from './presentation/pages/PlayersPage';
import NewEventPage from './presentation/pages/NewEventPage';
import EventPage from './presentation/pages/EventPage';
import ResultPage from './presentation/pages/ResultPage';
import HistoryPage from './presentation/pages/HistoryPage';
import SettingsPage from './presentation/pages/SettingsPage';
import { lazy, Suspense } from 'react';

// Lazy-loaded game booking pages
const HostLoginPage = lazy(() => import('./presentation/pages/games/HostLoginPage'));
const CreateGamePage = lazy(() => import('./presentation/pages/games/CreateGamePage'));
const ManageGamesPage = lazy(() => import('./presentation/pages/games/ManageGamesPage'));
const InviteLandingPage = lazy(() => import('./presentation/pages/games/InviteLandingPage'));
const GameDetailPage = lazy(() => import('./presentation/pages/games/GameDetailPage'));
const CostConfirmationPage = lazy(() => import('./presentation/pages/games/CostConfirmationPage'));

function GameLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-pulse text-gray-400">กำลังโหลด...</div>
    </div>
  );
}

export default function App() {
  return (
    <PlayersProvider>
      <Routes>
        {/* Existing cost-splitting routes */}
        <Route path="/"               element={<Layout><PlayersPage /></Layout>} />
        <Route path="/new"            element={<Layout><NewEventPage /></Layout>} />
        <Route path="/event/:id"      element={<Layout><EventPage /></Layout>} />
        <Route path="/event/:id/result" element={<Layout><ResultPage /></Layout>} />
        <Route path="/history"        element={<Layout><HistoryPage /></Layout>} />
        <Route path="/settings"       element={<Layout><SettingsPage /></Layout>} />

        {/* Game booking routes (lazy-loaded) */}
        <Route path="/games/login" element={<Layout><Suspense fallback={<GameLoading />}><HostLoginPage /></Suspense></Layout>} />
        <Route path="/games/create" element={<Layout><Suspense fallback={<GameLoading />}><CreateGamePage /></Suspense></Layout>} />
        <Route path="/games/manage" element={<Layout><Suspense fallback={<GameLoading />}><ManageGamesPage /></Suspense></Layout>} />
        <Route path="/games/invite/:inviteCode" element={<Layout><Suspense fallback={<GameLoading />}><InviteLandingPage /></Suspense></Layout>} />
        <Route path="/games/:gameId" element={<Layout><Suspense fallback={<GameLoading />}><GameDetailPage /></Suspense></Layout>} />
        <Route path="/games/:gameId/start-cost" element={<Layout><Suspense fallback={<GameLoading />}><CostConfirmationPage /></Suspense></Layout>} />
      </Routes>
    </PlayersProvider>
  );
}
