import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">404</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">Page not found</h1>
      <p className="mt-3 max-w-md text-sm text-slate-600">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved. Check the URL or head back to the
        settings dashboard.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Return home
      </Link>
    </div>
  );
}
