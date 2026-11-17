import { redirect } from "next/navigation";
import { adminExists } from "@/lib/auth/users";
import SetupForm from "@/components/setup/setup-form";

export const instant = false;

export default function SetupPage() {
  if (adminExists()) redirect("/");
  return (
    <main className="min-h-screen bg-bg flex items-center justify-center p-6">
      <SetupForm />
    </main>
  );
}
