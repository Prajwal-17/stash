import { cn } from "@/lib/utils";
import * as React from "react";

export type KbdProps = React.HTMLAttributes<HTMLElement>;

const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className, ...props }, ref) => {
    return (
      <kbd
        ref={ref}
        className={cn(
          "bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[11px] font-medium opacity-100 select-none",
          className,
        )}
        {...props}
      />
    );
  },
);
Kbd.displayName = "Kbd";

export { Kbd };
