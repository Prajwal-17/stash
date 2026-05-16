"use client";

import {
  getFaviconUrl,
  getHostname,
  getStashTitle,
} from "@/components/stashClient/helpers";
import { StashInfoPanel } from "@/components/stashClient/list/StashInfoPanel";
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
import { Stash } from "@/lib/stash-client";
import { cn } from "@/lib/utils";
import { useStashStore } from "@/store/stashStore";
import { motion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import Highlighter from "react-highlight-words";
import { LuCheck, LuCopy, LuInfo, LuPencil, LuTrash2 } from "react-icons/lu";

export interface StashRowProps {
  stash: Stash;
  index: number;
  searchWords?: string[];
  expandedLayout?: boolean;
}

export function StashRow({
  stash,
  index,
  searchWords = [],
  expandedLayout = false,
}: StashRowProps) {
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

  const copiedStashId = useStashStore((s) => s.copiedStashId);
  const setDrawerStash = useStashStore((s) => s.setDrawerStash);
  const focusedStashIndex = useStashStore((s) => s.focusedStashIndex);
  const setFocusedStashIndex = useStashStore((s) => s.setFocusedStashIndex);
  const previewStash = useStashStore((s) => s.previewStash);
  const setPreviewStash = useStashStore((s) => s.setPreviewStash);

  const { copyText, openStashEditor, openDeleteConfirmation } =
    useStashActions();

  const isFocused = index === focusedStashIndex;
  const isPreviewOpen = previewStash?.id === stash.id;

  const hostname = stash.hostname || getHostname(stash.url);
  const title = getStashTitle(stash);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const queueLongPress = useCallback(() => {
    if (window.innerWidth >= 640) return;
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
    }
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setDrawerStash(stash);
    }, 480);
  }, [stash, setDrawerStash]);

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  function handleRowOpen() {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    window.open(stash.url, "_blank", "noopener,noreferrer");
  }

  return (
    <motion.li layout className="group py-0.5" data-stash-row>
      <div
        className={cn(
          "cursor-pointer rounded-lg px-2 py-1.5 transition duration-150",
          isFocused ? "bg-accent ring-ring/30 ring-1" : "hover:bg-muted",
        )}
        onPointerDown={queueLongPress}
        onPointerUp={clearLongPress}
        onPointerCancel={clearLongPress}
        onPointerLeave={clearLongPress}
        onClick={handleRowOpen}
        onMouseEnter={() => {
          if (window.innerWidth >= 640) {
            setFocusedStashIndex(index);
          }
        }}
      >
        <div className="flex items-start gap-3">
          <div className="bg-muted mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border shadow-sm">
            <Image
              src={getFaviconUrl(hostname)}
              alt=""
              width={16}
              height={16}
              unoptimized
              className="size-4 rounded-[3px]"
            />
          </div>

          <div className="flex min-h-8 min-w-0 flex-1 flex-col justify-center">
            <p className="text-foreground line-clamp-1 text-sm leading-tight font-medium">
              <Highlighter
                searchWords={searchWords}
                autoEscape={true}
                textToHighlight={title}
                highlightClassName="bg-white/15 text-foreground font-medium p-0"
              />
            </p>
            <p className="text-muted-foreground truncate text-[11px]">
              <Highlighter
                searchWords={searchWords}
                autoEscape={true}
                textToHighlight={stash.url}
                highlightClassName="bg-white/15 text-foreground font-medium p-0"
              />
            </p>

            {expandedLayout && stash.description && (
              <p className="text-muted-foreground/80 mt-1 line-clamp-2 text-xs leading-relaxed">
                <Highlighter
                  searchWords={searchWords}
                  autoEscape={true}
                  textToHighlight={stash.description}
                  highlightClassName="bg-white/15 text-foreground font-medium p-0"
                />
              </p>
            )}
          </div>

          <div className="mt-0.5 flex shrink-0 items-center gap-0.5">
            <Popover
              open={isPreviewOpen}
              onOpenChange={(open) => {
                if (open) setPreviewStash(stash);
                else setPreviewStash(null);
              }}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "text-muted-foreground hover:bg-accent hover:text-foreground hidden size-8 items-center justify-center rounded-lg transition sm:flex",
                        isPreviewOpen && "bg-accent text-foreground",
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <LuInfo size={15} />
                    </button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">Details</TooltipContent>
              </Tooltip>
              <PopoverContent
                className="w-80 p-0"
                align="end"
                side="bottom"
                sideOffset={6}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <StashInfoPanel stash={stash} searchWords={searchWords} />
              </PopoverContent>
            </Popover>

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
                    <LuCheck size={15} className="text-emerald-400" />
                  ) : (
                    <LuCopy size={15} />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Copy URL</TooltipContent>
            </Tooltip>

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
              <TooltipContent side="bottom">Delete</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </motion.li>
  );
}
