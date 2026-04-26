import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { LoginScreen } from './LoginScreen';
import { NotEnrolledScreen } from './NotEnrolledScreen';

const BLUE = '#1A5FA8';
const GOLD = '#C8922A';
const PAGE_BG = '#F5F8FC';

// The single point that turns AuthProvider's status into rendered UI.
// Wrap any tree that requires an enrolled board member; the four
// status branches each pick the right screen.
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === 'loading') return <LoadingScreen />;
  if (status === 'unauthenticated') return <LoginScreen />;
  if (status === 'authenticated_not_enrolled') return <NotEnrolledScreen />;
  // status === 'authenticated_enrolled'
  return <>{children}</>;
}

// Assumes the parent has already required auth. Redirects non-admins
// to the dashboard. Used to gate the /engagement and /settings routes.
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function LoadingScreen() {
  return (
    <div
      style={{ background: PAGE_BG }}
      className="min-h-screen flex items-center justify-center px-4 py-10 font-sans"
    >
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-lg px-8 py-10 text-center">
        <p
          className="font-serif text-xs uppercase tracking-[0.18em]"
          style={{ color: GOLD }}
        >
          Jewish Community of Amherst
        </p>
        <h1 className="font-serif text-3xl font-bold mt-3" style={{ color: BLUE }}>
          Board Portal
        </h1>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Spinner />
          <span className="text-sm text-gray-600">Loading…</span>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block w-5 h-5 rounded-full border-2 border-gray-200 animate-spin"
      style={{ borderTopColor: BLUE }}
    />
  );
}
