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
        "min-w-0 leading-relaxed wrap-break-word",
        compact ? "px-2 py-1 text-xs" : "px-2 py-3 text-sm",
        tone === "error" ? "text-destructive" : "text-muted-foreground"
      )}
    >
      {children}
    </div>
  );
}
