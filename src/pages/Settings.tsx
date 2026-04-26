import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useMembers } from '../hooks/useMembers';
import { useMeetings } from '../hooks/useMeetings';
import { AddMemberDialog } from '../components/AddMemberDialog';
import { EditMemberDialog } from '../components/EditMemberDialog';
import { MembersTable } from '../components/MembersTable';
import { AddMeetingDialog } from '../components/AddMeetingDialog';
import { EditMeetingDialog } from '../components/EditMeetingDialog';
import { MeetingsTable } from '../components/MeetingsTable';
import type { BoardMember, BoardMeeting } from '../lib/db';

const BLUE = '#1A5FA8';

export function Settings() {
  const {
    members,
    loading: membersLoading,
    error: membersError,
    reload: reloadMembers,
    addMember,
    updateMember,
  } = useMembers();
  const {
    meetings,
    loading: meetingsLoading,
    error: meetingsError,
    reload: reloadMeetings,
    addMeeting,
    updateMeeting,
    deleteMeeting,
  } = useMeetings();
  const { member: currentMember } = useAuth();

  const [showAddMember, setShowAddMember] = useState(false);
  const [editingMember, setEditingMember] = useState<BoardMember | null>(null);
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<BoardMeeting | null>(
    null,
  );

  const activeAdminCount = useMemo(
    () =>
      members.filter((m) => m.role === 'admin' && m.status === 'active').length,
    [members],
  );

  const editingIsLastActiveAdmin =
    editingMember?.role === 'admin' &&
    editingMember.status === 'active' &&
    activeAdminCount === 1;

  const editingIsSelf = editingMember?.id === currentMember?.id;

  return (
    <div className="px-10 py-10 max-w-5xl">
      <section>
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1
              className="font-serif text-3xl font-bold"
              style={{ color: BLUE }}
            >
              Members
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage who has access to the board portal.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddMember(true)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-95 whitespace-nowrap"
            style={{ background: BLUE }}
          >
            + Add member
          </button>
        </div>

        {membersError && (
          <div
            role="alert"
            className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 flex items-center gap-3"
          >
            <span>Could not load members: {membersError}</span>
            <button
              type="button"
              onClick={reloadMembers}
              className="underline font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {membersLoading && members.length === 0 ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <div className="rounded-xl bg-white shadow-sm border border-gray-100 px-5 py-2">
            <MembersTable
              members={members}
              onEdit={(m) => setEditingMember(m)}
            />
          </div>
        )}
      </section>

      <section className="mt-12">
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h2
              className="font-serif text-3xl font-bold"
              style={{ color: BLUE }}
            >
              Meetings
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Add board meetings and link each to its Drive folder.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddMeeting(true)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-95 whitespace-nowrap"
            style={{ background: BLUE }}
          >
            + Add meeting
          </button>
        </div>

        {meetingsError && (
          <div
            role="alert"
            className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 flex items-center gap-3"
          >
            <span>Could not load meetings: {meetingsError}</span>
            <button
              type="button"
              onClick={reloadMeetings}
              className="underline font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {meetingsLoading && meetings.length === 0 ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <div className="rounded-xl bg-white shadow-sm border border-gray-100 px-5 py-2">
            <MeetingsTable
              meetings={meetings}
              onEdit={(m) => setEditingMeeting(m)}
            />
          </div>
        )}
      </section>

      <AddMemberDialog
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        onAdd={addMember}
      />
      <EditMemberDialog
        isOpen={editingMember !== null}
        onClose={() => setEditingMember(null)}
        member={editingMember}
        onUpdate={updateMember}
        isLastActiveAdmin={editingIsLastActiveAdmin}
        isSelf={editingIsSelf}
      />

      <AddMeetingDialog
        isOpen={showAddMeeting}
        onClose={() => setShowAddMeeting(false)}
        onAdd={addMeeting}
      />
      <EditMeetingDialog
        isOpen={editingMeeting !== null}
        onClose={() => setEditingMeeting(null)}
        meeting={editingMeeting}
        onUpdate={updateMeeting}
        onDelete={deleteMeeting}
      />
    </div>
  );
}
