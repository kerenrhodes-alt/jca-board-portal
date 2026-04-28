import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { usePolls } from '../hooks/usePolls';
import { useMeetings } from '../hooks/useMeetings';
import { PollCard } from '../components/PollCard';
import { NewPollDialog } from '../components/NewPollDialog';

const BLUE = '#1A5FA8';

export function Voting() {
  const { isAdmin } = useAuth();
  const { polls, loading, error, reload, createPoll } = usePolls();
  const { meetings } = useMeetings();
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="px-10 py-10 max-w-5xl">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold" style={{ color: BLUE }}>
            Voting
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Open polls and past results. Every vote is visible to the
            full board.
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowNew(true)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white whitespace-nowrap hover:opacity-95 transition-opacity"
            style={{ background: BLUE }}
          >
            + New poll
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 flex items-center gap-3"
        >
          <span>Could not load polls: {error}</span>
          <button
            type="button"
            onClick={reload}
            className="underline font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {loading && polls.length === 0 ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : polls.length === 0 ? (
        <div className="rounded-xl bg-white shadow-sm border border-gray-100 px-6 py-10 text-center">
          <p className="text-sm text-gray-700">No polls yet.</p>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowNew(true)}
              className="mt-3 rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-95 transition-opacity"
              style={{ background: BLUE }}
            >
              Create the first poll
            </button>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {polls.map((p) => (
            <li key={p.id}>
              <PollCard poll={p} />
            </li>
          ))}
        </ul>
      )}

      <NewPollDialog
        isOpen={showNew}
        onClose={() => setShowNew(false)}
        meetings={meetings}
        onCreate={createPoll}
      />
    </div>
  );
}
