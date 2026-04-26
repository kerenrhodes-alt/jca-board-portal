import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../auth/AuthProvider';
import { useDriveFolder, type DriveSubfolder } from '../hooks/useDriveFolder';
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
  const { files, subfolders, loading, error, reload } = useDriveFolder(
    meeting.drive_folder_id,
    expanded,
  );

  const onFileClick = (driveFileId: string) => {
    if (member) recordDocumentView(driveFileId, member.id);
  };

  const containerClass = isFeatured
    ? 'rounded-xl bg-white shadow-sm border border-[#1A5FA8]/30 ring-1 ring-[#1A5FA8]/10'
    : 'rounded-xl bg-white shadow-sm border border-gray-100';

  const isEmpty = files.length === 0 && subfolders.length === 0;

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
          ) : isEmpty ? (
            <p className="px-3 py-3 text-sm text-gray-500">
              No files yet — files added in Drive will appear here automatically.
            </p>
          ) : (
            <>
              {files.length > 0 && (
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
              {subfolders.map((sf) => (
                <SubfolderSection
                  key={sf.id}
                  subfolder={sf}
                  onFileClick={onFileClick}
                  hasTopFilesAbove={files.length > 0}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SubfolderSection({
  subfolder,
  onFileClick,
  hasTopFilesAbove,
}: {
  subfolder: DriveSubfolder;
  onFileClick: (id: string) => void;
  hasTopFilesAbove: boolean;
}) {
  const [open, setOpen] = useState(false);
  const count = subfolder.files.length;

  return (
    <div className={hasTopFilesAbove ? 'mt-2 pt-2 border-t border-gray-50' : ''}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
      >
        <span aria-hidden="true" className="text-gray-400 text-xs w-3">
          {open ? '▾' : '▸'}
        </span>
        <span aria-hidden="true" className="text-base">
          📁
        </span>
        <span className="text-sm font-medium text-gray-700 flex-1 truncate">
          {subfolder.name}
        </span>
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {count} {count === 1 ? 'file' : 'files'}
        </span>
      </button>
      {open && (
        <div className="ml-5 mt-1 space-y-0.5">
          {count === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-500">No files yet.</p>
          ) : (
            subfolder.files.map((f) => (
              <FileRow
                key={f.id}
                file={f}
                onClick={() => onFileClick(f.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function formatLongDate(iso: string): string {
  // board_meetings.meeting_date can come back either as 'YYYY-MM-DD'
  // (date column) or as a full timestamp like '2026-05-07T00:00:00+00:00'
  // (timestamptz column). Slice to the date portion so we render the
  // calendar date the admin entered, regardless of timezone.
  const datePart = iso.slice(0, 10);
  const d = parseISO(datePart);
  if (isNaN(d.getTime())) return iso;
  return format(d, 'MMMM d, yyyy');
}
