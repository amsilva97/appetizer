import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import LoginForm from "@/components/auth/login-form";

export const instant = false;

export default async function LoginPage() {
  const session = await getSession();
  if (session.loggedIn) redirect("/");
  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <LoginForm />
    </main>
  );
}
