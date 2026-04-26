import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useMeetings } from '../hooks/useMeetings';
import { pickFeaturedMeeting } from '../lib/featuredMeeting';
import { MeetingPanel } from '../components/MeetingPanel';
import { AddMeetingDialog } from '../components/AddMeetingDialog';
import type { BoardMeeting } from '../lib/db';

const BLUE = '#1A5FA8';

export function Documents() {
  const { meetings, loading, error, reload, addMeeting } = useMeetings();
  const { isAdmin } = useAuth();
  const [showAdd, setShowAdd] = useState(false);

  const featured = useMemo(() => pickFeaturedMeeting(meetings), [meetings]);

  const groupedByYear = useMemo(() => groupByYear(meetings), [meetings]);

  return (
    <div className="px-10 py-10 max-w-5xl">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold" style={{ color: BLUE }}>
            Documents
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Materials for each board meeting.
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white whitespace-nowrap hover:opacity-95 transition-opacity"
            style={{ background: BLUE }}
          >
            + Add meeting
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 flex items-center gap-3"
        >
          <span>Could not load meetings: {error}</span>
          <button
            type="button"
            onClick={reload}
            className="underline font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {loading && meetings.length === 0 ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : meetings.length === 0 ? (
        <div className="rounded-xl bg-white shadow-sm border border-gray-100 px-6 py-10 text-center">
          {isAdmin ? (
            <>
              <p className="text-sm text-gray-700">No meetings yet.</p>
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="mt-3 rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-95 transition-opacity"
                style={{ background: BLUE }}
              >
                Add your first meeting
              </button>
            </>
          ) : (
            <p className="text-sm text-gray-700">
              No meetings yet — your admin will add them soon.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {groupedByYear.map(({ year, items }) => (
            <section key={year}>
              <h2 className="font-serif text-xl font-bold text-gray-700 mb-3">
                {year}
              </h2>
              <div className="space-y-3">
                {items.map((m) => (
                  <MeetingPanel
                    key={m.id}
                    meeting={m}
                    isFeatured={featured?.id === m.id}
                    defaultExpanded={featured?.id === m.id}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <AddMeetingDialog
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={addMeeting}
      />
    </div>
  );
}

// Groups meetings into year buckets, year desc and meetings within
// each year already in desc order (useMeetings sorts by meeting_date
// desc on fetch).
function groupByYear(
  meetings: BoardMeeting[],
): { year: string; items: BoardMeeting[] }[] {
  const byYear = new Map<string, BoardMeeting[]>();
  for (const m of meetings) {
    const year = m.meeting_date.slice(0, 4);
    const arr = byYear.get(year) ?? [];
    arr.push(m);
    byYear.set(year, arr);
  }
  return Array.from(byYear.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, items]) => ({ year, items }));
}
