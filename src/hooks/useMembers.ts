import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type {
  BoardMember,
  BoardMemberInsert,
  BoardMemberUpdate,
} from '../lib/db';

type State = {
  members: BoardMember[];
  loading: boolean;
  error: string | null;
};

const INITIAL_STATE: State = {
  members: [],
  loading: true,
  error: null,
};

// Settings/member-management hook. One subscriber (the Settings page)
// for now. Reloads after every mutation rather than doing optimistic
// updates — for a ~15-person table the round-trip is cheap and the
// state stays trivially consistent with what the server believes.
export function useMembers() {
  const [state, setState] = useState<State>(INITIAL_STATE);

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const { data, error } = await supabase
      .from('board_members')
      .select('*')
      .order('full_name', { ascending: true });
    if (error) {
      console.error('[useMembers] reload error:', error);
      setState({ members: [], loading: false, error: error.message });
      return;
    }
    setState({ members: data ?? [], loading: false, error: null });
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addMember = useCallback(
    async (input: {
      full_name: string;
      email: string;
      role: BoardMember['role'];
    }): Promise<{ error: string | null }> => {
      const insert: BoardMemberInsert = {
        full_name: input.full_name.trim(),
        email: input.email.trim().toLowerCase(),
        role: input.role,
      };
      const { error } = await supabase.from('board_members').insert(insert);
      if (error) {
        console.error('[useMembers] addMember error:', error);
        return { error: error.message };
      }
      await reload();
      return { error: null };
    },
    [reload],
  );

  const updateMember = useCallback(
    async (
      id: string,
      patch: BoardMemberUpdate,
    ): Promise<{ error: string | null }> => {
      const { error } = await supabase
        .from('board_members')
        .update(patch)
        .eq('id', id);
      if (error) {
        console.error('[useMembers] updateMember error:', error);
        return { error: error.message };
      }
      await reload();
      return { error: null };
    },
    [reload],
  );

  return {
    ...state,
    reload,
    addMember,
    updateMember,
  };
}
