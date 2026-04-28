import type { BoardPollOption } from '../lib/db';
import type { DecoratedVote } from '../hooks/usePollDetail';

// Voter transparency view: every option is listed with the names of
// the members who picked it. This is the "fully transparent voting"
// guarantee from the Phase 7 spec — admins and members alike can see
// who voted how.
export function VoterList({
  options,
  votes,
}: {
  options: BoardPollOption[];
  votes: DecoratedVote[];
}) {
  if (votes.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">
        No votes have been cast yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {options.map((opt) => {
        const optionVotes = votes.filter((v) => v.option_id === opt.id);
        return (
          <div key={opt.id}>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              {opt.label}
              <span className="ml-2 normal-case font-normal text-gray-400">
                ({optionVotes.length})
              </span>
            </p>
            {optionVotes.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No votes</p>
            ) : (
              <ul className="flex flex-wrap gap-1.5">
                {optionVotes.map((v) => (
                  <li
                    key={v.id}
                    className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700"
                  >
                    {v.voter_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
