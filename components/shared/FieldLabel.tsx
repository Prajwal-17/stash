import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export function FieldLabel({ children, className, ...props }: ComponentProps<"label">) {
  return (
    <label className={cn("text-foreground block text-sm font-medium", className)} {...props}>
      {children}
    </label>
  );
}
