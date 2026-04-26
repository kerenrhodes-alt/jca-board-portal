import { useState, type FormEvent, type ReactNode } from 'react';
import { Modal } from './Modal';

const BLUE = '#1A5FA8';

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1A5FA8] focus:ring-2 focus:ring-[#1A5FA8]/25 disabled:bg-gray-50 disabled:text-gray-500 transition-colors';

type AddInput = {
  title: string;
  meeting_date: string;
  drive_folder_id: string | null;
};

export function AddMeetingDialog({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (input: AddInput) => Promise<{ error: string | null }>;
}) {
  const [title, setTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [folderId, setFolderId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle('');
    setMeetingDate('');
    setFolderId('');
    setError(null);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim() || !meetingDate) {
      setError('Title and meeting date are required.');
      return;
    }
    setError(null);
    setBusy(true);
    const { error: addErr } = await onAdd({
      title,
      meeting_date: meetingDate,
      drive_folder_id: folderId || null,
    });
    setBusy(false);
    if (addErr) {
      setError(addErr);
      return;
    }
    reset();
    onClose();
  };

  const safeClose = busy ? () => {} : onClose;

  return (
    <Modal isOpen={isOpen} onClose={safeClose} title="Add meeting">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Title" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={busy}
            autoFocus
            placeholder="e.g. April 2026 board meeting"
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
            {busy ? 'Adding…' : 'Add meeting'}
          </button>
        </div>
      </form>
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
