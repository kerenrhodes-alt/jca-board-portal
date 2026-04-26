import { useState, type FormEvent, type ReactNode } from 'react';
import { Modal } from './Modal';
import type { BoardMember } from '../lib/db';

const BLUE = '#1A5FA8';

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1A5FA8] focus:ring-2 focus:ring-[#1A5FA8]/25 disabled:bg-gray-50 disabled:text-gray-500 transition-colors';

type AddInput = {
  full_name: string;
  email: string;
  role: BoardMember['role'];
};

export function AddMemberDialog({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (input: AddInput) => Promise<{ error: string | null }>;
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<BoardMember['role']>('member');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFullName('');
    setEmail('');
    setRole('member');
    setError(null);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setError('Name and email are both required.');
      return;
    }
    setError(null);
    setBusy(true);
    const { error: addErr } = await onAdd({
      full_name: fullName,
      email,
      role,
    });
    setBusy(false);
    if (addErr) {
      setError(addErr);
      return;
    }
    reset();
    onClose();
  };

  // Block close while a submit is in flight to avoid orphaned state.
  const safeClose = busy ? () => {} : onClose;

  return (
    <Modal isOpen={isOpen} onClose={safeClose} title="Add member">
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label="Full name" required>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={busy}
            autoFocus
            className={inputClass}
          />
        </Field>
        <Field label="Email address" required>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            placeholder="person@example.com"
            className={inputClass}
          />
        </Field>
        <Field label="Role">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as BoardMember['role'])}
            disabled={busy}
            className={inputClass}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
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
            className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60 hover:opacity-95 transition-opacity"
            style={{ background: BLUE }}
          >
            {busy ? 'Adding…' : 'Add member'}
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
