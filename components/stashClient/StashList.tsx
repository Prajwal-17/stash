"use client";

import {
  getFaviconUrl,
  getHostname,
  getStashTitle,
} from "@/components/stashClient/helpers";
import { QueryStatus } from "@/components/stashClient/ui";
import { Button } from "@/components/ui/button";
import { useStashActions } from "@/hooks/useStashActions";
import { useStashQueries } from "@/hooks/useStashQueries";
import { Stash, getDefaultTagId } from "@/lib/stash-client";
import { useStashStore } from "@/store/stashStore";
import { motion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  LuCheck,
  LuCopy,
  LuExternalLink,
  LuLoaderCircle,
  LuPencil,
  LuRefreshCw,
  LuTrash2,
} from "react-icons/lu";

export function StashList() {
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  const activeTagId = useStashStore((s) => s.activeTagId);
  const copiedStashId = useStashStore((s) => s.copiedStashId);
  const setDrawerStash = useStashStore((s) => s.setDrawerStash);
  const setTagEditor = useStashStore((s) => s.setTagEditor);

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

  function openStashUrl(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleRowOpen(stash: Stash) {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    openStashUrl(stash.url);
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
          <ul className="divide-y divide-white/8">
            {visibleStashes.map((stash) => {
              const hostname = stash.hostname || getHostname(stash.url);
              const title = getStashTitle(stash);

              return (
                <motion.li key={stash.id} layout className="group py-1">
                  <div
                    className="hover:bg-muted cursor-pointer rounded-lg px-2 py-3 transition duration-200"
                    onPointerDown={() => queueLongPress(stash)}
                    onPointerUp={clearLongPress}
                    onPointerCancel={clearLongPress}
                    onPointerLeave={clearLongPress}
                    onClick={() => handleRowOpen(stash)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex shrink-0 items-center justify-center">
                        <Image
                          src={getFaviconUrl(hostname)}
                          alt=""
                          width={20}
                          height={20}
                          unoptimized
                          className="size-5 rounded"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-foreground truncate text-sm font-medium">
                          {title}
                        </p>
                        <p className="text-muted-foreground mt-1 truncate text-xs">
                          {stash.url}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-0.5 self-center sm:gap-1">
                        <button
                          type="button"
                          className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-8 items-center justify-center rounded-xl transition sm:size-9"
                          onClick={(event) => {
                            event.stopPropagation();
                            void copyText(stash.url, stash.id);
                          }}
                        >
                          {copiedStashId === stash.id ? (
                            <LuCheck size={16} />
                          ) : (
                            <LuCopy size={16} />
                          )}
                        </button>
                        <a
                          href={stash.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-8 items-center justify-center rounded-xl transition sm:size-9"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <LuExternalLink size={16} />
                        </a>
                        <button
                          type="button"
                          className="text-muted-foreground hover:bg-accent hover:text-foreground hidden size-9 items-center justify-center rounded-xl transition sm:flex"
                          onClick={(event) => {
                            event.stopPropagation();
                            openStashEditor(stash);
                          }}
                        >
                          <LuPencil size={16} />
                        </button>
                        <button
                          type="button"
                          className="text-muted-foreground hidden size-9 items-center justify-center rounded-xl transition hover:bg-red-500/10 hover:text-red-300 sm:flex"
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
                          <LuTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
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
