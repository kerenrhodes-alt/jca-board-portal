import { useState } from 'react';
import type { BoardPollOption } from '../lib/db';

const BLUE = '#1A5FA8';

// Single-select vote form. Renders a radio group of options and a
// "Cast vote" button. Once a member has voted (locked-in by spec),
// the form switches to a read-only display of their selection.
export function PollVoteForm({
  options,
  hasVoted,
  myOptionId,
  disabled,
  disabledReason,
  onCast,
}: {
  options: BoardPollOption[];
  hasVoted: boolean;
  myOptionId: string | null;
  disabled: boolean;
  disabledReason?: string;
  onCast: (optionId: string) => Promise<{ error: string | null }>;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (hasVoted) {
    const myOption = options.find((o) => o.id === myOptionId);
    return (
      <div
        className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm"
      >
        <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
          Your vote
        </p>
        <p className="mt-0.5 font-medium" style={{ color: BLUE }}>
          {myOption?.label ?? '—'}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Votes are final and cannot be changed.
        </p>
      </div>
    );
  }

  if (disabled) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 italic">
        {disabledReason ?? 'Voting is not available.'}
      </div>
    );
  }

  const onSubmit = async () => {
    if (!selected) {
      setError('Please choose an option before casting your vote.');
      return;
    }
    setError(null);
    setBusy(true);
    const { error: castErr } = await onCast(selected);
    setBusy(false);
    if (castErr) setError(castErr);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-4">
      <fieldset disabled={busy} className="space-y-2">
        <legend className="sr-only">Vote options</legend>
        {options.map((opt) => (
          <label
            key={opt.id}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
              selected === opt.id
                ? 'border-[#1A5FA8] bg-[#1A5FA8]/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="poll-vote"
              value={opt.id}
              checked={selected === opt.id}
              onChange={() => setSelected(opt.id)}
              className="accent-[#1A5FA8]"
            />
            <span className="text-sm text-gray-900">{opt.label}</span>
          </label>
        ))}
      </fieldset>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700"
        >
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-gray-500">
          Once cast, your vote is final.
        </p>
        <button
          type="button"
          onClick={onSubmit}
          disabled={busy || !selected}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:opacity-95 transition-opacity"
          style={{ background: BLUE }}
        >
          {busy ? 'Casting…' : 'Cast vote'}
        </button>
      </div>
    </div>
  );
}
