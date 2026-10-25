import Link from "next/link";

export function NavHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            PL
          </span>
          <span>Parallax Settings</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-slate-600" aria-label="Primary">
          <Link
            href="/"
            className="rounded-md px-2 py-1 hover:text-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Settings
          </Link>
          <Link
            href="/status"
            className="rounded-md px-2 py-1 hover:text-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            System status
          </Link>
        </nav>
      </div>
    </header>
  );
}
