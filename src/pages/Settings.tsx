import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useMembers } from '../hooks/useMembers';
import { AddMemberDialog } from '../components/AddMemberDialog';
import { EditMemberDialog } from '../components/EditMemberDialog';
import { MembersTable } from '../components/MembersTable';
import type { BoardMember } from '../lib/db';

const BLUE = '#1A5FA8';

export function Settings() {
  const { members, loading, error, reload, addMember, updateMember } =
    useMembers();
  const { member: currentMember } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<BoardMember | null>(null);

  const activeAdminCount = useMemo(
    () =>
      members.filter((m) => m.role === 'admin' && m.status === 'active').length,
    [members],
  );

  const editingIsLastActiveAdmin =
    editing?.role === 'admin' &&
    editing.status === 'active' &&
    activeAdminCount === 1;

  const editingIsSelf = editing?.id === currentMember?.id;

  return (
    <div className="px-10 py-10 max-w-5xl">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold" style={{ color: BLUE }}>
            Members
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage who has access to the board portal.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-95 whitespace-nowrap"
          style={{ background: BLUE }}
        >
          + Add member
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 flex items-center gap-3"
        >
          <span>Could not load members: {error}</span>
          <button
            type="button"
            onClick={reload}
            className="underline font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {loading && members.length === 0 ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="rounded-xl bg-white shadow-sm border border-gray-100 px-5 py-2">
          <MembersTable members={members} onEdit={(m) => setEditing(m)} />
        </div>
      )}

      <AddMemberDialog
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={addMember}
      />

      <EditMemberDialog
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        member={editing}
        onUpdate={updateMember}
        isLastActiveAdmin={editingIsLastActiveAdmin}
        isSelf={editingIsSelf}
      />
    </div>
  );
}
