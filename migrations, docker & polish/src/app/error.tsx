"use client";

import { useEffect } from "react";

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log client-side for debugging without exposing internals to the user.
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-rose-600">500</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">Something went wrong</h1>
      <p className="mt-3 max-w-md text-sm text-slate-600">
        An unexpected error occurred while rendering this page. This has been logged. You can try again, or head back
        to the home page.
      </p>
      {error.digest && <p className="mt-2 text-xs text-slate-400">Reference: {error.digest}</p>}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Try again
        </button>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Return home
        </a>
      </div>
    </div>
  );
}
