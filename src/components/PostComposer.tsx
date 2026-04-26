import { useState, type FormEvent } from 'react';

const BLUE = '#1A5FA8';

// Bottom-of-thread composer for a new top-level post. Adapted from
// mercaz-react/src/components/MessageComposer.tsx with the photo
// upload stripped per Phase 6 spec.
export function PostComposer({
  onSubmit,
  onError,
  disabled = false,
  placeholder = 'Start a new post in this thread…',
}: {
  onSubmit: (body: string) => Promise<{ error: string | null }>;
  onError?: (msg: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    setSubmitting(true);
    try {
      const { error } = await onSubmit(text.trim());
      if (error) {
        onError?.(error);
        return;
      }
      setText('');
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled = disabled || submitting;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-xl flex items-end gap-2 p-2"
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        disabled={isDisabled}
        rows={1}
        className="flex-1 rounded-2xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1A5FA8] focus:ring-2 focus:ring-[#1A5FA8]/25 disabled:bg-gray-50 disabled:text-gray-500 resize-none max-h-40 transition-colors"
        onInput={(e) => {
          const el = e.currentTarget;
          el.style.height = 'auto';
          el.style.height = Math.min(el.scrollHeight, 160) + 'px';
        }}
      />
      <button
        type="submit"
        disabled={isDisabled || !text.trim()}
        className="shrink-0 h-10 px-4 rounded-full text-white text-sm font-semibold disabled:opacity-50 hover:opacity-95 transition-opacity"
        style={{ background: BLUE }}
      >
        {submitting ? '…' : 'Post'}
      </button>
    </form>
  );
}
