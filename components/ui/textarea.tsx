"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        data-slot="textarea"
        className={cn(
          "border-border bg-background text-foreground flex min-h-20 w-full min-w-0 rounded-md border px-3 py-1.5 text-base leading-relaxed transition-[border-color,box-shadow] sm:text-sm",
          "placeholder:text-muted-foreground/70",
          "focus-visible:ring-ring/30 focus-visible:border-ring aria-invalid:border-destructive aria-invalid:ring-destructive/20 focus-visible:ring-1 focus-visible:outline-none",
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
