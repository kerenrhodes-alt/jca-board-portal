import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { useAuth } from '../auth/AuthProvider';
import { usePollDetail } from '../hooks/usePollDetail';
import { usePolls, isPastDeadline } from '../hooks/usePolls';
import { PollVoteForm } from '../components/PollVoteForm';
import { PollResultsBar } from '../components/PollResultsBar';
import { VoterList } from '../components/VoterList';
import { EditPollDialog } from '../components/EditPollDialog';

const BLUE = '#1A5FA8';

export function PollDetail() {
  const { pollId } = useParams<{ pollId: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const {
    poll,
    options,
    votes,
    loading,
    error,
    notFound,
    castVote,
    myVote,
    reload,
  } = usePollDetail(pollId);
  const { openPoll, closePoll, deletePoll, updatePoll } = usePolls();

  const [adminBusy, setAdminBusy] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  if (loading && !poll) {
    return (
      <div className="px-10 py-10 max-w-5xl">
        <p className="text-sm text-gray-500">Loading poll…</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="px-10 py-10 max-w-5xl">
        <p className="text-sm text-gray-700">
          That poll doesn't exist or has been removed.{' '}
          <Link to="/voting" className="underline" style={{ color: BLUE }}>
            Back to voting
          </Link>
        </p>
      </div>
    );
  }

  if (error && !poll) {
    return (
      <div className="px-10 py-10 max-w-5xl">
        <div
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 flex items-center gap-3"
        >
          <span>Could not load poll: {error}</span>
          <button
            type="button"
            onClick={reload}
            className="underline font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!poll) return null;

  const past = isPastDeadline(poll);
  const totalVotes = votes.length;
  const myOptionId = myVote?.option_id ?? null;

  const onAdminAction = async (
    fn: () => Promise<{ error: string | null }>,
    confirmMsg?: string,
  ) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setAdminBusy(true);
    setAdminError(null);
    const { error: actErr } = await fn();
    setAdminBusy(false);
    if (actErr) setAdminError(actErr);
  };

  return (
    <div className="px-10 py-10 max-w-5xl">
      <div className="mb-2">
        <Link
          to="/voting"
          className="text-xs font-medium hover:underline"
          style={{ color: BLUE }}
        >
          ← All polls
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <h1
            className="font-serif text-2xl font-bold"
            style={{ color: BLUE }}
          >
            {poll.title}
          </h1>
          <p className="mt-1 text-xs uppercase tracking-wider font-semibold text-gray-500">
            {statusLabel(poll.status, past)} · {deadlineHint(poll, past)}
          </p>
          {poll.description && (
            <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">
              {poll.description}
            </p>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {poll.status === 'draft' && (
            <button
              type="button"
              onClick={() =>
                onAdminAction(
                  () => openPoll(poll.id),
                  'Open this poll now? Members will be able to vote immediately.',
                )
              }
              disabled={adminBusy}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 hover:opacity-95 transition-opacity"
              style={{ background: BLUE }}
            >
              Open poll now
            </button>
          )}
          {poll.status === 'open' && (
            <button
              type="button"
              onClick={() =>
                onAdminAction(
                  () => closePoll(poll.id),
                  'Close this poll now? Members will no longer be able to vote.',
                )
              }
              disabled={adminBusy}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
              style={{ color: BLUE, borderColor: `${BLUE}55` }}
            >
              Close poll now
            </button>
          )}
          {poll.status !== 'closed' && (
            <button
              type="button"
              onClick={() => setShowEdit(true)}
              disabled={adminBusy}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors border-gray-300 text-gray-700"
            >
              Edit
            </button>
          )}
          {poll.status === 'draft' && (
            <button
              type="button"
              onClick={() =>
                onAdminAction(async () => {
                  const r = await deletePoll(poll.id);
                  if (!r.error) navigate('/voting');
                  return r;
                }, 'Delete this draft poll permanently?')
              }
              disabled={adminBusy}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              Delete draft
            </button>
          )}
        </div>
      )}

      {adminError && (
        <div
          role="alert"
          className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {adminError}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2
            className="font-serif text-lg font-bold mb-3"
            style={{ color: BLUE }}
          >
            Cast your vote
          </h2>
          <PollVoteForm
            options={options}
            hasVoted={!!myVote}
            myOptionId={myOptionId}
            disabled={poll.status !== 'open' || past}
            disabledReason={
              poll.status === 'draft'
                ? 'This poll is a draft and is not open for voting yet.'
                : poll.status === 'closed'
                  ? 'This poll is closed.'
                  : past
                    ? 'The deadline for this poll has passed.'
                    : undefined
            }
            onCast={castVote}
          />
        </section>

        <section>
          <h2
            className="font-serif text-lg font-bold mb-3"
            style={{ color: BLUE }}
          >
            Live results
          </h2>
          <p className="mb-3 text-xs text-gray-500">
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} so far
          </p>
          <div className="space-y-3">
            {options.map((opt) => (
              <PollResultsBar
                key={opt.id}
                label={opt.label}
                count={votes.filter((v) => v.option_id === opt.id).length}
                totalVotes={totalVotes}
                highlight={opt.id === myOptionId}
              />
            ))}
          </div>
        </section>
      </div>

      <section className="mt-10">
        <h2
          className="font-serif text-lg font-bold mb-3"
          style={{ color: BLUE }}
        >
          Who voted
        </h2>
        <p className="mb-3 text-xs text-gray-500">
          Votes on this board are not anonymous — every member can see how
          everyone voted.
        </p>
        <VoterList options={options} votes={votes} />
      </section>

      <EditPollDialog
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        poll={poll}
        onSave={updatePoll}
      />
    </div>
  );
}

function statusLabel(status: 'draft' | 'open' | 'closed', past: boolean): string {
  if (status === 'draft') return 'Draft';
  if (status === 'closed') return 'Closed';
  return past ? 'Awaiting close' : 'Open';
}

function deadlineHint(
  poll: { closes_at: string | null; status: 'draft' | 'open' | 'closed' },
  past: boolean,
): string {
  if (!poll.closes_at) return 'No deadline set';
  const closes = parseISO(poll.closes_at);
  if (poll.status === 'closed' || past) {
    return `Closed ${format(closes, 'MMM d, yyyy h:mm a')}`;
  }
  if (poll.status === 'draft') {
    return `Will close ${format(closes, 'MMM d, yyyy h:mm a')}`;
  }
  return `Closes ${formatDistanceToNow(closes, { addSuffix: true })}`;
}
