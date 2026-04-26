import { useState, type FormEvent, type ReactNode } from 'react';
import { Modal } from './Modal';
import { DriveDocPicker, type SelectedDoc } from './DriveDocPicker';

const BLUE = '#1A5FA8';

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1A5FA8] focus:ring-2 focus:ring-[#1A5FA8]/25 disabled:bg-gray-50 disabled:text-gray-500 transition-colors';

export function NewThreadDialog({
  isOpen,
  onClose,
  onCreate,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (input: {
    title: string;
    first_post_body: string;
    drive_file_id: string | null;
  }) => Promise<{ error: string | null; threadId?: string }>;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [doc, setDoc] = useState<SelectedDoc | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle('');
    setBody('');
    setDoc(null);
    setError(null);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError('Title and first post are both required.');
      return;
    }
    setError(null);
    setBusy(true);
    const { error: createErr } = await onCreate({
      title,
      first_post_body: body,
      drive_file_id: doc?.fileId ?? null,
    });
    setBusy(false);
    if (createErr) {
      setError(createErr);
      return;
    }
    reset();
    onClose();
  };

  const safeClose = busy ? () => {} : onClose;

  return (
    <Modal isOpen={isOpen} onClose={safeClose} title="New discussion thread" size="lg">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Title" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={busy}
            autoFocus
            placeholder="What's this thread about?"
            className={inputClass}
          />
        </Field>

        <Field label="First post" required>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={busy}
            rows={4}
            placeholder="Get the conversation started…"
            className={inputClass}
          />
        </Field>

        {/*
          Not wrapped in <Field> because Field renders a <label>, and a
          <label> wrapping the picker forwards stray clicks to the first
          form control inside it (the meeting <select>) — which intercepts
          file-button clicks, especially in nested subfolder rows.
        */}
        <div>
          <span className="block text-sm font-medium text-gray-700 mb-1">
            Attach a meeting document (optional)
          </span>
          <DriveDocPicker selected={doc} onSelect={setDoc} />
          <span className="block mt-1 text-xs text-gray-500">
            Pick a meeting first, then choose one of its files.
          </span>
        </div>

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
            {busy ? 'Posting…' : 'Start discussion'}
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
