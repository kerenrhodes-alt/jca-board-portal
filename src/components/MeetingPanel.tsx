import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useDriveFolder } from '../hooks/useDriveFolder';
import { recordDocumentView } from '../lib/recordView';
import { FileRow } from './FileRow';
import type { BoardMeeting } from '../lib/db';

const GOLD = '#C8922A';

export function MeetingPanel({
  meeting,
  defaultExpanded,
  isFeatured,
}: {
  meeting: BoardMeeting;
  defaultExpanded: boolean;
  isFeatured: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { member } = useAuth();
  const { files, loading, error, reload } = useDriveFolder(
    meeting.drive_folder_id,
    expanded,
  );

  const onFileClick = (driveFileId: string) => {
    if (member) recordDocumentView(driveFileId, member.id);
  };

  const containerClass = isFeatured
    ? 'rounded-xl bg-white shadow-sm border border-[#1A5FA8]/30 ring-1 ring-[#1A5FA8]/10'
    : 'rounded-xl bg-white shadow-sm border border-gray-100';

  return (
    <div className={containerClass}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full flex items-center gap-3 px-5 py-4 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-serif text-lg font-bold text-gray-900">
              {meeting.title}
            </h3>
            {isFeatured && (
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
                style={{ background: GOLD }}
              >
                Up next
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatLongDate(meeting.meeting_date)}
          </p>
        </div>
        <span aria-hidden="true" className="text-gray-400 text-xl leading-none">
          {expanded ? '−' : '+'}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-2 py-2">
          {!meeting.drive_folder_id ? (
            <p className="px-3 py-3 text-sm text-gray-500">
              No Drive folder linked. An admin can add one in Settings.
            </p>
          ) : loading ? (
            <p className="px-3 py-3 text-sm text-gray-500">Loading files…</p>
          ) : error ? (
            <div className="px-3 py-3 text-sm text-red-700">
              <p>Could not load files: {error}</p>
              <button
                type="button"
                onClick={reload}
                className="mt-1 text-xs underline font-medium"
              >
                Retry
              </button>
            </div>
          ) : files.length === 0 ? (
            <p className="px-3 py-3 text-sm text-gray-500">
              No files yet — files added in Drive will appear here automatically.
            </p>
          ) : (
            <div className="space-y-0.5">
              {files.map((f) => (
                <FileRow
                  key={f.id}
                  file={f}
                  onClick={() => onFileClick(f.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatLongDate(iso: string): string {
  // board_meetings.meeting_date is a date column; parse as local
  // calendar date so we don't introduce a timezone-shift surprise.
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
