import { useAuth } from '../auth/AuthProvider';
import { recordDocumentView } from '../lib/recordView';

const BLUE = '#1A5FA8';

// Renders the Drive document attached to a thread. v1 does not fetch
// the file's metadata (we don't have a file-by-id endpoint yet), so
// the link is generic — Drive renders the right preview when opened.
// View tracking still fires on click, consistent with the Documents
// page.
export function ThreadAttachment({ driveFileId }: { driveFileId: string }) {
  const { member } = useAuth();
  const href = `https://drive.google.com/file/d/${driveFileId}/view`;

  const onClick = () => {
    if (member) recordDocumentView(driveFileId, member.id);
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 hover:border-[#1A5FA8]/50 hover:bg-[#1A5FA8]/5 transition-colors"
    >
      <span aria-hidden="true" className="text-xl">
        📎
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs uppercase tracking-wider text-gray-500">
          Attached document
        </p>
        <p
          className="text-sm font-medium group-hover:underline truncate"
          style={{ color: BLUE }}
        >
          View in Drive
        </p>
      </div>
      <span aria-hidden="true" className="text-xs text-gray-400 group-hover:text-[#1A5FA8] whitespace-nowrap transition-colors">
        Open ↗
      </span>
    </a>
  );
}
