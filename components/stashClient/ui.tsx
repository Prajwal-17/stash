"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="text-muted-foreground block text-[11px] font-semibold tracking-[0.18em] uppercase">
      {children}
    </label>
  );
}

export function QueryStatus({
  children,
  tone = "muted",
  compact = false,
}: {
  children: ReactNode;
  tone?: "muted" | "error";
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg px-3 py-2 text-sm",
        compact ? "text-xs" : "text-sm",
        tone === "error"
          ? "bg-red-500/10 text-red-200"
          : "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </div>
  );
}
