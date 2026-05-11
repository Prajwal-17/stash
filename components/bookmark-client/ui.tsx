"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { ComponentProps, ReactNode } from "react";
import { LuX } from "react-icons/lu";

export function SurfaceButton({
  className,
  children,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      variant="outline"
      className={cn(
        "h-10 rounded-2xl border border-white/10 bg-white/4 text-neutral-200 shadow-none backdrop-blur hover:bg-white/8 hover:text-white",
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold tracking-[0.18em] text-neutral-500 uppercase">
      {children}
    </label>
  );
}

export function Modal({
  title,
  description,
  open,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[#111112] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.45)]"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">{title}</h2>
                {description ? (
                  <p className="mt-1 text-sm text-neutral-500">{description}</p>
                ) : null}
              </div>
              <button
                type="button"
                className="rounded-full border border-white/10 bg-white/4 p-2 text-neutral-500 transition hover:text-white"
                onClick={onClose}
              >
                <LuX size={16} />
              </button>
            </div>
            <div className="mt-5">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent
        side="bottom"
        className="w-full rounded-t-[28px] border-t border-white/10 bg-[#111112] px-5 pt-3 pb-7 shadow-[0_-18px_60px_rgba(0,0,0,0.4)]"
        {...(description ? {} : { "aria-describedby": undefined })}
      >
        <SheetClose asChild>
          <button
            type="button"
            aria-label="Close drawer"
            className="mx-auto mb-4 block h-1.5 w-12 rounded-full bg-neutral-700"
          />
        </SheetClose>
        <div className="mb-4">
          <SheetTitle className="text-base font-semibold text-white">
            {title}
          </SheetTitle>
          {description ? (
            <SheetDescription className="mt-1 text-sm text-neutral-500">
              {description}
            </SheetDescription>
          ) : null}
        </div>
        {children}
      </SheetContent>
    </Sheet>
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
        "rounded-2xl px-3 py-2 text-sm",
        compact ? "text-xs" : "text-sm",
        tone === "error"
          ? "bg-red-500/10 text-red-200"
          : "bg-white/4 text-neutral-400",
      )}
    >
      {children}
    </div>
  );
}
