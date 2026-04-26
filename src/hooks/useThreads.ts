import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  DEFAULT_FETCH_TIMEOUT_MS,
  withTimeout,
} from '../lib/withTimeout';
import { useAuth } from '../auth/AuthProvider';
import type {
  BoardMember,
  BoardThread,
  BoardThreadUpdate,
} from '../lib/db';

// Discussions hook. Adapted from mercaz-react/src/hooks/useThreads.ts
// with these changes:
//   - No groupId concept (Board Portal has a single thread space).
//   - Author lookup is by board_members.id (uuid), not email.
//   - Server-side reads tracking lives in useThreadReads.
//   - createThread combines a thread + first post into one mutation
//     per the approved Phase 6 design.

type AuthorMap = Record<string, BoardMember>;

async function fetchAuthorMap(authorIds: string[]): Promise<AuthorMap> {
  const unique = Array.from(new Set(authorIds.filter(Boolean)));
  if (unique.length === 0) return {};
  try {
    const { data } = await supabase
      .from('board_members')
      .select('*')
      .in('id', unique);
    const map: AuthorMap = {};
    (data ?? []).forEach((m) => {
      map[m.id] = m;
    });
    return map;
  } catch {
    return {};
  }
}

export type EnrichedThread = BoardThread & {
  created_by_name: string;
};

function decorateThread(t: BoardThread, authors: AuthorMap): EnrichedThread {
  const author = t.created_by ? authors[t.created_by] : undefined;
  return {
    ...t,
    created_by_name: author?.full_name ?? 'Member',
  };
}

function sortThreads(rows: EnrichedThread[]): EnrichedThread[] {
  return rows.slice().sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return (
      new Date(b.last_post_at).getTime() -
      new Date(a.last_post_at).getTime()
    );
  });
}

export function useThreads() {
  const { member } = useAuth();
  const [threads, setThreads] = useState<EnrichedThread[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const authorMapRef = useRef<AuthorMap>({});

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await withTimeout(
        supabase
          .from('board_threads')
          .select('*')
          .order('last_post_at', { ascending: false }),
        DEFAULT_FETCH_TIMEOUT_MS,
        'useThreads.fetch',
      );
      if (qErr) {
        console.error('[useThreads] supabase query error:', qErr);
        throw qErr;
      }
      const rows = (data ?? []) as BoardThread[];
      const authorIds = rows
        .map((t) => t.created_by)
        .filter((id): id is string => Boolean(id));
      const authors = await fetchAuthorMap(authorIds);
      authorMapRef.current = authors;
      const decorated = rows.map((t) => decorateThread(t, authors));
      setThreads(sortThreads(decorated));
    } catch (e) {
      console.error('[useThreads] fetch failed:', e);
      setError((e as Error).message || 'Could not load threads.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Realtime: whole board_threads table. INSERT for new threads,
  // UPDATE for pin/lock/last_post_at changes.
  useEffect(() => {
    const channel = supabase
      .channel('realtime-board-threads')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'board_threads' },
        (payload) => {
          const t = payload.new as BoardThread;
          setThreads((cur) => {
            const list = cur ?? [];
            if (list.some((x) => x.id === t.id)) return list;
            return sortThreads([
              ...list,
              decorateThread(t, authorMapRef.current),
            ]);
          });
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'board_threads' },
        (payload) => {
          const next = payload.new as BoardThread;
          setThreads((cur) => {
            const list = cur ?? [];
            const updated = list.map((t) =>
              t.id === next.id
                ? decorateThread({ ...t, ...next }, authorMapRef.current)
                : t,
            );
            return sortThreads(updated);
          });
        },
      )
      .subscribe();
    return () => {
      try {
        void supabase.removeChannel(channel);
      } catch {
        /* no-op */
      }
    };
  }, []);

  // Combined mutation: insert thread, then insert first post, then
  // bump last_post_at to the post's timestamp. If the post insert
  // fails, the thread row remains (empty) — admins/users can recover
  // by adding a post manually rather than us implementing a manual
  // rollback.
  const createThread = useCallback(
    async (input: {
      title: string;
      first_post_body: string;
      drive_file_id: string | null;
    }): Promise<{ error: string | null; threadId?: string }> => {
      if (!member) return { error: 'Not signed in' };
      const title = input.title.trim();
      const body = input.first_post_body.trim();
      if (!title) return { error: 'Title is required.' };
      if (!body) return { error: 'First post is required.' };

      const { data: tData, error: tErr } = await supabase
        .from('board_threads')
        .insert({
          title,
          drive_file_id: input.drive_file_id,
          created_by: member.id,
        })
        .select()
        .single();
      if (tErr || !tData) {
        console.error('[useThreads] createThread thread insert error:', tErr);
        return { error: tErr?.message ?? 'Could not create thread.' };
      }

      const { error: pErr } = await supabase.from('board_posts').insert({
        thread_id: tData.id,
        author_id: member.id,
        body,
        parent_post_id: null,
      });
      if (pErr) {
        console.error('[useThreads] createThread post insert error:', pErr);
        return {
          error:
            'Thread created but first post failed: ' +
            (pErr.message ?? 'unknown error'),
          threadId: tData.id,
        };
      }

      // Bump last_post_at so the new thread sorts at the top.
      await supabase
        .from('board_threads')
        .update({ last_post_at: new Date().toISOString() })
        .eq('id', tData.id);

      return { error: null, threadId: tData.id };
    },
    [member],
  );

  const updateThread = useCallback(
    async (
      id: string,
      patch: BoardThreadUpdate,
    ): Promise<{ error: string | null }> => {
      const { error: uErr } = await supabase
        .from('board_threads')
        .update(patch)
        .eq('id', id);
      if (uErr) {
        console.error('[useThreads] updateThread error:', uErr);
        return { error: uErr.message };
      }
      return { error: null };
    },
    [],
  );

  return {
    threads,
    error,
    loading,
    reload,
    createThread,
    updateThread,
  };
}
