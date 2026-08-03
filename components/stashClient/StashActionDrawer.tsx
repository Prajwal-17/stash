"use client";

import { getStashTitle } from "@/components/stashClient/helpers";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle
} from "@/components/ui/sheet";
import { useStashActions } from "@/hooks/useStashActions";
import { useStashQueries } from "@/hooks/useStashQueries";
import { getTagLabel } from "@/lib/stash-client";
import { formatRelativeDate, getHostname } from "@/lib/link-utils";
import { useStashStore } from "@/store/stashStore";
import { LuArchive, LuCheck, LuCopy, LuPencil, LuTrash2 } from "react-icons/lu";

export function StashActionDrawer() {
  const drawerStash = useStashStore((s) => s.drawerStash);
  const setDrawerStash = useStashStore((s) => s.setDrawerStash);
  const copiedStashId = useStashStore((s) => s.copiedStashId);

  const {
    copyText,
    handleStashArchiveAction,
    isSetStashArchivedPending,
    openStashEditor,
    openDeleteConfirmation
  } = useStashActions();
  const { tags } = useStashQueries();

  const isOpen = drawerStash !== null;
  const title = drawerStash ? getStashTitle(drawerStash) : "Stash";
  const hostname = drawerStash ? getHostname(drawerStash.url) : "";
  const tag = drawerStash ? tags.find((t) => t.id === drawerStash.tagId) : null;

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setDrawerStash(null);
      }}
    >
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

        {drawerStash ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                URL
              </p>
              <p className="text-foreground/80 font-mono text-xs leading-relaxed break-all">
                {drawerStash.url}
              </p>
            </div>

            <div className="border-border/50 grid grid-cols-2 gap-3 border-t pt-3">
              {tag ? (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Tag
                  </p>
                  <p className="text-foreground/80 text-xs wrap-break-word">{getTagLabel(tag)}</p>
                </div>
              ) : null}
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Added
                </p>
                <p className="text-foreground/80 text-xs">
                  {formatRelativeDate(drawerStash.createdAt)}
                </p>
              </div>
              {drawerStash.updatedAt !== drawerStash.createdAt ? (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                    Updated
                  </p>
                  <p className="text-foreground/80 text-xs">
                    {formatRelativeDate(drawerStash.updatedAt)}
                  </p>
                </div>
              ) : null}
            </div>

            {drawerStash.description?.trim() ? (
              <div className="border-border/50 space-y-1 border-t pt-3">
                <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  Description
                </p>
                <p className="text-foreground/70 text-xs leading-relaxed">
                  {drawerStash.description.trim()}
                </p>
              </div>
            ) : null}

            <div className="border-border/50 grid grid-cols-2 gap-2 border-t pt-4">
              <button
                type="button"
                aria-label={copiedStashId === drawerStash.id ? "Copied" : "Copy URL"}
                className="bg-muted text-foreground focus-visible:ring-ring/50 flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-2 text-xs font-medium focus-visible:ring-2 focus-visible:outline-none"
                onClick={() => void copyText(drawerStash.url, drawerStash.id)}
              >
                {copiedStashId === drawerStash.id ? (
                  <LuCheck size={14} className="text-emerald-400" />
                ) : (
                  <LuCopy size={14} />
                )}
                {copiedStashId === drawerStash.id ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                aria-label="Edit stash"
                className="bg-muted text-foreground focus-visible:ring-ring/50 flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-2 text-xs font-medium focus-visible:ring-2 focus-visible:outline-none"
                onClick={() => openStashEditor(drawerStash)}
              >
                <LuPencil size={14} />
                Edit
              </button>
              <button
                type="button"
                aria-label="Archive stash"
                disabled={isSetStashArchivedPending}
                className="bg-muted text-foreground focus-visible:ring-ring/50 flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-2 text-xs font-medium focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
                onClick={() => void handleStashArchiveAction(drawerStash.id, "archive")}
              >
                <LuArchive size={14} />
                Archive
              </button>
              <button
                type="button"
                aria-label="Delete stash"
                className="flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-red-500/10 px-2 text-xs font-medium text-red-300 focus-visible:ring-2 focus-visible:ring-red-400/50 focus-visible:outline-none"
                onClick={() =>
                  openDeleteConfirmation({
                    kind: "stash",
                    id: drawerStash.id,
                    title: "Remove stash?",
                    description: "This removes the link from your stash permanently.",
                    confirmLabel: "Remove stash"
                  })
                }
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
