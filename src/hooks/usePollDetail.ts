import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
import {
  DEFAULT_FETCH_TIMEOUT_MS,
  withTimeout,
} from '../lib/withTimeout';
import type {
  BoardMember,
  BoardPoll,
  BoardPollOption,
  BoardPollVote,
} from '../lib/db';

// Poll-detail hook. Loads one poll with its options and every vote
// (decorated with the voter's full name — required by the
// "fully transparent voting" rule). Realtime is scoped to this poll's
// votes so live tallies update instantly.
//
// Deliberately exposes castVote only — members cannot change their
// vote once cast (Phase 7 spec, 2026-04-27). Repeat-cast attempts hit
// the (poll_id, member_id) UNIQUE constraint and surface that error.

export type DecoratedVote = BoardPollVote & {
  voter_name: string;
  voter_email: string;
};

type State = {
  poll: BoardPoll | null;
  options: BoardPollOption[];
  votes: DecoratedVote[];
  loading: boolean;
  error: string | null;
  notFound: boolean;
};

const INITIAL_STATE: State = {
  poll: null,
  options: [],
  votes: [],
  loading: true,
  error: null,
  notFound: false,
};

async function fetchVoterMap(
  memberIds: string[],
): Promise<Record<string, BoardMember>> {
  const unique = Array.from(new Set(memberIds.filter(Boolean)));
  if (unique.length === 0) return {};
  const { data, error } = await supabase
    .from('board_members')
    .select('*')
    .in('id', unique);
  if (error) {
    console.warn('[usePollDetail] voter lookup failed:', error);
    return {};
  }
  const map: Record<string, BoardMember> = {};
  (data ?? []).forEach((m) => {
    map[m.id] = m;
  });
  return map;
}

function decorateVotes(
  votes: BoardPollVote[],
  voters: Record<string, BoardMember>,
): DecoratedVote[] {
  return votes
    .map((v) => {
      const voter = voters[v.member_id];
      return {
        ...v,
        voter_name: voter?.full_name ?? 'Member',
        voter_email: voter?.email ?? '',
      };
    })
    .sort((a, b) => a.voter_name.localeCompare(b.voter_name));
}

export function usePollDetail(pollId: string | undefined) {
  const { member } = useAuth();
  const [state, setState] = useState<State>(INITIAL_STATE);

  const reload = useCallback(async () => {
    if (!pollId) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [pollRes, optionsRes, votesRes] = await Promise.all([
        withTimeout(
          supabase
            .from('board_polls')
            .select('*')
            .eq('id', pollId)
            .maybeSingle(),
          DEFAULT_FETCH_TIMEOUT_MS,
          'usePollDetail.poll',
        ),
        withTimeout(
          supabase
            .from('board_poll_options')
            .select('*')
            .eq('poll_id', pollId)
            .order('sort_order', { ascending: true }),
          DEFAULT_FETCH_TIMEOUT_MS,
          'usePollDetail.options',
        ),
        withTimeout(
          supabase.from('board_poll_votes').select('*').eq('poll_id', pollId),
          DEFAULT_FETCH_TIMEOUT_MS,
          'usePollDetail.votes',
        ),
      ]);
      if (pollRes.error) throw pollRes.error;
      if (optionsRes.error) throw optionsRes.error;
      if (votesRes.error) throw votesRes.error;

      const poll = (pollRes.data ?? null) as BoardPoll | null;
      if (!poll) {
        setState({ ...INITIAL_STATE, loading: false, notFound: true });
        return;
      }
      const options = (optionsRes.data ?? []) as BoardPollOption[];
      const rawVotes = (votesRes.data ?? []) as BoardPollVote[];
      const voterMap = await fetchVoterMap(rawVotes.map((v) => v.member_id));

      setState({
        poll,
        options,
        votes: decorateVotes(rawVotes, voterMap),
        loading: false,
        error: null,
        notFound: false,
      });
    } catch (e) {
      console.error('[usePollDetail] reload error:', e);
      setState({
        ...INITIAL_STATE,
        loading: false,
        error: (e as Error).message || 'Could not load poll.',
      });
    }
  }, [pollId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Realtime: this poll's row (status / closes_at flips) and its votes.
  useEffect(() => {
    if (!pollId) return;
    const channel = supabase
      .channel(`realtime-poll-${pollId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'board_polls',
          filter: `id=eq.${pollId}`,
        },
        () => void reload(),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'board_poll_votes',
          filter: `poll_id=eq.${pollId}`,
        },
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
  }, [pollId, reload]);

  const myVote = state.votes.find((v) => v.member_id === member?.id) ?? null;

  const castVote = useCallback(
    async (optionId: string): Promise<{ error: string | null }> => {
      if (!member) return { error: 'Not signed in' };
      if (!pollId) return { error: 'Missing poll' };
      const { error } = await supabase.from('board_poll_votes').insert({
        poll_id: pollId,
        option_id: optionId,
        member_id: member.id,
      });
      if (error) {
        console.error('[usePollDetail] castVote error:', error);
        // The unique constraint on (poll_id, member_id) is the safety
        // net for a double-click race; the frontend disables the form
        // once has_voted, but surface a clearer message just in case.
        const msg =
          error.code === '23505'
            ? 'You have already voted on this poll. Votes cannot be changed.'
            : error.message;
        return { error: msg };
      }
      return { error: null };
    },
    [member, pollId],
  );

  return {
    ...state,
    reload,
    castVote,
    myVote,
  };
}
