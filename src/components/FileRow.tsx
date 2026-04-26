import type { DriveFile } from '../hooks/useDriveFolder';

export function FileRow({
  file,
  onClick,
}: {
  file: DriveFile;
  onClick: () => void;
}) {
  return (
    <a
      href={file.webViewLink}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className="group flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-gray-50 transition-colors"
    >
      {file.iconLink ? (
        <img src={file.iconLink} alt="" className="w-5 h-5 shrink-0" />
      ) : (
        <span aria-hidden="true" className="w-5 h-5 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-[#1A5FA8] transition-colors">
          {file.name}
        </p>
        <p className="text-xs text-gray-500 truncate">
          Modified {formatModified(file.modifiedTime)}
        </p>
      </div>
      <span
        aria-hidden="true"
        className="text-xs text-gray-400 group-hover:text-[#1A5FA8] whitespace-nowrap transition-colors"
      >
        Open ↗
      </span>
    </a>
  );
}

function formatModified(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
