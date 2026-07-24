"use client";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle
} from "@/components/ui/sheet";
import { ReadingListItem } from "@/lib/stash-client";
import { formatRelativeDate, getHostname } from "@/lib/link-utils";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { LuCheck, LuCopy, LuPencil, LuTrash2 } from "react-icons/lu";

interface ReadingListActionDrawerProps {
  item: ReadingListItem | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (item: ReadingListItem) => void;
  onDelete: (item: ReadingListItem) => void;
}

export function ReadingListActionDrawer({
  item,
  onOpenChange,
  onEdit,
  onDelete
}: ReadingListActionDrawerProps) {
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const hostname = item ? item.hostname || getHostname(item.url) : "";
  const title = item ? item.title?.trim() || hostname : "Reading item";

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  async function copyUrl() {
    if (!item) return;

    try {
      await navigator.clipboard.writeText(item.url);
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
      setCopiedItemId(item.id);
      copyTimerRef.current = window.setTimeout(() => setCopiedItemId(null), 1200);
    } catch {
      toast.error("Clipboard write failed");
    }
  }

  return (
    <Sheet open={item !== null} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="border-border bg-card max-h-[88dvh] w-full max-w-full overflow-y-auto overscroll-contain rounded-t-[28px] border-t px-4 pt-1 pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-[0_-18px_60px_rgba(0,0,0,0.4)] outline-none sm:px-5"
      >
        <SheetClose asChild>
          <button
            type="button"
            aria-label="Close drawer"
            className="focus-visible:ring-ring/50 mx-auto mb-2 flex h-8 w-16 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:outline-none"
          >
            <span className="h-1.5 w-12 rounded-full bg-neutral-700" />
          </button>
        </SheetClose>

        <div className="mb-5">
          <SheetTitle className="text-foreground pr-2 text-base leading-tight font-semibold wrap-break-word">
            {title}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground mt-1 truncate text-xs">
            {hostname}
          </SheetDescription>
        </div>

        {item ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                URL
              </p>
              <p className="text-foreground/80 font-mono text-xs leading-relaxed break-all">
                {item.url}
              </p>
            </div>

            <div className="border-border/50 grid grid-cols-2 gap-3 border-t pt-3">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Status
                </p>
                <p className="text-foreground/80 text-xs">
                  {item.isRead
                    ? "Completed"
                    : item.scheduledFor
                      ? `Scheduled ${format(new Date(item.scheduledFor), "MMM d")}`
                      : "In list"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Added
                </p>
                <p className="text-foreground/80 text-xs">{formatRelativeDate(item.createdAt)}</p>
              </div>
            </div>

            {item.description?.trim() ? (
              <div className="border-border/50 space-y-1 border-t pt-3">
                <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Description
                </p>
                <p className="text-foreground/70 text-xs leading-relaxed wrap-break-word">
                  {item.description.trim()}
                </p>
              </div>
            ) : null}

            <div className="border-border/50 flex items-center gap-2 border-t pt-4">
              <button
                type="button"
                aria-label={copiedItemId === item.id ? "Copied" : "Copy URL"}
                className="bg-muted text-foreground focus-visible:ring-ring/50 flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-2 text-xs font-medium focus-visible:ring-2 focus-visible:outline-none"
                onClick={() => void copyUrl()}
              >
                {copiedItemId === item.id ? (
                  <LuCheck size={14} className="text-emerald-400" />
                ) : (
                  <LuCopy size={14} />
                )}
                {copiedItemId === item.id ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                aria-label="Edit reading item"
                className="bg-muted text-foreground focus-visible:ring-ring/50 flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-2 text-xs font-medium focus-visible:ring-2 focus-visible:outline-none"
                onClick={() => onEdit(item)}
              >
                <LuPencil size={14} />
                Edit
              </button>
              <button
                type="button"
                aria-label="Delete reading item"
                className="flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-red-500/10 px-2 text-xs font-medium text-red-300 focus-visible:ring-2 focus-visible:ring-red-400/50 focus-visible:outline-none"
                onClick={() => onDelete(item)}
              >
                <LuTrash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
