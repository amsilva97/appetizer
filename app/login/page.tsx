import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import LoginForm from "@/components/auth/login-form";

export const instant = false;

export default async function LoginPage() {
  const session = await getSession();
  if (session.loggedIn) redirect("/");
  return (
    <main className="min-h-screen bg-bg flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-brand/[0.06] blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-brand-alt/[0.04] blur-3xl" />
      </div>
      <LoginForm />
    </main>
  );
}
