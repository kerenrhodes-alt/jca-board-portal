import { Link } from 'react-router-dom';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import type { EnrichedPoll } from '../hooks/usePolls';
import { isPastDeadline } from '../hooks/usePolls';

const BLUE = '#1A5FA8';
const GOLD = '#C8922A';

export function PollCard({ poll }: { poll: EnrichedPoll }) {
  const past = isPastDeadline(poll);
  const showsUnvotedDot =
    poll.status === 'open' && !poll.has_voted && !past;

  return (
    <Link
      to={`/voting/${poll.id}`}
      className="block rounded-xl bg-white shadow-sm border border-gray-100 px-5 py-4 hover:border-[#1A5FA8]/30 hover:shadow transition-all"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-1.5 w-2 h-2 rounded-full shrink-0"
          style={{
            background: showsUnvotedDot ? BLUE : 'transparent',
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-gray-900 truncate">
              {poll.title}
            </h3>
            <StatusPill status={poll.status} pastDeadline={past} />
            {poll.has_voted && poll.status === 'open' && (
              <span className="inline-flex items-center rounded-full bg-green-50 text-green-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                Voted
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            {deadlineHint(poll)} · {poll.vote_count}{' '}
            {poll.vote_count === 1 ? 'vote' : 'votes'} ·{' '}
            {poll.options.length}{' '}
            {poll.options.length === 1 ? 'option' : 'options'}
          </p>
        </div>
      </div>
    </Link>
  );
}

function StatusPill({
  status,
  pastDeadline,
}: {
  status: EnrichedPoll['status'];
  pastDeadline: boolean;
}) {
  if (status === 'draft') {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
        Draft
      </span>
    );
  }
  if (status === 'open') {
    return (
      <span
        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
        style={{ background: pastDeadline ? '#9CA3AF' : GOLD }}
      >
        {pastDeadline ? 'Awaiting close' : 'Open'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-200 text-gray-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
      Closed
    </span>
  );
}

function deadlineHint(poll: EnrichedPoll): string {
  if (!poll.closes_at) return 'No deadline';
  const closes = parseISO(poll.closes_at);
  if (poll.status === 'closed' || isPastDeadline(poll)) {
    return `Closed ${format(closes, 'MMM d, yyyy')}`;
  }
  if (poll.status === 'draft') {
    return `Drafted, will close ${format(closes, 'MMM d, yyyy')}`;
  }
  return `Closes ${formatDistanceToNow(closes, { addSuffix: true })}`;
}
