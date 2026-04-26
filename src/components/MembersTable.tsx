import type { BoardMember } from '../lib/db';

const BLUE = '#1A5FA8';

export function MembersTable({
  members,
  onEdit,
}: {
  members: BoardMember[];
  onEdit: (member: BoardMember) => void;
}) {
  if (members.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-gray-500 text-center">
        No members yet. Click "Add member" to get started.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
          <tr>
            <th className="py-3 pr-4 font-medium">Name</th>
            <th className="py-3 pr-4 font-medium">Email</th>
            <th className="py-3 pr-4 font-medium">Role</th>
            <th className="py-3 pr-4 font-medium">Status</th>
            <th className="py-3 pr-4 font-medium">Term</th>
            <th className="py-3 pr-2 font-medium w-px"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {members.map((m) => (
            <tr
              key={m.id}
              className={m.status === 'inactive' ? 'opacity-60' : undefined}
            >
              <td className="py-3 pr-4 font-medium text-gray-900">
                {m.full_name}
              </td>
              <td className="py-3 pr-4 text-gray-600">{m.email}</td>
              <td className="py-3 pr-4">
                {m.role === 'admin' ? (
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ background: '#1A5FA81A', color: BLUE }}
                  >
                    Admin
                  </span>
                ) : (
                  <span className="text-xs text-gray-600">Member</span>
                )}
              </td>
              <td className="py-3 pr-4">
                {m.status === 'active' ? (
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    Inactive
                  </span>
                )}
              </td>
              <td className="py-3 pr-4 text-xs text-gray-600 whitespace-nowrap">
                {formatTerm(m)}
              </td>
              <td className="py-3 pr-2">
                <button
                  type="button"
                  onClick={() => onEdit(m)}
                  className="text-xs font-medium hover:underline"
                  style={{ color: BLUE }}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatTerm(m: BoardMember): string {
  if (!m.term_start && !m.term_end) return '—';
  const start = m.term_start ? new Date(m.term_start).getFullYear() : '?';
  const end = m.term_end ? new Date(m.term_end).getFullYear() : 'present';
  return `${start}–${end}`;
}
