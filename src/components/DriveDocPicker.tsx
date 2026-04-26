import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useMeetings } from '../hooks/useMeetings';
import {
  useDriveFolder,
  type DriveFile,
  type DriveSubfolder,
} from '../hooks/useDriveFolder';

const BLUE = '#1A5FA8';

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1A5FA8] focus:ring-2 focus:ring-[#1A5FA8]/25 disabled:bg-gray-50 disabled:text-gray-500 transition-colors';

export type SelectedDoc = {
  fileId: string;
  fileName: string;
};

// Two-step picker: meeting dropdown → file picker for that meeting's
// folder. Used inside NewThreadDialog. Returns the selected
// drive_file_id when the user picks one. "No attachment" is the
// default; clearing returns null.
export function DriveDocPicker({
  selected,
  onSelect,
}: {
  selected: SelectedDoc | null;
  onSelect: (doc: SelectedDoc | null) => void;
}) {
  const { meetings, loading: meetingsLoading } = useMeetings();
  const [meetingId, setMeetingId] = useState<string>('');

  const meeting = meetings.find((m) => m.id === meetingId) ?? null;
  // Lazy-fetch only when a meeting is picked.
  const {
    files,
    subfolders,
    loading: filesLoading,
    error: filesError,
  } = useDriveFolder(meeting?.drive_folder_id ?? null, Boolean(meeting));

  return (
    <div className="space-y-2">
      {selected ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-[#1A5FA8]/30 bg-[#1A5FA8]/5 px-3 py-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-gray-500">
              Attached document
            </p>
            <p
              className="text-sm font-medium truncate"
              style={{ color: BLUE }}
            >
              {selected.fileName}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setMeetingId('');
            }}
            className="text-xs font-medium text-gray-600 hover:text-gray-800 underline whitespace-nowrap"
          >
            Remove
          </button>
        </div>
      ) : (
        <>
          <select
            value={meetingId}
            onChange={(e) => setMeetingId(e.target.value)}
            disabled={meetingsLoading}
            className={inputClass}
            aria-label="Pick a meeting"
          >
            <option value="">
              {meetingsLoading
                ? 'Loading meetings…'
                : '— Pick a meeting to browse its files —'}
            </option>
            {meetings.map((m) => (
              <option key={m.id} value={m.id}>
                {formatDate(m.meeting_date)} — {m.title}
              </option>
            ))}
          </select>

          {meeting && (
            <FilePickerList
              files={files}
              subfolders={subfolders}
              loading={filesLoading}
              error={filesError}
              hasFolder={Boolean(meeting.drive_folder_id)}
              onPick={(f) => onSelect({ fileId: f.id, fileName: f.name })}
            />
          )}
        </>
      )}
    </div>
  );
}

function FilePickerList({
  files,
  subfolders,
  loading,
  error,
  hasFolder,
  onPick,
}: {
  files: DriveFile[];
  subfolders: DriveSubfolder[];
  loading: boolean;
  error: string | null;
  hasFolder: boolean;
  onPick: (f: DriveFile) => void;
}) {
  if (!hasFolder) {
    return (
      <p className="text-xs text-gray-500 px-1">
        This meeting has no Drive folder linked. Pick a different meeting
        or skip the attachment.
      </p>
    );
  }
  if (loading) {
    return <p className="text-xs text-gray-500 px-1">Loading files…</p>;
  }
  if (error) {
    return (
      <p className="text-xs text-red-700 px-1">
        Could not load files: {error}
      </p>
    );
  }

  // Drop empty subfolders entirely — for a picker, a header with no
  // selectable items beneath is just noise.
  const nonEmptySubfolders = subfolders.filter((sf) => sf.files.length > 0);

  if (files.length === 0 && nonEmptySubfolders.length === 0) {
    return (
      <p className="text-xs text-gray-500 px-1">
        This folder has no files yet.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white max-h-56 overflow-y-auto">
      {files.length > 0 && (
        <div className="divide-y divide-gray-100">
          {files.map((f) => (
            <FileButton key={f.id} file={f} onPick={onPick} />
          ))}
        </div>
      )}
      {nonEmptySubfolders.map((sf) => (
        <div key={sf.id} className="border-t border-gray-100 first:border-t-0">
          <div className="bg-gray-50 px-3 py-1.5 flex items-center gap-2">
            <span aria-hidden="true" className="text-sm">
              📁
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 truncate">
              {sf.name}
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {sf.files.map((f) => (
              <FileButton key={f.id} file={f} onPick={onPick} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FileButton({
  file,
  onPick,
}: {
  file: DriveFile;
  onPick: (f: DriveFile) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(file)}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
    >
      {file.iconLink ? (
        <img src={file.iconLink} alt="" className="w-4 h-4 shrink-0" />
      ) : (
        <span className="w-4 h-4 shrink-0" aria-hidden="true" />
      )}
      <span className="text-sm text-gray-800 truncate">{file.name}</span>
    </button>
  );
}

function formatDate(iso: string): string {
  const datePart = iso.slice(0, 10);
  const d = parseISO(datePart);
  if (isNaN(d.getTime())) return iso;
  return format(d, 'MMM d, yyyy');
}
