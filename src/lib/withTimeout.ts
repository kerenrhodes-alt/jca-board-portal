// Race a promise (or any PromiseLike — supabase-js query builders are
// thenables, not real Promises) against a timeout. Used to put a hard
// upper bound on Supabase queries that occasionally hang on cold
// starts, so the UI fails over to an error state with a retry button
// instead of spinning forever.
//
// On timeout, rejects with an Error whose message includes the label
// and the duration so logs are searchable. Note: this does NOT cancel
// the underlying request — the wrapped operation may still resolve or
// reject later. Callers that act on the resolved value need to
// tolerate that (e.g. by guarding setState with an `active` flag).
export function withTimeout<T>(
  source: Promise<T> | PromiseLike<T>,
  ms: number,
  label = 'request',
): Promise<T> {
  // Normalize a thenable (e.g. a supabase query builder) to a real
  // Promise so .finally() / Promise.race work without TS friction.
  const promise: Promise<T> = Promise.resolve(source);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(label + ' timed out after ' + ms + 'ms')),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

// Default timeout for in-app Supabase queries. 5s is enough for the
// slowest paths in normal use; longer than that is more likely a
// stalled request than a slow one.
export const DEFAULT_FETCH_TIMEOUT_MS = 5000;
