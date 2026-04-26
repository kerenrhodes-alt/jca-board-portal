import { useState, type FormEvent } from 'react';

const BLUE = '#1A5FA8';

// Compact inline composer for a reply to a top-level post. Adapted
// from mercaz-react/src/components/ReplyComposer.tsx — text-only
// (matches the rest of Board Portal's text-first Phase 6 spec).
export function ReplyComposer({
  onSubmit,
  onCancel,
}: {
  onSubmit: (body: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(text.trim());
      setText('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="ml-8 mt-2 flex items-end gap-2">
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a reply…"
        rows={1}
        className="flex-1 rounded-2xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1A5FA8] focus:ring-2 focus:ring-[#1A5FA8]/25 resize-none max-h-32 transition-colors"
        onInput={(e) => {
          const el = e.currentTarget;
          el.style.height = 'auto';
          el.style.height = Math.min(el.scrollHeight, 128) + 'px';
        }}
      />
      <button
        type="submit"
        disabled={submitting || !text.trim()}
        className="shrink-0 h-9 px-3 rounded-full text-white text-sm font-semibold disabled:opacity-50 hover:opacity-95 transition-opacity"
        style={{ background: BLUE }}
      >
        {submitting ? '…' : 'Reply'}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="shrink-0 h-9 px-3 rounded-full bg-white text-gray-700 text-sm border border-gray-300 hover:bg-gray-50 transition-colors"
      >
        Cancel
      </button>
    </form>
  );
}
