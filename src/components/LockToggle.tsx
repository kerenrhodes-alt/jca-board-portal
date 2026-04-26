import { useState } from 'react';

// Admin-only lock/unlock control. Locked threads are read-only for
// everyone (including admins) per Phase 6 spec — admins re-open by
// unlocking from this same control.
export function LockToggle({
  isLocked,
  onToggle,
}: {
  isLocked: boolean;
  onToggle: (next: boolean) => Promise<{ error: string | null }>;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleClick = async () => {
    const next = !isLocked;
    const message = next
      ? 'Lock this thread? Posts and replies will be disabled until it is unlocked.'
      : 'Unlock this thread and re-open it for posting?';
    if (!window.confirm(message)) return;
    setBusy(true);
    setErr(null);
    const { error } = await onToggle(next);
    setBusy(false);
    if (error) setErr(error);
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        {busy
          ? 'Saving…'
          : isLocked
            ? 'Unlock thread'
            : 'Lock thread'}
      </button>
      {err && <p className="text-xs text-red-700">{err}</p>}
    </div>
  );
}
