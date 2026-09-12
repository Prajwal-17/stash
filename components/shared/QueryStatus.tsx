import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface QueryStatusProps {
  children: ReactNode;
  tone?: "muted" | "error";
  compact?: boolean;
}

export function QueryStatus({ children, tone = "muted", compact = false }: QueryStatusProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      className={cn(
        "min-w-0 rounded-lg border leading-relaxed wrap-break-word",
        compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm",
        tone === "error"
          ? "border-destructive/20 bg-destructive/10 text-destructive"
          : "border-border bg-card text-muted-foreground"
      )}
    >
      {children}
    </div>
  );
}
