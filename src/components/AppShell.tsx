import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

// Sidebar is fixed at 240px on the left; main content area gets the
// remainder via ml-60. Outlet renders whichever nested route matched.
export function AppShell() {
  return (
    <div
      style={{ background: '#F5F8FC' }}
      className="min-h-screen font-sans"
    >
      <Sidebar />
      <main className="ml-60 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
