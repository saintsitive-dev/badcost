import { Routes, Route } from 'react-router-dom';
import { PlayersProvider } from './presentation/context/PlayersContext';
import Layout from './presentation/components/Layout';
import PlayersPage from './presentation/pages/PlayersPage';
import NewEventPage from './presentation/pages/NewEventPage';
import EventPage from './presentation/pages/EventPage';
import ResultPage from './presentation/pages/ResultPage';
import HistoryPage from './presentation/pages/HistoryPage';
import SettingsPage from './presentation/pages/SettingsPage';

export default function App() {
  return (
    <PlayersProvider>
      <Routes>
        <Route path="/"               element={<Layout><PlayersPage /></Layout>} />
        <Route path="/new"            element={<Layout><NewEventPage /></Layout>} />
        <Route path="/event/:id"      element={<Layout><EventPage /></Layout>} />
        <Route path="/event/:id/result" element={<ResultPage />} />
        <Route path="/history"        element={<Layout><HistoryPage /></Layout>} />
        <Route path="/settings"       element={<Layout><SettingsPage /></Layout>} />
      </Routes>
    </PlayersProvider>
  );
}
