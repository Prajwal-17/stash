"use client";

import {
  formatRelativeDate,
  getHostname,
  getStashTitle,
} from "@/components/stashClient/helpers";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useStashActions } from "@/hooks/useStashActions";
import { useStashQueries } from "@/hooks/useStashQueries";
import { getTagLabel } from "@/lib/stash-client";
import { useStashStore } from "@/store/stashStore";
import { LuCheck, LuCopy, LuPencil, LuTrash2 } from "react-icons/lu";

export function StashActionDrawer() {
  const drawerStash = useStashStore((s) => s.drawerStash);
  const setDrawerStash = useStashStore((s) => s.setDrawerStash);
  const copiedStashId = useStashStore((s) => s.copiedStashId);

  const { copyText, openStashEditor, openDeleteConfirmation } =
    useStashActions();
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
        className="border-border bg-card w-full rounded-t-[28px] border-t px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-[0_-18px_60px_rgba(0,0,0,0.4)]"
      >
        <SheetClose asChild>
          <button
            type="button"
            className="mx-auto mb-4 block h-1.5 w-12 rounded-full bg-neutral-700"
          />
        </SheetClose>

        {/* Header */}
        <div className="mb-5">
          <SheetTitle className="text-foreground text-base leading-tight font-semibold">
            {title}
          </SheetTitle>
          <SheetDescription
            id="drawer-stash-desc"
            className="text-muted-foreground mt-1 text-xs"
          >
            {hostname}
          </SheetDescription>
        </div>

        {drawerStash ? (
          <div className="space-y-4">
            {/* Full URL */}
            <div className="space-y-1.5">
              <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.15em] uppercase">
                URL
              </p>
              <p className="text-foreground/80 font-mono text-xs leading-relaxed break-all">
                {drawerStash.url}
              </p>
            </div>

            {/* Metadata row */}
            <div className="border-border/50 grid grid-cols-2 gap-3 border-t pt-3">
              {tag ? (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.15em] uppercase">
                    Tag
                  </p>
                  <p className="text-foreground/80 text-xs">
                    {getTagLabel(tag)}
                  </p>
                </div>
              ) : null}
              <div className="space-y-1">
                <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.15em] uppercase">
                  Added
                </p>
                <p className="text-foreground/80 text-xs">
                  {formatRelativeDate(drawerStash.createdAt)}
                </p>
              </div>
              {drawerStash.updatedAt !== drawerStash.createdAt ? (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.15em] uppercase">
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
                <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.15em] uppercase">
                  Description
                </p>
                <p className="text-foreground/70 text-xs leading-relaxed">
                  {drawerStash.description.trim()}
                </p>
              </div>
            ) : null}

            {/* Actions */}
            <div className="border-border/50 flex items-center gap-2 border-t pt-4">
              <button
                type="button"
                className="bg-muted text-foreground flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium"
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
                className="bg-muted text-foreground flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-medium"
                onClick={() => openStashEditor(drawerStash)}
              >
                <LuPencil size={14} />
                Edit
              </button>
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-500/10 px-3 py-2.5 text-xs font-medium text-red-300"
                onClick={() =>
                  openDeleteConfirmation({
                    kind: "stash",
                    id: drawerStash.id,
                    title: "Remove stash?",
                    description:
                      "This removes the link from your stash permanently.",
                    confirmLabel: "Remove stash",
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
