import { useState, type FormEvent, type ReactNode } from 'react';
import { Modal } from './Modal';
import type { BoardMeeting } from '../lib/db';

const BLUE = '#1A5FA8';

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1A5FA8] focus:ring-2 focus:ring-[#1A5FA8]/25 disabled:bg-gray-50 disabled:text-gray-500 transition-colors';

const MAX_OPTIONS = 8;
const MIN_OPTIONS = 2;

type PollKind = 'yes_no' | 'multiple';

type CreateInput = {
  title: string;
  description: string | null;
  closes_at: string;
  meeting_id: string | null;
  options: string[];
  open_immediately: boolean;
};

export function NewPollDialog({
  isOpen,
  onClose,
  meetings,
  onCreate,
}: {
  isOpen: boolean;
  onClose: () => void;
  meetings: BoardMeeting[];
  onCreate: (input: CreateInput) => Promise<{ error: string | null }>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [closesLocal, setClosesLocal] = useState('');
  const [meetingId, setMeetingId] = useState<string>('');
  const [kind, setKind] = useState<PollKind>('yes_no');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitle('');
    setDescription('');
    setClosesLocal('');
    setMeetingId('');
    setKind('yes_no');
    setOptions(['', '']);
    setError(null);
  };

  const onAddOption = () =>
    setOptions((cur) =>
      cur.length >= MAX_OPTIONS ? cur : [...cur, ''],
    );

  const onRemoveOption = (idx: number) =>
    setOptions((cur) =>
      cur.length <= MIN_OPTIONS ? cur : cur.filter((_, i) => i !== idx),
    );

  const onUpdateOption = (idx: number, val: string) =>
    setOptions((cur) => cur.map((o, i) => (i === idx ? val : o)));

  const submit = async (openImmediately: boolean) => {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!closesLocal) {
      setError('A closing date and time is required.');
      return;
    }
    const closesIso = new Date(closesLocal).toISOString();
    if (new Date(closesIso).getTime() <= Date.now()) {
      setError('Closing date must be in the future.');
      return;
    }
    const finalOptions =
      kind === 'yes_no'
        ? ['Yes', 'No', 'Abstain']
        : options.map((s) => s.trim());
    const cleaned = finalOptions.filter((s) => s.length > 0);
    if (cleaned.length < MIN_OPTIONS) {
      setError('At least two options are required.');
      return;
    }
    if (new Set(cleaned).size !== cleaned.length) {
      setError('Option labels must be unique.');
      return;
    }

    setError(null);
    setBusy(true);
    const { error: createErr } = await onCreate({
      title,
      description: description.trim() || null,
      closes_at: closesIso,
      meeting_id: meetingId || null,
      options: cleaned,
      open_immediately: openImmediately,
    });
    setBusy(false);
    if (createErr) {
      setError(createErr);
      return;
    }
    reset();
    onClose();
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void submit(false);
  };

  const safeClose = busy ? () => {} : onClose;

  return (
    <Modal isOpen={isOpen} onClose={safeClose} title="New poll" size="lg">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Question" required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={busy}
            autoFocus
            placeholder="What are we voting on?"
            className={inputClass}
          />
        </Field>

        <Field label="Description (optional)">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={busy}
            rows={3}
            placeholder="Add any context members should read before voting."
            className={inputClass}
          />
        </Field>

        <fieldset disabled={busy} className="space-y-2">
          <legend className="block text-sm font-medium text-gray-700 mb-1">
            Poll type
          </legend>
          <div className="flex gap-4">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="poll-kind"
                checked={kind === 'yes_no'}
                onChange={() => setKind('yes_no')}
                className="accent-[#1A5FA8]"
              />
              Yes / No
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="poll-kind"
                checked={kind === 'multiple'}
                onChange={() => setKind('multiple')}
                className="accent-[#1A5FA8]"
              />
              Multiple choice (single-select)
            </label>
          </div>
        </fieldset>

        {kind === 'multiple' && (
          <div className="space-y-2">
            <span className="block text-sm font-medium text-gray-700">
              Options{' '}
              <span className="text-gray-400 font-normal">
                (2–{MAX_OPTIONS})
              </span>
            </span>
            {options.map((val, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={val}
                  onChange={(e) => onUpdateOption(i, e.target.value)}
                  disabled={busy}
                  placeholder={`Option ${i + 1}`}
                  className={inputClass}
                />
                {options.length > MIN_OPTIONS && (
                  <button
                    type="button"
                    onClick={() => onRemoveOption(i)}
                    disabled={busy}
                    aria-label={`Remove option ${i + 1}`}
                    className="text-gray-400 hover:text-red-600 text-lg leading-none w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-50 transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {options.length < MAX_OPTIONS && (
              <button
                type="button"
                onClick={onAddOption}
                disabled={busy}
                className="text-xs font-medium hover:underline disabled:opacity-50"
                style={{ color: BLUE }}
              >
                + Add another option
              </button>
            )}
          </div>
        )}

        <Field
          label="Closes at"
          required
          hint="Voting will be available until this date and time."
        >
          <input
            type="datetime-local"
            value={closesLocal}
            onChange={(e) => setClosesLocal(e.target.value)}
            disabled={busy}
            className={inputClass}
          />
        </Field>

        <Field label="Link to meeting (optional)">
          <select
            value={meetingId}
            onChange={(e) => setMeetingId(e.target.value)}
            disabled={busy}
            className={inputClass}
          >
            <option value="">No meeting link</option>
            {meetings.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
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
            className="rounded-lg px-4 py-2 text-sm font-medium border hover:bg-gray-50 disabled:opacity-50 transition-colors"
            style={{ color: BLUE, borderColor: `${BLUE}55` }}
          >
            {busy ? 'Saving…' : 'Save as draft'}
          </button>
          <button
            type="button"
            onClick={() => void submit(true)}
            disabled={busy}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60 hover:opacity-95 transition-opacity"
            style={{ background: BLUE }}
          >
            {busy ? 'Opening…' : 'Open poll now'}
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
