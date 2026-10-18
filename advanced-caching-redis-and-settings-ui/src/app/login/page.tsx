import { redirect } from "next/navigation";
import { getCurrentAuth } from "@/lib/auth";
import { AuthForm } from "@/components/auth-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const auth = await getCurrentAuth();
  if (auth) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <AuthForm mode="login" />
    </main>
  );
}
