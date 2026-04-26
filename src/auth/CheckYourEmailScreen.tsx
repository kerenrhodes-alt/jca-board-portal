const BLUE = '#1A5FA8';
const GOLD = '#C8922A';
const PAGE_BG = '#F5F8FC';

export function CheckYourEmailScreen({
  email,
  onBack,
}: {
  email: string;
  onBack: () => void;
}) {
  return (
    <div
      style={{ background: PAGE_BG }}
      className="min-h-screen flex items-center justify-center px-4 py-10 font-sans"
    >
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-lg px-8 py-10 text-center">
        <p
          className="font-serif text-xs uppercase tracking-[0.18em]"
          style={{ color: GOLD }}
        >
          Jewish Community of Amherst
        </p>
        <h1 className="font-serif text-3xl font-bold mt-3" style={{ color: BLUE }}>
          Check your email
        </h1>
        <p className="mt-4 text-sm text-gray-700 leading-relaxed">
          We sent a sign-in link to
          <br />
          <span className="font-medium" style={{ color: BLUE }}>
            {email}
          </span>
        </p>
        <p className="mt-3 text-xs text-gray-500">
          The link will sign you in instantly. It expires in 1 hour.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-6 text-sm underline"
          style={{ color: BLUE }}
        >
          Use a different email
        </button>
      </div>
    </div>
  );
}
