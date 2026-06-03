"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "border-input/40 bg-muted/15 text-foreground flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm transition-colors",
          "placeholder:text-muted-foreground/50",
          "focus-visible:ring-ring/20 focus-visible:border-ring/50 focus-visible:ring-2 focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
