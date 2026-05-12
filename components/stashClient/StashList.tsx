"use client";

import {
  formatRelativeDate,
  getFaviconUrl,
  getHostname,
  getStashTitle,
} from "@/components/stashClient/helpers";
import { QueryStatus } from "@/components/stashClient/ui";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStashActions } from "@/hooks/useStashActions";
import { useStashQueries } from "@/hooks/useStashQueries";
import { Stash, getDefaultTagId, getTagLabel } from "@/lib/stash-client";
import { cn } from "@/lib/utils";
import { useStashStore } from "@/store/stashStore";
import { motion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  LuCheck,
  LuCopy,
  LuInfo,
  LuLoaderCircle,
  LuPencil,
  LuRefreshCw,
  LuTrash2,
} from "react-icons/lu";

export function StashList() {
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const listRef = useRef<HTMLUListElement>(null);

  const activeTagId = useStashStore((s) => s.activeTagId);
  const copiedStashId = useStashStore((s) => s.copiedStashId);
  const setDrawerStash = useStashStore((s) => s.setDrawerStash);
  const setTagEditor = useStashStore((s) => s.setTagEditor);
  const focusedStashIndex = useStashStore((s) => s.focusedStashIndex);
  const setFocusedStashIndex = useStashStore((s) => s.setFocusedStashIndex);
  const previewStash = useStashStore((s) => s.previewStash);
  const setPreviewStash = useStashStore((s) => s.setPreviewStash);

  const { tagsQuery, stashesQuery, tags, stashes } = useStashQueries();
  const { copyText, openStashEditor, openDeleteConfirmation } =
    useStashActions();

  const resolvedActiveTagId =
    activeTagId && tags.some((tag) => tag.id === activeTagId)
      ? activeTagId
      : getDefaultTagId(tags);

  const visibleStashes = useMemo(() => {
    const filtered = resolvedActiveTagId
      ? stashes.filter((stash) => stash.tagId === resolvedActiveTagId)
      : stashes;

    return filtered
      .slice()
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      );
  }, [stashes, resolvedActiveTagId]);

  const showTagLoadState = tagsQuery.isPending && !tags.length;
  const showStashLoadState = stashesQuery.isPending && !stashes.length;
  const showTagErrorState = tagsQuery.isError && !tags.length;

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Reset focused index when visible stashes change
  useEffect(() => {
    setFocusedStashIndex(-1);
  }, [resolvedActiveTagId, setFocusedStashIndex]);

  const scrollToIndex = useCallback((index: number) => {
    const list = listRef.current;
    if (!list) return;
    const items = list.querySelectorAll("[data-stash-row]");
    const item = items[index] as HTMLElement | undefined;
    if (item) {
      item.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, []);

  // --- Keyboard navigation (desktop) ---
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't capture when typing in inputs/textareas or when a dialog is open
      if (
        e.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA"].includes(e.target.tagName)
      ) {
        return;
      }

      const len = visibleStashes.length;
      if (!len) return;

      const currentIndex = focusedStashIndex;

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        const next = currentIndex < len - 1 ? currentIndex + 1 : 0;
        setFocusedStashIndex(next);
        scrollToIndex(next);
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        const prev = currentIndex > 0 ? currentIndex - 1 : len - 1;
        setFocusedStashIndex(prev);
        scrollToIndex(prev);
      } else if (e.key === "Enter" && currentIndex >= 0) {
        e.preventDefault();
        const stash = visibleStashes[currentIndex];
        if (stash) {
          window.open(stash.url, "_blank", "noopener,noreferrer");
        }
      } else if (e.key === " " && currentIndex >= 0) {
        e.preventDefault();
        const stash = visibleStashes[currentIndex];
        if (stash) {
          setPreviewStash(previewStash?.id === stash.id ? null : stash);
        }
      } else if (e.key === "Escape") {
        if (previewStash) {
          setPreviewStash(null);
        } else {
          setFocusedStashIndex(-1);
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    visibleStashes,
    focusedStashIndex,
    setFocusedStashIndex,
    previewStash,
    setPreviewStash,
    scrollToIndex,
  ]);

  const queueLongPress = useCallback(
    (stash: Stash) => {
      if (window.innerWidth >= 640) return;
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
      }
      longPressTriggeredRef.current = false;
      longPressTimerRef.current = window.setTimeout(() => {
        longPressTriggeredRef.current = true;
        setDrawerStash(stash);
      }, 480);
    },
    [setDrawerStash],
  );

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  function handleRowOpen(stash: Stash) {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    window.open(stash.url, "_blank", "noopener,noreferrer");
  }

  return (
    <main className="flex-1 overflow-y-auto px-3 sm:px-5">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-4 space-y-3">
          {tagsQuery.isError ? (
            <QueryStatus tone="error">
              <div className="flex items-center justify-between gap-3">
                <span>
                  {tags.length
                    ? "Could not refresh tags."
                    : "Could not load tags."}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  className="hover:text-foreground h-8 px-2 text-red-100 hover:bg-red-500/10"
                  onClick={() => void tagsQuery.refetch()}
                >
                  Retry
                </Button>
              </div>
            </QueryStatus>
          ) : null}

          {!showTagLoadState && !showTagErrorState && !tags.length ? (
            <QueryStatus>
              <div className="flex items-center justify-between gap-3">
                <span>No tags yet. Create one with the `+` button.</span>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-foreground hover:bg-accent hover:text-foreground h-8 px-2"
                  onClick={() => setTagEditor({ mode: "create", name: "" })}
                >
                  New tag
                </Button>
              </div>
            </QueryStatus>
          ) : null}

          {tagsQuery.isFetching && !showTagLoadState ? (
            <QueryStatus compact>
              <span className="inline-flex items-center gap-2">
                <LuRefreshCw size={12} className="animate-spin" />
                Syncing tags...
              </span>
            </QueryStatus>
          ) : null}
        </div>

        {stashesQuery.isError ? (
          <QueryStatus tone="error">
            <div className="flex items-center justify-between gap-3">
              <span>
                {stashes.length
                  ? "Could not refresh stashes."
                  : "Could not load stashes."}
              </span>
              <Button
                type="button"
                variant="ghost"
                className="hover:text-foreground h-8 px-2 text-red-100 hover:bg-red-500/10"
                onClick={() => void stashesQuery.refetch()}
              >
                Retry
              </Button>
            </div>
          </QueryStatus>
        ) : showStashLoadState ? (
          <QueryStatus>
            <span className="inline-flex items-center gap-2">
              <LuLoaderCircle size={14} className="animate-spin" />
              Loading stashes...
            </span>
          </QueryStatus>
        ) : !visibleStashes.length ? (
          <QueryStatus>
            {resolvedActiveTagId
              ? "No stashes in this tag yet."
              : "No stashes here yet."}
          </QueryStatus>
        ) : (
          <>
            {/* Column header + shortcuts bar (desktop) / Assist text (mobile) */}
            <div className="border-border/40 mb-1 flex items-center justify-center border-b px-2 pb-2 sm:justify-between">
              <span className="text-muted-foreground hidden text-[10px] font-semibold tracking-[0.15em] uppercase sm:block">
                Title
              </span>

              {/* Mobile assist */}
              <span className="text-muted-foreground/60 text-[10px] sm:hidden">
                Hold on a link to view details
              </span>

              <div className="hidden items-center gap-1.5 sm:flex">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                <span className="text-muted-foreground/50 text-[10px]">
                  navigate
                </span>
                <span className="text-muted-foreground/30 mx-0.5">·</span>
                <Kbd>Space</Kbd>
                <span className="text-muted-foreground/50 text-[10px]">
                  preview
                </span>
                <span className="text-muted-foreground/30 mx-0.5">·</span>
                <Kbd>↵</Kbd>
                <span className="text-muted-foreground/50 text-[10px]">
                  open
                </span>
              </div>
            </div>

            <ul ref={listRef} className="divide-y divide-white/5">
              {visibleStashes.map((stash, index) => {
                const hostname = stash.hostname || getHostname(stash.url);
                const title = getStashTitle(stash);
                const isFocused = index === focusedStashIndex;
                const isPreviewOpen = previewStash?.id === stash.id;

                return (
                  <motion.li
                    key={stash.id}
                    layout
                    className="group py-0.5"
                    data-stash-row
                  >
                    <div
                      className={cn(
                        "cursor-pointer rounded-lg px-2 py-1.5 transition duration-150",
                        isFocused
                          ? "bg-accent ring-ring/30 ring-1"
                          : "hover:bg-muted",
                      )}
                      onPointerDown={() => queueLongPress(stash)}
                      onPointerUp={clearLongPress}
                      onPointerCancel={clearLongPress}
                      onPointerLeave={clearLongPress}
                      onClick={() => {
                        handleRowOpen(stash);
                      }}
                      onMouseEnter={() => {
                        if (window.innerWidth >= 640) {
                          setFocusedStashIndex(index);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-muted flex size-8 shrink-0 items-center justify-center rounded-md border shadow-sm">
                          <Image
                            src={getFaviconUrl(hostname)}
                            alt=""
                            width={16}
                            height={16}
                            unoptimized
                            className="size-4 rounded-[3px]"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-foreground line-clamp-1 text-sm leading-tight font-medium">
                            {title}
                          </p>
                          <p className="text-muted-foreground truncate text-[11px]">
                            {stash.url}
                          </p>
                        </div>

                        {/* Action icons */}
                        <div className="flex shrink-0 items-center gap-0.5">
                          {/* Info / Preview */}
                          <Popover
                            open={isPreviewOpen}
                            onOpenChange={(open) => {
                              if (open) {
                                setPreviewStash(stash);
                              } else {
                                setPreviewStash(null);
                              }
                            }}
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <PopoverTrigger asChild>
                                  <button
                                    type="button"
                                    className={cn(
                                      "text-muted-foreground hover:bg-accent hover:text-foreground hidden size-8 items-center justify-center rounded-lg transition sm:flex",
                                      isPreviewOpen &&
                                        "bg-accent text-foreground",
                                    )}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <LuInfo size={15} />
                                  </button>
                                </PopoverTrigger>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                Details
                              </TooltipContent>
                            </Tooltip>
                            <PopoverContent
                              className="w-80 p-0"
                              align="end"
                              side="bottom"
                              sideOffset={6}
                              onClick={(e) => e.stopPropagation()}
                              onPointerDown={(e) => e.stopPropagation()}
                            >
                              <StashInfoPanel stash={stash} />
                            </PopoverContent>
                          </Popover>

                          {/* Copy */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-8 items-center justify-center rounded-lg transition"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void copyText(stash.url, stash.id);
                                }}
                              >
                                {copiedStashId === stash.id ? (
                                  <LuCheck
                                    size={15}
                                    className="text-emerald-400"
                                  />
                                ) : (
                                  <LuCopy size={15} />
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              Copy URL
                            </TooltipContent>
                          </Tooltip>

                          {/* Edit */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="text-muted-foreground hover:bg-accent hover:text-foreground hidden size-8 items-center justify-center rounded-lg transition sm:flex"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openStashEditor(stash);
                                }}
                              >
                                <LuPencil size={15} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Edit</TooltipContent>
                          </Tooltip>

                          {/* Delete */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="text-muted-foreground hidden size-8 items-center justify-center rounded-lg transition hover:bg-red-500/10 hover:text-red-300 sm:flex"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openDeleteConfirmation({
                                    kind: "stash",
                                    id: stash.id,
                                    title: "Remove stash?",
                                    description:
                                      "This removes the link from your stash permanently.",
                                    confirmLabel: "Remove stash",
                                  });
                                }}
                              >
                                <LuTrash2 size={15} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              Delete
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          </>
        )}

        {stashesQuery.isFetching && !showStashLoadState ? (
          <div className="mt-3">
            <QueryStatus compact>
              <span className="inline-flex items-center gap-2">
                <LuRefreshCw size={12} className="animate-spin" />
                Syncing stashes...
              </span>
            </QueryStatus>
          </div>
        ) : null}
      </div>
    </main>
  );
}

/** Desktop info panel shown in the popover */
function StashInfoPanel({ stash }: { stash: Stash }) {
  const { tags } = useStashQueries();
  const tag = tags.find((t) => t.id === stash.tagId);

  return (
    <div className="space-y-3 p-4">
      {/* URL */}
      <div className="space-y-1">
        <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.15em] uppercase">
          URL
        </p>
        <p className="text-foreground/80 font-mono text-xs leading-relaxed break-all">
          {stash.url}
        </p>
      </div>

      {/* Title (if different from hostname) */}
      {stash.title?.trim() && stash.title.trim() !== getHostname(stash.url) ? (
        <div className="space-y-1">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.15em] uppercase">
            Title
          </p>
          <p className="text-foreground/80 text-xs">{stash.title.trim()}</p>
        </div>
      ) : null}

      {/* Description */}
      {stash.description?.trim() ? (
        <div className="space-y-1">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.15em] uppercase">
            Description
          </p>
          <p className="text-foreground/70 text-xs leading-relaxed">
            {stash.description.trim()}
          </p>
        </div>
      ) : null}

      {/* Meta */}
      <div className="border-border/50 grid grid-cols-2 gap-3 border-t pt-3">
        {tag ? (
          <div className="space-y-1">
            <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.15em] uppercase">
              Tag
            </p>
            <p className="text-foreground/80 text-xs">{getTagLabel(tag)}</p>
          </div>
        ) : null}
        <div className="space-y-1">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.15em] uppercase">
            Added
          </p>
          <p className="text-foreground/80 text-xs">
            {formatRelativeDate(stash.createdAt)}
          </p>
        </div>
        {stash.updatedAt !== stash.createdAt ? (
          <div className="space-y-1">
            <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.15em] uppercase">
              Updated
            </p>
            <p className="text-foreground/80 text-xs">
              {formatRelativeDate(stash.updatedAt)}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
