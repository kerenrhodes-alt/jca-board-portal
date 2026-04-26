import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { isDeleted, type EnrichedPost } from '../hooks/usePosts';

const BLUE = '#1A5FA8';

// Card for a top-level post or a reply. Same visual shape; replies
// are visually distinguished by an indent and a slight tint.
//
// Adapted from mercaz-react/src/components/PostCard.tsx with these
// changes:
//   - No emoji reactions (not in Board Portal schema).
//   - No photo rendering (text-only Phase 6).
//   - Soft-deleted posts (author_id null + marker body) render with
//     italic gray treatment, no menu, no reply button.
//   - Lock state hides the reply button on top-level posts.

export function PostCard({
  post,
  isReply,
  isThreadLocked,
  canEdit,
  canDelete,
  onReply,
  onEdit,
  onDelete,
}: {
  post: EnrichedPost;
  isReply: boolean;
  isThreadLocked: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onReply?: () => void;
  onEdit: (newBody: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.body ?? '');
  const [busy, setBusy] = useState(false);

  const deleted = isDeleted(post);

  const containerClass = [
    'rounded-xl border p-4',
    isReply ? 'ml-8 mt-2 bg-[#F5F8FC] border-gray-100' : 'mb-2 bg-white border-gray-200',
  ].join(' ');

  if (deleted) {
    return (
      <div className={containerClass}>
        <p className="text-sm italic text-gray-400">{post.body}</p>
      </div>
    );
  }

  const handleSaveEdit = async () => {
    setBusy(true);
    try {
      await onEdit(draft);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={containerClass}>
      <div className="flex items-start gap-3">
        <Avatar name={post.author_name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <div className="text-sm font-semibold text-gray-900 truncate">
              {post.author_name}
            </div>
            <div className="text-xs text-gray-500 shrink-0 flex items-center gap-1">
              <span>{formatTimeAgo(post.created_at)}</span>
              {(canEdit || canDelete) && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowMenu((s) => !s)}
                    aria-label="Post menu"
                    className="text-gray-400 hover:text-gray-600 text-lg leading-none px-1 transition-colors"
                  >
                    ⋯
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-md py-1 z-10 flex flex-col min-w-[160px]">
                      {canEdit && !editing && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(true);
                            setShowMenu(false);
                          }}
                          className="px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                        >
                          Edit post
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={async () => {
                            setShowMenu(false);
                            if (!window.confirm('Delete this post?')) return;
                            setBusy(true);
                            try {
                              await onDelete();
                            } finally {
                              setBusy(false);
                            }
                          }}
                          className="px-3 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 whitespace-nowrap"
                        >
                          Delete post
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {!editing && (
            <>
              {post.body && (
                <div className="mt-1 text-sm leading-relaxed text-gray-800 whitespace-pre-wrap break-words">
                  {post.body}
                </div>
              )}
              {!isReply && onReply && !isThreadLocked && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={onReply}
                    className="text-xs font-medium hover:underline"
                    style={{ color: BLUE }}
                  >
                    ↩ Reply
                  </button>
                </div>
              )}
            </>
          )}

          {editing && (
            <div className="mt-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={busy}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1A5FA8] focus:ring-2 focus:ring-[#1A5FA8]/25 disabled:bg-gray-50 transition-colors"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={busy || !draft.trim()}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60 hover:opacity-95 transition-opacity"
                  style={{ background: BLUE }}
                >
                  {busy ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setDraft(post.body ?? '');
                  }}
                  disabled={busy}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?';
  return (
    <div
      aria-hidden="true"
      className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold text-white"
      style={{ background: BLUE }}
    >
      {initials}
    </div>
  );
}

function formatTimeAgo(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return '';
  }
}
