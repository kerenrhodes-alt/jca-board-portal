import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useThreads, type EnrichedThread } from '../hooks/useThreads';
import { useThreadReads } from '../hooks/useThreadReads';
import { NewThreadDialog } from '../components/NewThreadDialog';

const BLUE = '#1A5FA8';
const GOLD = '#C8922A';

export function Discussions() {
  const { threads, loading, error, reload, createThread } = useThreads();
  const { isUnread } = useThreadReads();
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="px-10 py-10 max-w-5xl">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold" style={{ color: BLUE }}>
            Discussions
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Threaded conversations between board members.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white whitespace-nowrap hover:opacity-95 transition-opacity"
          style={{ background: BLUE }}
        >
          + New thread
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 flex items-center gap-3"
        >
          <span>Could not load threads: {error}</span>
          <button
            type="button"
            onClick={reload}
            className="underline font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {loading && threads === null ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (threads ?? []).length === 0 ? (
        <div className="rounded-xl bg-white shadow-sm border border-gray-100 px-6 py-10 text-center">
          <p className="text-sm text-gray-700">No threads yet.</p>
          <button
            type="button"
            onClick={() => setShowNew(true)}
            className="mt-3 rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-95 transition-opacity"
            style={{ background: BLUE }}
          >
            Start the first discussion
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {(threads ?? []).map((t) => (
            <li key={t.id}>
              <ThreadRow thread={t} unread={isUnread(t)} />
            </li>
          ))}
        </ul>
      )}

      <NewThreadDialog
        isOpen={showNew}
        onClose={() => setShowNew(false)}
        onCreate={createThread}
      />
    </div>
  );
}

function ThreadRow({
  thread,
  unread,
}: {
  thread: EnrichedThread;
  unread: boolean;
}) {
  return (
    <Link
      to={`/discussions/${thread.id}`}
      className="block rounded-xl bg-white shadow-sm border border-gray-100 px-5 py-4 hover:border-[#1A5FA8]/30 hover:shadow transition-all"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-1.5 w-2 h-2 rounded-full shrink-0"
          style={{
            background: unread ? BLUE : 'transparent',
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-gray-900 truncate">
              {thread.title}
            </h3>
            {thread.is_pinned && (
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
                style={{ background: GOLD }}
              >
                Pinned
              </span>
            )}
            {thread.is_locked && (
              <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                Locked
              </span>
            )}
            {thread.drive_file_id && (
              <span
                aria-label="Has attachment"
                title="Has attached document"
                className="text-gray-400 text-xs"
              >
                📎
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-gray-500">
            Started by {thread.created_by_name} · Last activity{' '}
            {formatDistanceToNow(new Date(thread.last_post_at), {
              addSuffix: true,
            })}
          </p>
        </div>
      </div>
    </Link>
  );
}
