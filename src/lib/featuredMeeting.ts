import type { BoardMeeting } from './db';

const DAYS_OF_GRACE = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Picks the meeting to feature on the Documents page.
// Rule (resolved 2026-04-26): the first meeting (chronologically)
// whose date is on or after `today - 7 days`. So a meeting stays
// featured for the 7 calendar days following its date, then rolls
// to the next upcoming meeting on day 8.
//
// Returns null if no meeting meets the criterion (e.g., the most
// recent meeting is more than 7 days past and no future meeting
// exists yet).
export function pickFeaturedMeeting(
  meetings: BoardMeeting[],
  today: Date = new Date(),
): BoardMeeting | null {
  const cutoff = new Date(today.getTime() - DAYS_OF_GRACE * MS_PER_DAY);
  const cutoffIso = toIsoDate(cutoff);

  // board_meetings.meeting_date is a Postgres date column, returned by
  // Supabase as 'YYYY-MM-DD'. ISO date strings sort correctly via plain
  // string comparison, so no Date object needed for the comparison.
  const sortedAsc = meetings
    .slice()
    .sort((a, b) => a.meeting_date.localeCompare(b.meeting_date));

  for (const m of sortedAsc) {
    if (m.meeting_date >= cutoffIso) return m;
  }
  return null;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
