import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { BoardMember } from '../lib/db';

// Must stay in sync with the storageKey passed to createClient() in
// src/lib/supabase.ts. If that key ever changes, update both files.
const SUPABASE_STORAGE_KEY = 'jca-board-auth';

const MEMBER_LOOKUP_TIMEOUT_MS = 5000;
const MEMBER_LOOKUP_RETRY_BACKOFF_MS = 1000;

export type AuthStatus =
  | 'loading'
  | 'unauthenticated'
  | 'authenticated_not_enrolled'
  | 'authenticated_enrolled';

export type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  member: BoardMember | null;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshMember: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Detect a Supabase auth callback (Google OAuth or email magic link)
// in the current URL. supabase-js will consume this hash on its own
// once getSession()/onAuthStateChange runs — we only check for it to
// decide whether to show the loading state on first paint.
function hasAuthCallbackHash(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash;
  if (!hash) return false;
  return /access_token=|error_code=|error_description=|type=(magiclink|recovery|signup|invite)/.test(
    hash,
  );
}

function hasCachedSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem(SUPABASE_STORAGE_KEY);
    return !!(raw && raw !== 'null' && raw.length > 0);
  } catch {
    return false;
  }
}

function shouldShowInitialLoading(): boolean {
  return hasAuthCallbackHash() || hasCachedSession();
}

async function withTimeout<T>(
  p: Promise<T> | PromiseLike<T>,
  ms: number,
  label: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
    Promise.resolve(p).then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

type LookupResult =
  | { kind: 'member'; member: BoardMember }
  | { kind: 'no_row' }
  | { kind: 'connection_trouble' };

// Look up the board_members row for the signed-in email. One 5s
// attempt, then a 1s backoff and a single retry. Anything else is a
// "connection_trouble" outcome — handled at the call site by signing
// out locally so the user can retry from a clean slate (rather than
// landing on the harsher "Not enrolled" screen for what is really a
// transient network issue).
async function lookupMember(email: string): Promise<LookupResult> {
  const attempt = async (
    label: string,
  ): Promise<
    { ok: true; member: BoardMember | null } | { ok: false; err: unknown }
  > => {
    try {
      const result = await withTimeout(
        supabase
          .from('board_members')
          .select('*')
          .eq('email', email.toLowerCase())
          .maybeSingle(),
        MEMBER_LOOKUP_TIMEOUT_MS,
        label,
      );
      if (result.error) return { ok: false, err: result.error };
      return { ok: true, member: result.data };
    } catch (err) {
      return { ok: false, err };
    }
  };

  let r = await attempt('memberLookup');
  if (!r.ok) {
    // eslint-disable-next-line no-console
    console.warn(
      '[AuthProvider] member lookup failed, retrying after backoff:',
      r.err,
    );
    await new Promise((res) =>
      setTimeout(res, MEMBER_LOOKUP_RETRY_BACKOFF_MS),
    );
    r = await attempt('memberLookup.retry');
  }

  if (!r.ok) {
    // eslint-disable-next-line no-console
    console.error('[AuthProvider] member lookup failed twice:', r.err);
    return { kind: 'connection_trouble' };
  }
  if (!r.member) return { kind: 'no_row' };
  return { kind: 'member', member: r.member };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(() =>
    shouldShowInitialLoading() ? 'loading' : 'unauthenticated',
  );
  const [session, setSession] = useState<Session | null>(null);
  const [member, setMember] = useState<BoardMember | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const handleSignedIn = useCallback(async (s: Session) => {
    if (!mountedRef.current) return;
    setSession(s);

    const email = s.user.email;
    if (!email) {
      setMember(null);
      setStatus('authenticated_not_enrolled');
      return;
    }

    const result = await lookupMember(email);
    if (!mountedRef.current) return;

    if (result.kind === 'connection_trouble') {
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(
          '[AuthProvider] local signOut during connection-trouble cleanup failed:',
          e,
        );
      }
      if (!mountedRef.current) return;
      setSession(null);
      setMember(null);
      setStatus('unauthenticated');
      return;
    }

    // Inactive members are treated the same as unenrolled — the
    // NotEnrolledScreen tells them to contact a board admin.
    if (result.kind === 'no_row' || result.member.status === 'inactive') {
      setMember(null);
      setStatus('authenticated_not_enrolled');
      return;
    }

    setMember(result.member);
    setStatus('authenticated_enrolled');
  }, []);

  const handleSignedOut = useCallback(() => {
    if (!mountedRef.current) return;
    setSession(null);
    setMember(null);
    setStatus('unauthenticated');
  }, []);

  // Single subscription to onAuthStateChange — supabase-js fires
  // INITIAL_SESSION on mount with whatever's in storage (or null),
  // and SIGNED_IN once the OAuth/magic-link hash has been consumed.
  // No separate getSession() call is needed.
  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      if (cancelled) return;

      if (event === 'SIGNED_OUT' || !s) {
        handleSignedOut();
        return;
      }

      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        // Token refresh / user-metadata update — keep the session in
        // sync but don't re-run the member lookup.
        setSession(s);
        return;
      }

      // INITIAL_SESSION with a session, SIGNED_IN, etc.
      void handleSignedIn(s);
    });

    return () => {
      cancelled = true;
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [handleSignedIn, handleSignedOut]);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[AuthProvider] signInWithGoogle error:', error);
      throw error;
    }
  }, []);

  const signInWithMagicLink = useCallback(
    async (email: string): Promise<{ error: string | null }> => {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) {
        // eslint-disable-next-line no-console
        console.error('[AuthProvider] signInWithMagicLink error:', error);
        return { error: error.message };
      }
      return { error: null };
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[AuthProvider] signOut error:', e);
    }
    handleSignedOut();
  }, [handleSignedOut]);

  const refreshMember = useCallback(async () => {
    const s = sessionRef.current;
    if (!s) return;
    await handleSignedIn(s);
  }, [handleSignedIn]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      member,
      isAdmin: member?.role === 'admin',
      signInWithGoogle,
      signInWithMagicLink,
      signOut,
      refreshMember,
    }),
    [
      status,
      session,
      member,
      signInWithGoogle,
      signInWithMagicLink,
      signOut,
      refreshMember,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
