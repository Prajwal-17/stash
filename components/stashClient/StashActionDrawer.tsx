"use client";

import { getStashTitle } from "@/components/stashClient/helpers";
import { Button } from "@/components/ui/button";
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
        className="border-border bg-background mx-auto max-h-[88dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-xl px-5 pt-1 pb-[calc(env(safe-area-inset-bottom)+20px)] outline-none sm:px-6"
        onCloseAutoFocus={(event) => {
          const { stashEditor, confirmation } = useStashStore.getState();
          if (stashEditor || confirmation) event.preventDefault();
        }}
      >
        <SheetClose asChild>
          <button
            type="button"
            aria-label="Close drawer"
            className="focus-visible:ring-ring/50 mx-auto mb-2 flex h-7 w-16 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:outline-none"
          >
            <span className="bg-muted-foreground/40 h-1 w-10 rounded-full" />
          </button>
        </SheetClose>

        <div className="mb-4">
          <SheetTitle className="text-foreground pr-2 text-base leading-snug font-semibold wrap-anywhere">
            {title}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground mt-1 truncate text-sm">
            {hostname}
          </SheetDescription>
        </div>

        {drawerStash ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <p className="text-muted-foreground text-xs font-medium">URL</p>
              <p className="text-foreground/80 text-[13px] leading-relaxed break-all">
                {drawerStash.url}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              {tag ? (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-medium">Tag</p>
                  <p className="text-foreground text-sm wrap-anywhere">{getTagLabel(tag)}</p>
                </div>
              ) : null}
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-medium">Added</p>
                <p className="text-foreground text-sm wrap-anywhere">
                  {formatRelativeDate(drawerStash.createdAt)}
                </p>
              </div>
              {drawerStash.updatedAt !== drawerStash.createdAt ? (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-medium">Updated</p>
                  <p className="text-foreground text-sm wrap-anywhere">
                    {formatRelativeDate(drawerStash.updatedAt)}
                  </p>
                </div>
              ) : null}
            </div>

            {drawerStash.description?.trim() ? (
              <div className="space-y-1 pt-1">
                <p className="text-muted-foreground text-xs font-medium">Description</p>
                <p className="text-muted-foreground text-[13px] leading-relaxed wrap-anywhere">
                  {drawerStash.description.trim()}
                </p>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                aria-label={copiedStashId === drawerStash.id ? "Copied" : "Copy URL"}
                className="h-10 min-w-0 gap-2"
                onClick={() => void copyText(drawerStash.url, drawerStash.id)}
              >
                {copiedStashId === drawerStash.id ? (
                  <LuCheck size={16} className="text-primary" />
                ) : (
                  <LuCopy size={14} />
                )}
                {copiedStashId === drawerStash.id ? "Copied" : "Copy"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                aria-label="Edit stash"
                className="h-10 min-w-0 gap-2"
                onClick={() => openStashEditor(drawerStash)}
              >
                <LuPencil size={14} />
                Edit
              </Button>
              <Button
                type="button"
                variant="secondary"
                aria-label="Archive stash"
                disabled={isSetStashArchivedPending}
                className="h-10 min-w-0 gap-2"
                onClick={() => void handleStashArchiveAction(drawerStash.id, "archive")}
              >
                <LuArchive size={14} />
                Archive
              </Button>
              <Button
                type="button"
                variant="outline"
                aria-label="Delete stash"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive h-10 min-w-0 gap-2 border-transparent bg-transparent"
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
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
