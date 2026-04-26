import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type {
  BoardMeeting,
  BoardMeetingInsert,
  BoardMeetingUpdate,
} from '../lib/db';

type State = {
  meetings: BoardMeeting[];
  loading: boolean;
  error: string | null;
};

const INITIAL_STATE: State = {
  meetings: [],
  loading: true,
  error: null,
};

// Mirrors useMembers: fetch all meetings, expose mutation helpers,
// reload after each. Sorted by meeting_date desc — Documents page
// regroups by year before rendering, Settings table renders flat.
export function useMeetings() {
  const [state, setState] = useState<State>(INITIAL_STATE);

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const { data, error } = await supabase
      .from('board_meetings')
      .select('*')
      .order('meeting_date', { ascending: false });
    if (error) {
      console.error('[useMeetings] reload error:', error);
      setState({ meetings: [], loading: false, error: error.message });
      return;
    }
    setState({ meetings: data ?? [], loading: false, error: null });
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addMeeting = useCallback(
    async (input: {
      title: string;
      meeting_date: string;
      drive_folder_id: string | null;
    }): Promise<{ error: string | null }> => {
      const insert: BoardMeetingInsert = {
        title: input.title.trim(),
        meeting_date: input.meeting_date,
        drive_folder_id: input.drive_folder_id?.trim() || null,
      };
      const { error } = await supabase.from('board_meetings').insert(insert);
      if (error) {
        console.error('[useMeetings] addMeeting error:', error);
        return { error: error.message };
      }
      await reload();
      return { error: null };
    },
    [reload],
  );

  const updateMeeting = useCallback(
    async (
      id: string,
      patch: BoardMeetingUpdate,
    ): Promise<{ error: string | null }> => {
      const { error } = await supabase
        .from('board_meetings')
        .update(patch)
        .eq('id', id);
      if (error) {
        console.error('[useMeetings] updateMeeting error:', error);
        return { error: error.message };
      }
      await reload();
      return { error: null };
    },
    [reload],
  );

  const deleteMeeting = useCallback(
    async (id: string): Promise<{ error: string | null }> => {
      const { error } = await supabase
        .from('board_meetings')
        .delete()
        .eq('id', id);
      if (error) {
        console.error('[useMeetings] deleteMeeting error:', error);
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
    addMeeting,
    updateMeeting,
    deleteMeeting,
  };
}
