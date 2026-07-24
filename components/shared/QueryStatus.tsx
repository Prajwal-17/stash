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
        "min-w-0 rounded-lg px-3 py-2 text-sm wrap-break-word",
        compact ? "text-xs" : "text-sm",
        tone === "error" ? "bg-red-500/10 text-red-200" : "bg-muted text-muted-foreground"
      )}
    >
      {children}
    </div>
  );
}
