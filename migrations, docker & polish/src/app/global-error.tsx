"use client";

import { useEffect } from "react";

/**
 * Catches errors thrown while rendering the root layout itself (where the
 * regular error.tsx boundary cannot help, since it lives inside the root
 * layout). Must render its own <html>/<body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled root layout error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center text-slate-900 antialiased">
        <p className="text-sm font-semibold uppercase tracking-wide text-rose-600">500</p>
        <h1 className="mt-2 text-3xl font-semibold">Application error</h1>
        <p className="mt-3 max-w-md text-sm text-slate-600">
          A critical error prevented the application from loading. Please try again.
        </p>
        {error.digest && <p className="mt-2 text-xs text-slate-400">Reference: {error.digest}</p>}
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
