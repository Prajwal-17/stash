"use client";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
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
  const transferringFocusRef = useRef(false);
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
        className="border-border bg-background mx-auto max-h-[88dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-2xl border-t px-5 pt-1 pb-[calc(env(safe-area-inset-bottom)+20px)] outline-none sm:px-6"
        onCloseAutoFocus={(event) => {
          if (transferringFocusRef.current) {
            event.preventDefault();
            transferringFocusRef.current = false;
          }
        }}
      >
        <SheetClose asChild>
          <button
            type="button"
            aria-label="Close drawer"
            className="focus-visible:ring-ring/50 mx-auto mb-2 flex h-10 w-16 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:outline-none"
          >
            <span className="bg-muted-foreground/40 h-1 w-10 rounded-full" />
          </button>
        </SheetClose>

        <div className="mb-5">
          <SheetTitle className="text-foreground pr-2 text-lg leading-snug font-semibold wrap-anywhere">
            {title}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground mt-1 truncate text-sm">
            {hostname}
          </SheetDescription>
        </div>

        {item ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-muted-foreground text-xs font-medium">URL</p>
              <p className="text-foreground/80 text-sm leading-relaxed break-all">{item.url}</p>
            </div>

            <div className="border-border grid grid-cols-2 gap-3 border-t pt-3">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-medium">Status</p>
                <p className="text-foreground text-sm wrap-anywhere">
                  {item.isRead
                    ? "Completed"
                    : item.scheduledFor
                      ? `Scheduled ${format(new Date(item.scheduledFor), "MMM d")}`
                      : "In list"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-medium">Added</p>
                <p className="text-foreground text-sm wrap-anywhere">
                  {formatRelativeDate(item.createdAt)}
                </p>
              </div>
            </div>

            {item.description?.trim() ? (
              <div className="border-border space-y-1 border-t pt-3">
                <p className="text-muted-foreground text-xs font-medium">Description</p>
                <p className="text-muted-foreground text-sm leading-relaxed wrap-anywhere">
                  {item.description.trim()}
                </p>
              </div>
            ) : null}

            <div className="border-border grid grid-cols-3 gap-2 border-t pt-4">
              <Button
                type="button"
                variant="secondary"
                aria-label={copiedItemId === item.id ? "Copied" : "Copy URL"}
                className="h-11 min-w-0 gap-2 px-2"
                onClick={() => void copyUrl()}
              >
                {copiedItemId === item.id ? (
                  <LuCheck size={14} className="text-primary" />
                ) : (
                  <LuCopy size={14} />
                )}
                {copiedItemId === item.id ? "Copied" : "Copy"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                aria-label="Edit reading item"
                className="h-11 min-w-0 gap-2 px-2"
                onClick={() => {
                  transferringFocusRef.current = true;
                  onEdit(item);
                }}
              >
                <LuPencil size={14} />
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                aria-label="Delete reading item"
                className="border-destructive/25 bg-destructive/10 text-destructive hover:bg-destructive/10 hover:text-destructive h-11 min-w-0 gap-2 px-2"
                onClick={() => {
                  transferringFocusRef.current = true;
                  onDelete(item);
                }}
              >
                <LuTrash2 size={14} />
                Delete
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
