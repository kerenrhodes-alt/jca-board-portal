import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink: string;
  iconLink?: string;
  size?: string;
};

export type DriveSubfolder = {
  id: string;
  name: string;
  files: DriveFile[];
};

type State = {
  files: DriveFile[];
  subfolders: DriveSubfolder[];
  loading: boolean;
  error: string | null;
};

const INITIAL_STATE: State = {
  files: [],
  subfolders: [],
  loading: false,
  error: null,
};

// Per-folder hook. Lazy: only fetches when `enabled` flips to true,
// which lets MeetingPanel defer its Drive call until the panel is
// expanded. The Edge Function returns top-level files plus a
// one-level listing of any subfolders; the hook surfaces both as
// separate fields.
export function useDriveFolder(folderId: string | null, enabled: boolean) {
  const [state, setState] = useState<State>(INITIAL_STATE);

  const reload = useCallback(async () => {
    if (!folderId) {
      setState({
        files: [],
        subfolders: [],
        loading: false,
        error: 'No Drive folder linked to this meeting.',
      });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    const { data, error } = await supabase.functions.invoke(
      'drive-list-folder',
      { body: { folderId } },
    );
    if (error) {
      console.error('[useDriveFolder] invoke error:', error);
      setState({
        files: [],
        subfolders: [],
        loading: false,
        error: error.message ?? 'Could not load files.',
      });
      return;
    }
    if (data?.error) {
      setState({
        files: [],
        subfolders: [],
        loading: false,
        error: String(data.error),
      });
      return;
    }
    setState({
      files: (data?.files ?? []) as DriveFile[],
      subfolders: (data?.subfolders ?? []) as DriveSubfolder[],
      loading: false,
      error: null,
    });
  }, [folderId]);

  useEffect(() => {
    if (enabled) void reload();
  }, [enabled, reload]);

  return { ...state, reload };
}
