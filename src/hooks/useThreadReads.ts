import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import type { BoardThread } from '../lib/db';

// Server-side read tracking. Replaces Mercaz's localStorage-only
// approach with a board_thread_reads upsert keyed on
// (member_id, thread_id). Read state syncs across devices.
//
// Public API:
//   - reads:  Record<thread_id, last_read_at ISO string>
//   - markThreadRead(threadId) — call on ThreadDetail mount.
//   - isUnread(thread) — true when thread.last_post_at > last_read_at,
//     or when there's no read row yet for that thread.

export function useThreadReads() {
  const { member } = useAuth();
  const [reads, setReads] = useState<Record<string, string>>({});

  // Load existing reads once per member. Failures are non-fatal —
  // the worst case is everything appears unread.
  useEffect(() => {
    if (!member) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('board_thread_reads')
        .select('thread_id, last_read_at')
        .eq('member_id', member.id);
      if (cancelled) return;
      if (error) {
        console.warn('[useThreadReads] load failed:', error);
        return;
      }
      const map: Record<string, string> = {};
      (data ?? []).forEach((r) => {
        map[r.thread_id] = r.last_read_at;
      });
      setReads(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [member]);

  const markThreadRead = useCallback(
    async (threadId: string) => {
      if (!member) return;
      const now = new Date().toISOString();
      // Optimistic update so the unread dot disappears immediately.
      setReads((cur) => ({ ...cur, [threadId]: now }));
      const { error } = await supabase
        .from('board_thread_reads')
        .upsert(
          {
            member_id: member.id,
            thread_id: threadId,
            last_read_at: now,
          },
          { onConflict: 'member_id,thread_id' },
        );
      if (error) {
        console.warn('[useThreadReads] markThreadRead failed:', error);
      }
    },
    [member],
  );

  const isUnread = useCallback(
    (thread: BoardThread): boolean => {
      const last = reads[thread.id];
      if (!last) return true;
      return (
        new Date(thread.last_post_at).getTime() >
        new Date(last).getTime()
      );
    },
    [reads],
  );

  return { reads, markThreadRead, isUnread };
}
