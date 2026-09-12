"use client";

import { Button } from "@/components/ui/button";
import { useTransition } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const [isRetrying, startRetry] = useTransition();

  return (
    <main className="bg-background text-foreground flex min-h-dvh items-center justify-center px-4 py-8 sm:px-6">
      <div className="border-border bg-card w-full max-w-md rounded-xl border p-6 shadow-lg sm:p-8">
        <p className="text-muted-foreground text-sm">Something broke in Stash.</p>
        <h1 className="text-foreground mt-2 text-2xl font-semibold tracking-tight">
          The page failed to load.
        </h1>
        <p role="alert" className="text-muted-foreground mt-3 text-sm leading-6 wrap-break-word">
          {error.message || "Unknown error"}
        </p>
        <Button
          className="mt-6 min-h-11 w-full sm:w-auto"
          disabled={isRetrying}
          onClick={() => startRetry(reset)}
        >
          {isRetrying ? "Retrying..." : "Retry"}
        </Button>
      </div>
    </main>
  );
}
