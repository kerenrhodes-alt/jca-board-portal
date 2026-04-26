import { Routes, Route } from 'react-router-dom';
import { RequireAuth, RequireAdmin } from './auth/RequireAuth';
import { AppShell } from './components/AppShell';
import { Dashboard } from './pages/Dashboard';
import { Documents } from './pages/Documents';
import { Discussions } from './pages/Discussions';
import { ThreadDetail } from './pages/ThreadDetail';
import { Voting } from './pages/Voting';
import { Financials } from './pages/Financials';
import { Engagement } from './pages/Engagement';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="documents" element={<Documents />} />
        <Route path="discussions" element={<Discussions />} />
        <Route path="discussions/:threadId" element={<ThreadDetail />} />
        <Route path="voting" element={<Voting />} />
        <Route path="financials" element={<Financials />} />
        <Route
          path="engagement"
          element={
            <RequireAdmin>
              <Engagement />
            </RequireAdmin>
          }
        />
        <Route
          path="settings"
          element={
            <RequireAdmin>
              <Settings />
            </RequireAdmin>
          }
        />
      </Route>
    </Routes>
  );
}
