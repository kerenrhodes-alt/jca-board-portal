import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Modal } from './Modal';
import type { BoardMember, BoardMemberUpdate } from '../lib/db';

const BLUE = '#1A5FA8';

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1A5FA8] focus:ring-2 focus:ring-[#1A5FA8]/25 disabled:bg-gray-50 disabled:text-gray-500 transition-colors';

const inputClassReadonly =
  'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 cursor-not-allowed';

export function EditMemberDialog({
  isOpen,
  onClose,
  member,
  onUpdate,
  isLastActiveAdmin,
  isSelf,
}: {
  isOpen: boolean;
  onClose: () => void;
  member: BoardMember | null;
  onUpdate: (
    id: string,
    patch: BoardMemberUpdate,
  ) => Promise<{ error: string | null }>;
  isLastActiveAdmin: boolean;
  isSelf: boolean;
}) {
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<BoardMember['role']>('member');
  const [status, setStatus] = useState<BoardMember['status']>('active');
  const [termStart, setTermStart] = useState('');
  const [termEnd, setTermEnd] = useState('');
  const [bio, setBio] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form to the latest member values whenever the dialog opens
  // or the target member changes.
  useEffect(() => {
    if (member && isOpen) {
      setFullName(member.full_name);
      setRole(member.role);
      setStatus(member.status);
      setTermStart(member.term_start ?? '');
      setTermEnd(member.term_end ?? '');
      setBio(member.bio ?? '');
      setError(null);
      setBusy(false);
    }
  }, [member, isOpen]);

  if (!member) return null;

  // Client-side mirror of the server trigger. Both demoting AND
  // deactivating the last active admin would leave zero admins.
  const willDemote = role !== 'admin';
  const willDeactivate = status !== 'active';
  const wouldRemoveLastAdmin =
    isLastActiveAdmin && (willDemote || willDeactivate);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Name is required.');
      return;
    }
    if (wouldRemoveLastAdmin) {
      setError(
        'You cannot remove the last active admin. Promote another member to admin first.',
      );
      return;
    }
    setError(null);
    setBusy(true);
    const patch: BoardMemberUpdate = {
      full_name: fullName.trim(),
      role,
      status,
      term_start: termStart || null,
      term_end: termEnd || null,
      bio: bio.trim() || null,
    };
    const { error: updateErr } = await onUpdate(member.id, patch);
    setBusy(false);
    if (updateErr) {
      setError(updateErr);
      return;
    }
    onClose();
  };

  const safeClose = busy ? () => {} : onClose;

  return (
    <Modal isOpen={isOpen} onClose={safeClose} title="Edit member" size="lg">
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

        <Field
          label="Email"
          hint="Email cannot be changed — it's the sign-in identity."
        >
          <input
            type="email"
            value={member.email}
            disabled
            className={inputClassReadonly}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
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
          <Field label="Status">
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as BoardMember['status'])
              }
              disabled={busy}
              className={inputClass}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Term start">
            <input
              type="date"
              value={termStart}
              onChange={(e) => setTermStart(e.target.value)}
              disabled={busy}
              className={inputClass}
            />
          </Field>
          <Field label="Term end">
            <input
              type="date"
              value={termEnd}
              onChange={(e) => setTermEnd(e.target.value)}
              disabled={busy}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Bio (optional)">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={busy}
            rows={2}
            className={inputClass}
          />
        </Field>

        {wouldRemoveLastAdmin && (
          <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
            This member is the last active admin. Promote another member to
            admin before {willDemote ? 'demoting' : 'deactivating'} them.
          </div>
        )}

        {isSelf && willDeactivate && !wouldRemoveLastAdmin && (
          <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
            You're about to deactivate your own account — you'll lose access
            on your next sign-in.
          </div>
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
            disabled={busy || wouldRemoveLastAdmin}
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
      {hint && <span className="block mt-1 text-xs text-gray-500">{hint}</span>}
    </label>
  );
}
