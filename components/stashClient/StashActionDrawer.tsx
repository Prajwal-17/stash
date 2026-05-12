"use client";

import { getHostname, getUrlPath } from "@/components/stashClient/helpers";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useStashActions } from "@/hooks/useStashActions";
import { useStashStore } from "@/store/stashStore";
import {
  LuCheck,
  LuCopy,
  LuExternalLink,
  LuLink2,
  LuPencil,
  LuTag,
  LuTrash2,
} from "react-icons/lu";

export function StashActionDrawer() {
  const drawerStash = useStashStore((s) => s.drawerStash);
  const setDrawerStash = useStashStore((s) => s.setDrawerStash);
  const copiedStashId = useStashStore((s) => s.copiedStashId);

  const { copyText, openStashEditor, openDeleteConfirmation } =
    useStashActions();

  const isOpen = drawerStash !== null;

  const title = drawerStash ? getHostname(drawerStash.url) : "Stash";

  const description = drawerStash
    ? drawerStash.title?.trim() &&
      drawerStash.title.trim() !== getHostname(drawerStash.url)
      ? drawerStash.title.trim()
      : undefined
    : undefined;

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setDrawerStash(null);
      }}
    >
      <SheetContent
        side="bottom"
        className="border-border bg-card w-full rounded-t-[28px] border-t px-5 pt-3 pb-7 shadow-[0_-18px_60px_rgba(0,0,0,0.4)]"
        {...(description ? {} : { "aria-describedby": undefined })}
      >
        <SheetClose asChild>
          <button
            type="button"
            className="mx-auto mb-4 block h-1.5 w-12 rounded-full bg-neutral-700"
          />
        </SheetClose>
        <div className="mb-4">
          <SheetTitle className="text-foreground text-base font-semibold">
            {title}
          </SheetTitle>
          {description ? (
            <SheetDescription className="text-muted-foreground mt-1 text-sm">
              {description}
            </SheetDescription>
          ) : null}
        </div>

        {drawerStash ? (
          <div className="space-y-2">
            <div className="border-border bg-muted rounded-lg border px-4 py-3">
              <p className="text-foreground text-sm break-all">
                {getUrlPath(drawerStash.url)}
              </p>
            </div>
            <button
              type="button"
              className="bg-accent flex w-full items-center justify-between rounded-lg px-4 py-4 text-left text-sm"
              onClick={() => void copyText(drawerStash.url, drawerStash.id)}
            >
              <span className="flex items-center gap-3">
                <LuCopy size={18} className="text-muted-foreground" />
                Copy link
              </span>
              {copiedStashId === drawerStash.id ? (
                <LuCheck size={16} className="text-emerald-600" />
              ) : null}
            </button>
            <a
              href={drawerStash.url}
              target="_blank"
              rel="noreferrer"
              className="bg-accent flex w-full items-center justify-between rounded-lg px-4 py-4 text-sm"
            >
              <span className="flex items-center gap-3">
                <LuExternalLink size={18} className="text-muted-foreground" />
                Open link
              </span>
              <LuLink2 size={16} className="text-muted-foreground" />
            </a>
            <button
              type="button"
              className="bg-accent flex w-full items-center justify-between rounded-lg px-4 py-4 text-left text-sm"
              onClick={() => openStashEditor(drawerStash)}
            >
              <span className="flex items-center gap-3">
                <LuPencil size={18} className="text-muted-foreground" />
                Edit stash
              </span>
              <LuTag size={16} className="text-muted-foreground" />
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-lg bg-red-500/10 px-4 py-4 text-left text-sm text-red-300"
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
              <span className="flex items-center gap-3">
                <LuTrash2 size={18} className="text-red-400" />
                Remove stash
              </span>
            </button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
