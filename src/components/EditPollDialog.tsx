import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Modal } from './Modal';
import type { BoardPoll, BoardPollUpdate } from '../lib/db';

const BLUE = '#1A5FA8';

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1A5FA8] focus:ring-2 focus:ring-[#1A5FA8]/25 disabled:bg-gray-50 disabled:text-gray-500 transition-colors';

// Convert an ISO timestamp to the local-time string the
// <input type="datetime-local"> control expects ("YYYY-MM-DDTHH:mm").
function isoToLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    d.getFullYear() +
    '-' +
    pad(d.getMonth() + 1) +
    '-' +
    pad(d.getDate()) +
    'T' +
    pad(d.getHours()) +
    ':' +
    pad(d.getMinutes())
  );
}

// Edit dialog for an existing poll. Scope is intentionally narrow:
//  - Drafts: title, description, closes_at editable. To change the
//    options, admins delete the draft and recreate it (keeps the
//    options-vs-existing-votes invariant simple).
//  - Open polls: only closes_at is editable (extending or shortening
//    a deadline is the realistic edit scenario).
//  - Closed polls: not opened in this dialog.
export function EditPollDialog({
  isOpen,
  onClose,
  poll,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  poll: BoardPoll | null;
  onSave: (
    id: string,
    patch: BoardPollUpdate,
  ) => Promise<{ error: string | null }>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [closesLocal, setClosesLocal] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!poll) return;
    setTitle(poll.title);
    setDescription(poll.description ?? '');
    setClosesLocal(isoToLocalInput(poll.closes_at));
    setError(null);
  }, [poll]);

  if (!poll) return null;

  const isDraft = poll.status === 'draft';

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isDraft && !title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!closesLocal) {
      setError('A closing date and time is required.');
      return;
    }
    const closesIso = new Date(closesLocal).toISOString();
    const patch: BoardPollUpdate = { closes_at: closesIso };
    if (isDraft) {
      patch.title = title.trim();
      patch.description = description.trim() || null;
    }
    setError(null);
    setBusy(true);
    const { error: saveErr } = await onSave(poll.id, patch);
    setBusy(false);
    if (saveErr) {
      setError(saveErr);
      return;
    }
    onClose();
  };

  const safeClose = busy ? () => {} : onClose;

  return (
    <Modal isOpen={isOpen} onClose={safeClose} title="Edit poll" size="lg">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Question" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={busy || !isDraft}
            className={inputClass}
          />
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={busy || !isDraft}
            rows={3}
            className={inputClass}
          />
        </Field>

        <Field label="Closes at" required>
          <input
            type="datetime-local"
            value={closesLocal}
            onChange={(e) => setClosesLocal(e.target.value)}
            disabled={busy}
            className={inputClass}
          />
        </Field>

        {!isDraft && (
          <p className="text-xs text-gray-500 italic">
            Only the closing time can be changed once a poll is open. To
            change the question or options, close this poll and create a
            new one.
          </p>
        )}

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
    </Modal>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-gray-400 ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}
