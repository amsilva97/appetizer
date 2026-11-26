import { redirect } from "next/navigation";
import { connection } from "next/server";
import { adminExists } from "@/lib/auth/users";
import SetupForm from "@/components/setup/setup-form";

export const instant = false;

export default async function SetupPage() {
  // Check on every request: at build time there is no data, so a prerendered
  // page would always show the form.
  await connection();
  if (adminExists()) redirect("/");
  return (
    <main className="min-h-screen bg-bg flex items-center justify-center p-6">
      <SetupForm />
    </main>
  );
}
