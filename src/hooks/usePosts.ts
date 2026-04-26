import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import {
  DEFAULT_FETCH_TIMEOUT_MS,
  withTimeout,
} from '../lib/withTimeout';
import type { BoardMember, BoardPost } from '../lib/db';

// Posts hook for one thread. Adapted from
// mercaz-react/src/hooks/useMessages.ts with these changes:
//   - board_posts table; parent_post_id (renamed from
//     parent_message_id).
//   - author_id is a board_members.id (uuid), not an email.
//   - Reactions and photo upload removed entirely.
//   - Optimistic-by-local-id pattern dropped; we add the inserted row
//     to state from the INSERT response, and dedup the realtime echo
//     by id.
//   - Soft-delete: delete sets body to '[deleted by author/admin]' and
//     author_id to null. The row stays in the table.
//   - Realtime listens to INSERT and UPDATE (the latter covers edits
//     and the soft-delete UPDATE).

type AuthorMap = Record<string, BoardMember>;

export type EnrichedPost = BoardPost & {
  author_name: string;
};

export type ThreadPost = EnrichedPost & {
  replies: EnrichedPost[];
};

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

function decorate(p: BoardPost, authors: AuthorMap): EnrichedPost {
  const author = p.author_id ? authors[p.author_id] : undefined;
  return {
    ...p,
    author_name: author?.full_name ?? 'Member',
  };
}

// Marker bodies for soft-deleted posts. PostCard checks isDeleted()
// to render the special "deleted" treatment.
const DELETED_BY_AUTHOR = '[deleted by author]';
const DELETED_BY_ADMIN = '[deleted by admin]';

export function isDeleted(p: BoardPost): boolean {
  return (
    p.author_id == null &&
    (p.body === DELETED_BY_AUTHOR || p.body === DELETED_BY_ADMIN)
  );
}

export function usePosts(threadId: string | undefined) {
  const { member, isAdmin } = useAuth();
  const [posts, setPosts] = useState<EnrichedPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const authorMapRef = useRef<AuthorMap>({});

  const reload = useCallback(async () => {
    if (!threadId) {
      setPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await withTimeout(
        supabase
          .from('board_posts')
          .select('*')
          .eq('thread_id', threadId)
          .order('created_at', { ascending: true }),
        DEFAULT_FETCH_TIMEOUT_MS,
        'usePosts.fetch',
      );
      if (qErr) {
        console.error('[usePosts] supabase query error:', qErr);
        throw qErr;
      }
      const rows = (data ?? []) as BoardPost[];
      const authorIds = rows
        .map((p) => p.author_id)
        .filter((id): id is string => Boolean(id));
      const authors = await fetchAuthorMap(authorIds);
      authorMapRef.current = authors;
      setPosts(rows.map((p) => decorate(p, authors)));
    } catch (e) {
      console.error('[usePosts] fetch failed:', e);
      setError((e as Error).message || 'Could not load posts.');
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Realtime: INSERT + UPDATE on board_posts filtered by thread_id.
  useEffect(() => {
    if (!threadId) return;
    const channel = supabase
      .channel('realtime-board-posts-' + threadId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'board_posts',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const p = payload.new as BoardPost;
          setPosts((cur) => {
            const list = cur ?? [];
            // Dedup our own echo by id.
            if (list.some((x) => x.id === p.id)) return list;
            return [...list, decorate(p, authorMapRef.current)];
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'board_posts',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const next = payload.new as BoardPost;
          setPosts((cur) =>
            (cur ?? []).map((p) =>
              p.id === next.id
                ? decorate({ ...p, ...next }, authorMapRef.current)
                : p,
            ),
          );
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
  }, [threadId]);

  // Group into top-level posts + replies (Facebook-style nesting).
  const grouped = useMemo<ThreadPost[]>(() => {
    if (!posts) return [];
    const top = posts.filter((p) => p.parent_post_id == null);
    const byParent = new Map<string, EnrichedPost[]>();
    for (const p of posts) {
      if (p.parent_post_id != null) {
        const arr = byParent.get(p.parent_post_id) ?? [];
        arr.push(p);
        byParent.set(p.parent_post_id, arr);
      }
    }
    return top.map((p) => ({
      ...p,
      replies: byParent.get(p.id) ?? [],
    }));
  }, [posts]);

  const createPost = useCallback(
    async (
      body: string,
      parentPostId: string | null,
    ): Promise<{ error: string | null }> => {
      if (!threadId) return { error: 'No thread' };
      if (!member) return { error: 'Not signed in' };
      const trimmed = body.trim();
      if (!trimmed) return { error: 'Post cannot be empty.' };

      const { data, error: insErr } = await supabase
        .from('board_posts')
        .insert({
          thread_id: threadId,
          author_id: member.id,
          body: trimmed,
          parent_post_id: parentPostId,
        })
        .select()
        .single();
      if (insErr || !data) {
        console.error('[usePosts] createPost insert error:', insErr);
        return { error: insErr?.message ?? 'Could not post.' };
      }

      // Add to state from the insert response — realtime echo will be
      // deduped by id when it arrives.
      setPosts((cur) => {
        const list = cur ?? [];
        if (list.some((p) => p.id === data.id)) return list;
        return [...list, decorate(data, authorMapRef.current)];
      });

      // Bump thread last_post_at so it floats to the top of the list.
      await supabase
        .from('board_threads')
        .update({ last_post_at: new Date().toISOString() })
        .eq('id', threadId);

      return { error: null };
    },
    [threadId, member],
  );

  const editPost = useCallback(
    async (
      postId: string,
      newBody: string,
    ): Promise<{ error: string | null }> => {
      const trimmed = newBody.trim();
      if (!trimmed) return { error: 'Post cannot be empty.' };
      const { data, error: uErr } = await supabase
        .from('board_posts')
        .update({ body: trimmed })
        .eq('id', postId)
        .select()
        .single();
      if (uErr) {
        console.error('[usePosts] editPost error:', uErr);
        return { error: uErr.message };
      }
      if (data) {
        setPosts((cur) =>
          (cur ?? []).map((p) =>
            p.id === data.id
              ? decorate({ ...p, ...data }, authorMapRef.current)
              : p,
          ),
        );
      }
      return { error: null };
    },
    [],
  );

  // Soft delete: replaces body with the marker text and clears
  // author_id. The row stays so replies and quoted references still
  // resolve. PostCard renders this as "Deleted post" treatment.
  const deletePost = useCallback(
    async (
      postId: string,
      isOwnPost: boolean,
    ): Promise<{ error: string | null }> => {
      const marker = isOwnPost ? DELETED_BY_AUTHOR : DELETED_BY_ADMIN;
      const { data, error: uErr } = await supabase
        .from('board_posts')
        .update({ body: marker, author_id: null })
        .eq('id', postId)
        .select()
        .single();
      if (uErr) {
        console.error('[usePosts] deletePost error:', uErr);
        return { error: uErr.message };
      }
      if (data) {
        setPosts((cur) =>
          (cur ?? []).map((p) =>
            p.id === data.id
              ? decorate({ ...p, ...data }, authorMapRef.current)
              : p,
          ),
        );
      }
      return { error: null };
    },
    [],
  );

  function canEdit(p: EnrichedPost): boolean {
    if (isDeleted(p)) return false;
    return Boolean(member && p.author_id === member.id);
  }

  function canDelete(p: EnrichedPost): boolean {
    if (isDeleted(p)) return false;
    return Boolean(isAdmin || (member && p.author_id === member.id));
  }

  return {
    posts: grouped,
    error,
    loading,
    reload,
    createPost,
    editPost,
    deletePost,
    canEdit,
    canDelete,
  };
}
