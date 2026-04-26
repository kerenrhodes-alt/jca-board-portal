import { format, parseISO } from 'date-fns';
import type { BoardMeeting } from '../lib/db';

const BLUE = '#1A5FA8';

export function MeetingsTable({
  meetings,
  onEdit,
}: {
  meetings: BoardMeeting[];
  onEdit: (meeting: BoardMeeting) => void;
}) {
  if (meetings.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-gray-500 text-center">
        No meetings yet. Click "Add meeting" to create one.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
          <tr>
            <th className="py-3 pr-4 font-medium">Date</th>
            <th className="py-3 pr-4 font-medium">Title</th>
            <th className="py-3 pr-4 font-medium">Drive folder</th>
            <th className="py-3 pr-2 font-medium w-px"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {meetings.map((m) => (
            <tr key={m.id}>
              <td className="py-3 pr-4 text-gray-900 whitespace-nowrap">
                {formatDate(m.meeting_date)}
              </td>
              <td className="py-3 pr-4 font-medium text-gray-900">
                {m.title}
              </td>
              <td className="py-3 pr-4 text-xs text-gray-500 font-mono">
                {m.drive_folder_id ? (
                  truncateMiddle(m.drive_folder_id, 22)
                ) : (
                  <span className="italic text-gray-400">none</span>
                )}
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

function formatDate(iso: string): string {
  // meeting_date can come back as 'YYYY-MM-DD' or a full timestamp
  // depending on whether the column is `date` or `timestamptz`. Slice
  // to the date portion to avoid TZ-shift surprises.
  const datePart = iso.slice(0, 10);
  const d = parseISO(datePart);
  if (isNaN(d.getTime())) return iso;
  return format(d, 'MMM d, yyyy');
}

function truncateMiddle(s: string, max: number): string {
  if (s.length <= max) return s;
  const half = Math.floor((max - 1) / 2);
  return s.slice(0, half) + '…' + s.slice(-half);
}
