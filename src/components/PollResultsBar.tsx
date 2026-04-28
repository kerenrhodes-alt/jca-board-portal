const BLUE = '#1A5FA8';
const GOLD = '#C8922A';

export function PollResultsBar({
  label,
  count,
  totalVotes,
  highlight,
}: {
  label: string;
  count: number;
  totalVotes: number;
  highlight?: boolean;
}) {
  const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span
          className="font-medium text-gray-900 truncate"
          title={label}
        >
          {label}
          {highlight && (
            <span
              className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
              style={{ background: GOLD }}
            >
              Your vote
            </span>
          )}
        </span>
        <span className="text-xs text-gray-500 whitespace-nowrap ml-3">
          {count} {count === 1 ? 'vote' : 'votes'} · {pct}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${pct}%`}
        className="h-2 rounded-full bg-gray-100 overflow-hidden"
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            background: highlight ? GOLD : BLUE,
          }}
        />
      </div>
    </div>
  );
}
