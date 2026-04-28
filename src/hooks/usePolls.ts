import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import {
  DEFAULT_FETCH_TIMEOUT_MS,
  withTimeout,
} from '../lib/withTimeout';
import type {
  BoardPoll,
  BoardPollOption,
  BoardPollUpdate,
  BoardPollVote,
} from '../lib/db';

// List-page hook for Phase 7 voting. Fetches every poll the current
// member is allowed to see (RLS hides drafts from non-admins), plus
// all options and all votes — at board-portal scale (~15 members,
// ≤10 polls/year) this is cheaper than per-poll round-trips.
//
// Realtime: any change in board_polls / board_poll_options /
// board_poll_votes triggers a single reload(). Vote frequency is low
// enough that surgical patching isn't worth the complexity.

export type EnrichedPoll = BoardPoll & {
  options: BoardPollOption[];
  vote_count: number;
  has_voted: boolean;
  my_option_id: string | null;
};

type State = {
  polls: EnrichedPoll[];
  loading: boolean;
  error: string | null;
};

const INITIAL_STATE: State = {
  polls: [],
  loading: true,
  error: null,
};

// Drafts (admin only) at the top so they're visible to whoever still
// needs to open them; then open polls by soonest-closing first; then
// closed polls by most-recently-closed first.
function sortPolls(rows: EnrichedPoll[]): EnrichedPoll[] {
  const rank = (s: BoardPoll['status']) =>
    s === 'draft' ? 0 : s === 'open' ? 1 : 2;
  return rows.slice().sort((a, b) => {
    const r = rank(a.status) - rank(b.status);
    if (r !== 0) return r;
    if (a.status === 'open') {
      const ax = a.closes_at ? new Date(a.closes_at).getTime() : Infinity;
      const bx = b.closes_at ? new Date(b.closes_at).getTime() : Infinity;
      return ax - bx;
    }
    if (a.status === 'closed') {
      const ax = a.closes_at ? new Date(a.closes_at).getTime() : 0;
      const bx = b.closes_at ? new Date(b.closes_at).getTime() : 0;
      return bx - ax;
    }
    // both drafts
    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });
}

export function usePolls() {
  const { member } = useAuth();
  const [state, setState] = useState<State>(INITIAL_STATE);
  // Unique per hook instance so multiple subscribers (Sidebar,
  // OpenPollAlert, Voting page) don't trample each other's channel
  // when they unmount.
  const instanceId = useId();

  const reload = useCallback(async () => {
    if (!member) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [pollsRes, optionsRes, votesRes] = await Promise.all([
        withTimeout(
          supabase.from('board_polls').select('*'),
          DEFAULT_FETCH_TIMEOUT_MS,
          'usePolls.polls',
        ),
        withTimeout(
          supabase
            .from('board_poll_options')
            .select('*')
            .order('sort_order', { ascending: true }),
          DEFAULT_FETCH_TIMEOUT_MS,
          'usePolls.options',
        ),
        withTimeout(
          supabase.from('board_poll_votes').select('*'),
          DEFAULT_FETCH_TIMEOUT_MS,
          'usePolls.votes',
        ),
      ]);
      if (pollsRes.error) throw pollsRes.error;
      if (optionsRes.error) throw optionsRes.error;
      if (votesRes.error) throw votesRes.error;

      const polls = (pollsRes.data ?? []) as BoardPoll[];
      const options = (optionsRes.data ?? []) as BoardPollOption[];
      const votes = (votesRes.data ?? []) as BoardPollVote[];

      const optionsByPoll = new Map<string, BoardPollOption[]>();
      options.forEach((o) => {
        const list = optionsByPoll.get(o.poll_id) ?? [];
        list.push(o);
        optionsByPoll.set(o.poll_id, list);
      });

      const votesByPoll = new Map<string, BoardPollVote[]>();
      votes.forEach((v) => {
        const list = votesByPoll.get(v.poll_id) ?? [];
        list.push(v);
        votesByPoll.set(v.poll_id, list);
      });

      const enriched: EnrichedPoll[] = polls.map((p) => {
        const ovotes = votesByPoll.get(p.id) ?? [];
        const myVote = ovotes.find((v) => v.member_id === member.id) ?? null;
        return {
          ...p,
          options: optionsByPoll.get(p.id) ?? [],
          vote_count: ovotes.length,
          has_voted: !!myVote,
          my_option_id: myVote?.option_id ?? null,
        };
      });

      setState({ polls: sortPolls(enriched), loading: false, error: null });
    } catch (e) {
      console.error('[usePolls] reload error:', e);
      setState({
        polls: [],
        loading: false,
        error: (e as Error).message || 'Could not load polls.',
      });
    }
  }, [member]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // One channel covers all three tables; any event triggers a reload.
  useEffect(() => {
    const channel = supabase
      .channel(`realtime-board-polls${instanceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'board_polls' },
        () => void reload(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'board_poll_options' },
        () => void reload(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'board_poll_votes' },
        () => void reload(),
      )
      .subscribe();
    return () => {
      try {
        void supabase.removeChannel(channel);
      } catch {
        /* no-op */
      }
    };
  }, [reload, instanceId]);

  const createPoll = useCallback(
    async (input: {
      title: string;
      description: string | null;
      closes_at: string;
      meeting_id: string | null;
      options: string[];
      open_immediately: boolean;
    }): Promise<{ error: string | null; pollId?: string }> => {
      if (!member) return { error: 'Not signed in' };
      const title = input.title.trim();
      if (!title) return { error: 'Title is required.' };
      const cleanOptions = input.options
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (cleanOptions.length < 2)
        return { error: 'At least two options are required.' };
      if (!input.closes_at)
        return { error: 'A closing date and time is required.' };

      const status = input.open_immediately ? 'open' : 'draft';
      const { data: pollData, error: pollErr } = await supabase
        .from('board_polls')
        .insert({
          title,
          description: input.description?.trim() || null,
          closes_at: input.closes_at,
          opens_at: input.open_immediately ? new Date().toISOString() : null,
          meeting_id: input.meeting_id,
          status,
          created_by: member.id,
        })
        .select()
        .single();
      if (pollErr || !pollData) {
        console.error('[usePolls] createPoll poll insert error:', pollErr);
        return { error: pollErr?.message ?? 'Could not create poll.' };
      }

      const optionRows = cleanOptions.map((label, i) => ({
        poll_id: pollData.id,
        label,
        sort_order: i,
      }));
      const { error: optErr } = await supabase
        .from('board_poll_options')
        .insert(optionRows);
      if (optErr) {
        console.error('[usePolls] createPoll options insert error:', optErr);
        // Roll back the poll row; otherwise we'd have a broken poll
        // with zero options that members couldn't vote on anyway.
        await supabase.from('board_polls').delete().eq('id', pollData.id);
        return { error: optErr.message };
      }

      return { error: null, pollId: pollData.id };
    },
    [member],
  );

  const updatePoll = useCallback(
    async (
      id: string,
      patch: BoardPollUpdate,
    ): Promise<{ error: string | null }> => {
      const { error } = await supabase
        .from('board_polls')
        .update(patch)
        .eq('id', id);
      if (error) {
        console.error('[usePolls] updatePoll error:', error);
        return { error: error.message };
      }
      return { error: null };
    },
    [],
  );

  const openPoll = useCallback(
    async (id: string): Promise<{ error: string | null }> => {
      return updatePoll(id, {
        status: 'open',
        opens_at: new Date().toISOString(),
      });
    },
    [updatePoll],
  );

  const closePoll = useCallback(
    async (id: string): Promise<{ error: string | null }> => {
      return updatePoll(id, { status: 'closed' });
    },
    [updatePoll],
  );

  const deletePoll = useCallback(
    async (id: string): Promise<{ error: string | null }> => {
      const { error } = await supabase
        .from('board_polls')
        .delete()
        .eq('id', id);
      if (error) {
        console.error('[usePolls] deletePoll error:', error);
        return { error: error.message };
      }
      return { error: null };
    },
    [],
  );

  // Computed: open polls the current member has not voted on. Used by
  // the Voting nav dot and the OpenPollAlert banner.
  const pendingForMe = useMemo(
    () =>
      state.polls.filter(
        (p) => p.status === 'open' && !p.has_voted && !isPastDeadline(p),
      ),
    [state.polls],
  );

  return {
    ...state,
    reload,
    createPoll,
    updatePoll,
    openPoll,
    closePoll,
    deletePoll,
    pendingForMe,
  };
}

export function isPastDeadline(p: Pick<BoardPoll, 'closes_at'>): boolean {
  if (!p.closes_at) return false;
  return new Date(p.closes_at).getTime() <= Date.now();
}
