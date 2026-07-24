import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export function FieldLabel({ children, className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "text-muted-foreground block text-xs font-semibold tracking-wider uppercase",
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}
