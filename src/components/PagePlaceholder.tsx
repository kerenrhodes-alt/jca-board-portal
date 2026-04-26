const BLUE = '#1A5FA8';

export function PagePlaceholder({ title }: { title: string }) {
  return (
    <div className="px-10 py-10 max-w-5xl">
      <h1 className="font-serif text-3xl font-bold" style={{ color: BLUE }}>
        {title}
      </h1>
      <p className="mt-3 text-sm text-gray-600">Coming soon.</p>
    </div>
  );
}
