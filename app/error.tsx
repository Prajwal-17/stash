"use client";

import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="bg-background text-foreground flex min-h-dvh items-center justify-center px-6">
      <div className="border-border w-full max-w-md rounded-3xl border bg-white/3 p-8 shadow-2xl shadow-black/30">
        <p className="text-muted-foreground text-sm">Something broke in Stash.</p>
        <h1 className="text-foreground mt-2 text-2xl font-semibold tracking-tight">
          The page failed to load.
        </h1>
        <p className="text-muted-foreground mt-3 text-sm leading-6">
          {error.message || "Unknown error"}
        </p>
        <Button className="mt-6" onClick={reset}>
          Retry
        </Button>
      </div>
    </main>
  );
}
