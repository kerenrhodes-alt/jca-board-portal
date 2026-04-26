import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

const BLUE = '#1A5FA8';
const GOLD = '#C8922A';

export function Sidebar() {
  const { member, session, isAdmin, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const onSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      setSigningOut(false);
    }
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-5 pt-6 pb-5 border-b border-gray-100">
        <p
          className="font-serif text-[10px] uppercase tracking-[0.18em]"
          style={{ color: GOLD }}
        >
          Jewish Community of Amherst
        </p>
        <h1 className="font-serif text-xl font-bold mt-1" style={{ color: BLUE }}>
          Board Portal
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <NavSection>
          <NavItem to="/" label="Dashboard" />
          <NavItem to="/documents" label="Documents" />
          <NavItem to="/discussions" label="Discussions" />
          <NavItem to="/voting" label="Voting" />
          <NavItem to="/financials" label="Financials" />
        </NavSection>
        {isAdmin && (
          <NavSection title="Admin">
            <NavItem to="/engagement" label="Engagement" />
            <NavItem to="/settings" label="Settings" />
          </NavSection>
        )}
      </nav>

      <div className="border-t border-gray-100 p-4">
        <p className="text-sm font-medium text-gray-900 truncate">
          {member?.full_name ?? 'Board member'}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {session?.user.email ?? ''}
        </p>
        <button
          type="button"
          onClick={onSignOut}
          disabled={signingOut}
          className="w-full mt-3 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </aside>
  );
}

function NavSection({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div>
      {title && (
        <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          {title}
        </p>
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive ? 'text-white' : 'text-gray-700 hover:bg-gray-50'
        }`
      }
      style={({ isActive }) => (isActive ? { background: BLUE } : undefined)}
    >
      {label}
    </NavLink>
  );
}
