"use client";

import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="bg-background text-foreground flex min-h-dvh items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-border bg-white/3 p-8 shadow-2xl shadow-black/30">
        <p className="text-sm text-muted-foreground">Something broke in Stash.</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          The page failed to load.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {error.message || "Unknown error"}
        </p>
        <Button className="mt-6" onClick={reset}>
          Retry
        </Button>
      </div>
    </main>
  );
}
