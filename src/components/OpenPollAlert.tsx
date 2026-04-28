import { Link } from 'react-router-dom';
import { usePolls } from '../hooks/usePolls';

const BLUE = '#1A5FA8';
const GOLD = '#C8922A';

// Cross-page banner: surfaces open polls the current member has not
// voted on yet. Mounted in AppShell so it appears above every page.
// The list itself is the single source of truth — no separate
// notifications table; visibility ends as soon as the member votes.
export function OpenPollAlert() {
  const { pendingForMe, loading } = usePolls();
  if (loading) return null;
  if (pendingForMe.length === 0) return null;

  const single = pendingForMe.length === 1;
  const target = single ? `/voting/${pendingForMe[0].id}` : '/voting';

  return (
    <div
      role="status"
      className="border-b"
      style={{
        background: `${GOLD}15`,
        borderColor: `${GOLD}55`,
      }}
    >
      <div className="px-10 py-2.5 flex items-center justify-between gap-4 max-w-5xl">
        <p className="text-sm text-gray-800">
          <span aria-hidden="true" className="mr-2">
            🗳️
          </span>
          {single
            ? 'A new poll is open and awaiting your vote: '
            : `You have ${pendingForMe.length} open polls awaiting your vote.`}
          {single && (
            <span className="font-medium" style={{ color: BLUE }}>
              {pendingForMe[0].title}
            </span>
          )}
        </p>
        <Link
          to={target}
          className="text-xs font-semibold whitespace-nowrap hover:underline"
          style={{ color: BLUE }}
        >
          {single ? 'Vote now →' : 'See polls →'}
        </Link>
      </div>
    </div>
  );
}
