import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useThreads } from '../hooks/useThreads';
import { usePosts } from '../hooks/usePosts';
import { useThreadReads } from '../hooks/useThreadReads';
import { PostCard } from '../components/PostCard';
import { ReplyComposer } from '../components/ReplyComposer';
import { PostComposer } from '../components/PostComposer';
import { ThreadAttachment } from '../components/ThreadAttachment';
import { LockToggle } from '../components/LockToggle';

const BLUE = '#1A5FA8';

const REPLY_PREVIEW_COUNT = 2;

// Adapted from mercaz-react/src/pages/hub/ThreadPage.tsx. Layout
// preserved; data plumbing swapped for Board Portal hooks; lock state
// + attachment header + admin lock toggle added.
export function ThreadDetail() {
  const { threadId } = useParams<{ threadId: string }>();
  const { isAdmin } = useAuth();
  const { threads, updateThread } = useThreads();
  const { markThreadRead } = useThreadReads();
  const {
    posts,
    error,
    loading,
    reload,
    createPost,
    editPost,
    deletePost,
    canEdit,
    canDelete,
  } = usePosts(threadId);

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set(),
  );
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Mark read on mount / when threadId changes.
  useEffect(() => {
    if (threadId) void markThreadRead(threadId);
  }, [threadId, markThreadRead]);

  const thread = (threads ?? []).find((t) => t.id === threadId) ?? null;

  const toggleReplies = (postId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  if (threads === null) {
    return (
      <div className="px-10 py-10 max-w-5xl">
        <p className="text-sm text-gray-500">Loading thread…</p>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="px-10 py-10 max-w-5xl">
        <p className="text-sm text-gray-700">
          That thread doesn't exist or has been removed.{' '}
          <Link to="/discussions" className="underline" style={{ color: BLUE }}>
            Back to discussions
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="px-10 py-10 max-w-5xl">
      <div className="mb-2">
        <Link
          to="/discussions"
          className="text-xs font-medium hover:underline"
          style={{ color: BLUE }}
        >
          ← All discussions
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <h1
            className="font-serif text-2xl font-bold"
            style={{ color: BLUE }}
          >
            {thread.title}
          </h1>
          {thread.is_locked && (
            <p className="mt-1 text-xs uppercase tracking-wider font-semibold text-gray-500">
              🔒 This thread is locked
            </p>
          )}
        </div>
        {isAdmin && (
          <LockToggle
            isLocked={thread.is_locked}
            onToggle={(next) =>
              updateThread(thread.id, { is_locked: next })
            }
          />
        )}
      </div>

      {thread.drive_file_id && (
        <div className="mb-5">
          <ThreadAttachment driveFileId={thread.drive_file_id} />
        </div>
      )}

      {errorBanner && (
        <div
          role="alert"
          className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {errorBanner}
        </div>
      )}

      <div className="mb-6">
        {loading ? (
          <p className="text-sm text-gray-500">Loading posts…</p>
        ) : error ? (
          <div className="text-sm text-red-700">
            <p>Could not load posts: {error}</p>
            <button
              type="button"
              onClick={reload}
              className="mt-1 text-xs underline font-medium"
            >
              Retry
            </button>
          </div>
        ) : posts.length === 0 ? (
          <p className="text-sm text-gray-500">
            No posts in this thread yet. Start the conversation!
          </p>
        ) : (
          <ul className="space-y-2">
            {posts.map((p) => {
              const totalReplies = p.replies.length;
              const isExpanded = expandedReplies.has(p.id);
              const shouldCollapse =
                totalReplies > REPLY_PREVIEW_COUNT && !isExpanded;
              const visibleReplies = shouldCollapse
                ? p.replies.slice(0, REPLY_PREVIEW_COUNT)
                : p.replies;
              const hiddenCount = totalReplies - REPLY_PREVIEW_COUNT;
              return (
                <li key={p.id}>
                  <PostCard
                    post={p}
                    isReply={false}
                    isThreadLocked={thread.is_locked}
                    canEdit={canEdit(p)}
                    canDelete={canDelete(p)}
                    onReply={() => setReplyingTo(p.id)}
                    onEdit={async (body) => {
                      const { error: editErr } = await editPost(p.id, body);
                      if (editErr) setErrorBanner(editErr);
                    }}
                    onDelete={async () => {
                      const isOwn = canEdit(p); // canEdit reflects authorship
                      const { error: delErr } = await deletePost(p.id, isOwn);
                      if (delErr) setErrorBanner(delErr);
                    }}
                  />
                  {visibleReplies.map((r) => (
                    <PostCard
                      key={r.id}
                      post={r}
                      isReply
                      isThreadLocked={thread.is_locked}
                      canEdit={canEdit(r)}
                      canDelete={canDelete(r)}
                      onEdit={async (body) => {
                        const { error: editErr } = await editPost(r.id, body);
                        if (editErr) setErrorBanner(editErr);
                      }}
                      onDelete={async () => {
                        const isOwn = canEdit(r);
                        const { error: delErr } = await deletePost(r.id, isOwn);
                        if (delErr) setErrorBanner(delErr);
                      }}
                    />
                  ))}
                  {totalReplies > REPLY_PREVIEW_COUNT && (
                    <button
                      type="button"
                      onClick={() => toggleReplies(p.id)}
                      className="ml-8 mt-2 px-3 py-1.5 rounded-full text-xs font-medium border bg-white hover:bg-gray-50 transition-colors"
                      style={{ color: BLUE, borderColor: `${BLUE}55` }}
                    >
                      {isExpanded
                        ? '▲ Show fewer replies'
                        : `▼ Show ${hiddenCount} more ${
                            hiddenCount === 1 ? 'reply' : 'replies'
                          }`}
                    </button>
                  )}
                  {replyingTo === p.id && !thread.is_locked && (
                    <ReplyComposer
                      onSubmit={async (body) => {
                        const { error: replyErr } = await createPost(body, p.id);
                        if (replyErr) {
                          setErrorBanner(replyErr);
                          return;
                        }
                        setReplyingTo(null);
                      }}
                      onCancel={() => setReplyingTo(null)}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {thread.is_locked ? (
        <p className="text-sm text-gray-500 italic">
          This thread is locked. Posting is disabled until an admin unlocks it.
        </p>
      ) : (
        <PostComposer
          onSubmit={(body) => createPost(body, null)}
          onError={(m) => setErrorBanner(m)}
        />
      )}
    </div>
  );
}
