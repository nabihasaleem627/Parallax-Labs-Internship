import Link from "next/link";
import { Brand } from "@/components/ui/logo";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-indigo-100/70 blur-3xl"
      />
      <Link href="/" className="relative mb-8">
        <Brand />
      </Link>
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {children}
      </div>
      <p className="relative mt-6 text-xs text-slate-400">
        © {new Date().getFullYear()} Bookflow
      </p>
    </div>
  );
}
