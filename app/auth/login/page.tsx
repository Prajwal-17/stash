import { LoginForm } from "@/components/login-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (!error && data.user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#141414] px-6 py-12">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  );
}
