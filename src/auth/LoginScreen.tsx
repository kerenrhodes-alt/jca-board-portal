import { useState, type FormEvent } from 'react';
import { useAuth } from './AuthProvider';
import { CheckYourEmailScreen } from './CheckYourEmailScreen';

const BLUE = '#1A5FA8';
const GOLD = '#C8922A';
const PAGE_BG = '#F5F8FC';
const ERROR_RED = '#B91C1C';

export function LoginScreen() {
  const { signInWithGoogle, signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState<null | 'google' | 'email'>(null);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSentTo, setMagicLinkSentTo] = useState<string | null>(null);

  const onGoogleClick = async () => {
    setError(null);
    setBusy('google');
    try {
      await signInWithGoogle();
      // signInWithOAuth always redirects on success in supabase-js
      // v2, so we leave busy='google' and let the page navigate.
    } catch {
      setError('Could not start Google sign-in. Please try again.');
      setBusy(null);
    }
  };

  const onEmailSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Please enter your email address.');
      return;
    }
    setError(null);
    setBusy('email');
    const { error: linkErr } = await signInWithMagicLink(trimmed);
    setBusy(null);
    if (linkErr) {
      setError(linkErr);
      return;
    }
    setMagicLinkSentTo(trimmed);
  };

  if (magicLinkSentTo) {
    return (
      <CheckYourEmailScreen
        email={magicLinkSentTo}
        onBack={() => {
          setMagicLinkSentTo(null);
          setEmail('');
        }}
      />
    );
  }

  const disabled = busy !== null;

  return (
    <div
      style={{ background: PAGE_BG }}
      className="min-h-screen flex items-center justify-center px-4 py-10 font-sans"
    >
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-lg px-8 py-10">
        <div className="text-center mb-8">
          <p
            className="font-serif text-xs uppercase tracking-[0.18em]"
            style={{ color: GOLD }}
          >
            Jewish Community of Amherst
          </p>
          <h1
            className="font-serif text-3xl font-bold mt-3"
            style={{ color: BLUE }}
          >
            Board Portal
          </h1>
          <p className="mt-3 text-sm text-gray-600 leading-relaxed">
            Sign in to access board materials, discussions, and votes.
          </p>
        </div>

        <button
          type="button"
          onClick={onGoogleClick}
          disabled={disabled}
          className="w-full flex items-center justify-center gap-3 rounded-lg px-4 py-3 text-white font-medium text-[15px] disabled:opacity-60 hover:opacity-95 active:opacity-90 transition-opacity"
          style={{ background: BLUE }}
        >
          <GoogleGlyph />
          {busy === 'google' ? 'Redirecting…' : 'Continue with Google'}
        </button>

        <div className="flex items-center gap-3 my-6" aria-hidden="true">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={onEmailSubmit} noValidate>
          <label
            htmlFor="login-email"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            disabled={disabled}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#1A5FA8] focus:ring-2 focus:ring-[#1A5FA8]/25 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
          />
          <button
            type="submit"
            disabled={disabled || email.trim().length === 0}
            className="w-full mt-3 rounded-lg border-2 bg-white px-4 py-3 font-medium text-sm disabled:opacity-50 hover:bg-[#1A5FA8]/5 active:bg-[#1A5FA8]/10 transition-colors"
            style={{ borderColor: BLUE, color: BLUE }}
          >
            {busy === 'email' ? 'Sending…' : 'Send sign-in link'}
          </button>
          <p className="text-xs text-gray-500 mt-2.5 text-center">
            We'll email you a link — no password needed.
          </p>
        </form>

        {error && (
          <div
            role="alert"
            className="mt-5 rounded-md px-3 py-2 text-sm text-center"
            style={{ background: '#FEF2F2', color: ERROR_RED }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

// Official multi-color Google "G" mark, sized to sit on a small white
// chip so it stays legible on the JCA-blue button.
function GoogleGlyph() {
  return (
    <span className="inline-flex items-center justify-center bg-white rounded-sm w-5 h-5">
      <svg viewBox="0 0 18 18" width="14" height="14" aria-hidden="true">
        <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.79 2.71v2.26h2.9c1.7-1.56 2.69-3.86 2.69-6.62z"/>
        <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.97v2.33A9 9 0 0 0 9 18z"/>
        <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.16.29-1.7V4.97H.97A9 9 0 0 0 0 9c0 1.45.35 2.83.97 4.04l2.98-2.34z"/>
        <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58A8.97 8.97 0 0 0 9 0 9 9 0 0 0 .97 4.96l2.98 2.34C4.66 5.17 6.65 3.58 9 3.58z"/>
      </svg>
    </span>
  );
}

