import { useState } from 'react';
import { useAuth } from './AuthProvider';

const BLUE = '#1A5FA8';
const GOLD = '#C8922A';
const PAGE_BG = '#F5F8FC';

export function NotEnrolledScreen() {
  const { session, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const email = session?.user.email;

  const onSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      // signOut already logs internally; reset so the user can retry.
      setSigningOut(false);
    }
  };

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
          Not yet enrolled
        </h1>
        <p className="mt-5 text-sm text-gray-700 leading-relaxed">
          Your email address is not registered for board access. Please
          contact the executive director to be added.
        </p>
        {email && (
          <p className="mt-3 text-xs text-gray-500">
            You signed in as{' '}
            <span className="font-medium" style={{ color: BLUE }}>
              {email}
            </span>
          </p>
        )}
        <button
          type="button"
          onClick={onSignOut}
          disabled={signingOut}
          className="w-full mt-6 rounded-lg border-2 bg-white px-4 py-3 font-medium text-sm disabled:opacity-50 hover:bg-[#1A5FA8]/5 active:bg-[#1A5FA8]/10 transition-colors"
          style={{ borderColor: BLUE, color: BLUE }}
        >
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>
  );
}
