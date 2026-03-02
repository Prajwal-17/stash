import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/auth/login");
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-xl font-bold">Stash</h1>
        <LogoutButton />
      </header>
      <main className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Your bookmark manager</p>
      </main>
    </div>
  );
}
