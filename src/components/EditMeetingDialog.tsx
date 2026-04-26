import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Modal } from './Modal';
import type { BoardMeeting, BoardMeetingUpdate } from '../lib/db';

const BLUE = '#1A5FA8';

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1A5FA8] focus:ring-2 focus:ring-[#1A5FA8]/25 disabled:bg-gray-50 disabled:text-gray-500 transition-colors';

export function EditMeetingDialog({
  isOpen,
  onClose,
  meeting,
  onUpdate,
  onDelete,
}: {
  isOpen: boolean;
  onClose: () => void;
  meeting: BoardMeeting | null;
  onUpdate: (
    id: string,
    patch: BoardMeetingUpdate,
  ) => Promise<{ error: string | null }>;
  onDelete: (id: string) => Promise<{ error: string | null }>;
}) {
  const [title, setTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [folderId, setFolderId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (meeting && isOpen) {
      setTitle(meeting.title);
      setMeetingDate(meeting.meeting_date);
      setFolderId(meeting.drive_folder_id ?? '');
      setError(null);
      setBusy(false);
      setConfirmingDelete(false);
    }
  }, [meeting, isOpen]);

  if (!meeting) return null;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim() || !meetingDate) {
      setError('Title and meeting date are required.');
      return;
    }
    setError(null);
    setBusy(true);
    const patch: BoardMeetingUpdate = {
      title: title.trim(),
      meeting_date: meetingDate,
      drive_folder_id: folderId.trim() || null,
    };
    const { error: updErr } = await onUpdate(meeting.id, patch);
    setBusy(false);
    if (updErr) {
      setError(updErr);
      return;
    }
    onClose();
  };

  const handleDelete = async () => {
    setBusy(true);
    const { error: delErr } = await onDelete(meeting.id);
    setBusy(false);
    if (delErr) {
      // Surface FK violations or anything else verbatim. Most likely
      // case: a board_polls row still references this meeting.
      setError(delErr);
      setConfirmingDelete(false);
      return;
    }
    onClose();
  };

  const safeClose = busy ? () => {} : onClose;

  return (
    <Modal isOpen={isOpen} onClose={safeClose} title="Edit meeting">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Title" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={busy}
            autoFocus
            className={inputClass}
          />
        </Field>

        <Field label="Meeting date" required>
          <input
            type="date"
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
            disabled={busy}
            className={inputClass}
          />
        </Field>

        <Field
          label="Drive folder ID"
          hint="Open the meeting's folder in Drive. The URL contains /folders/<ID> — copy that ID and paste it here."
        >
          <input
            type="text"
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            disabled={busy}
            placeholder="1abcDEF_xyz123..."
            className={inputClass}
          />
        </Field>

        {error && (
          <div
            role="alert"
            className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60 hover:opacity-95 transition-opacity"
            style={{ background: BLUE }}
          >
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>

      <div className="border-t border-gray-100 mt-5 pt-4">
        {!confirmingDelete ? (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            disabled={busy}
            className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors"
          >
            Delete this meeting
          </button>
        ) : (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2.5">
            <p className="text-sm font-medium text-red-800">
              Delete this meeting?
            </p>
            <p className="text-xs text-red-700 mt-0.5">
              This cannot be undone. Polls or votes attached to this meeting
              will block the delete.
            </p>
            <div className="flex gap-2 mt-2.5">
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className="rounded px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {busy ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                disabled={busy}
                className="rounded px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                Keep it
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-gray-400 ml-1">*</span>}
      </span>
      {children}
      {hint && (
        <span className="block mt-1 text-xs text-gray-500">{hint}</span>
      )}
    </label>
  );
}
