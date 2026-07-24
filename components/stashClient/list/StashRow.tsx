"use client";

import { getStashTitle } from "@/components/stashClient/helpers";
import { StashInfoPanel } from "@/components/stashClient/list/StashInfoPanel";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useStashActions } from "@/hooks/useStashActions";
import { Stash } from "@/lib/stash-client";
import { getFaviconUrl, getHostname } from "@/lib/link-utils";
import { cn } from "@/lib/utils";
import { useStashStore } from "@/store/stashStore";
import { motion } from "motion/react";
import Image from "next/image";
import {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef
} from "react";
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
  expandedLayout = false
}: StashRowProps) {
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const longPressPointerRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);

  const copiedStashId = useStashStore((s) => s.copiedStashId);
  const setDrawerStash = useStashStore((s) => s.setDrawerStash);
  const focusedStashIndex = useStashStore((s) => s.focusedStashIndex);
  const setFocusedStashIndex = useStashStore((s) => s.setFocusedStashIndex);
  const previewStash = useStashStore((s) => s.previewStash);
  const setPreviewStash = useStashStore((s) => s.setPreviewStash);

  const { copyText, openStashEditor, openDeleteConfirmation } = useStashActions();

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

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressPointerRef.current = null;
  }, []);

  const queueLongPress = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (window.innerWidth >= 640 || event.pointerType === "mouse") return;
      if ((event.target as HTMLElement).closest("[data-row-action]")) return;

      clearLongPress();
      longPressTriggeredRef.current = false;
      suppressClickRef.current = false;
      longPressPointerRef.current = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY
      };
      longPressTimerRef.current = window.setTimeout(() => {
        longPressTriggeredRef.current = true;
        suppressClickRef.current = true;
        setDrawerStash(stash);
      }, 480);
    },
    [clearLongPress, stash, setDrawerStash]
  );

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const start = longPressPointerRef.current;
    if (!start || start.id !== event.pointerId) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) {
      clearLongPress();
    }
  }

  function handleLinkClick(event: ReactMouseEvent<HTMLAnchorElement>) {
    if (longPressTriggeredRef.current || suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      longPressTriggeredRef.current = false;
      suppressClickRef.current = false;
    }
  }

  return (
    <motion.li layout className="group py-0.5" data-stash-row>
      <div
        className={cn(
          "has-focus-visible:ring-ring/50 relative cursor-pointer touch-pan-y rounded-lg px-2 py-1.5 transition duration-150 select-none has-focus-visible:ring-2 sm:select-auto",
          isFocused ? "bg-accent ring-ring/30 ring-1" : "hover:bg-muted"
        )}
        onPointerDown={queueLongPress}
        onPointerMove={handlePointerMove}
        onPointerUp={() => clearLongPress()}
        onPointerCancel={clearLongPress}
        onPointerLeave={clearLongPress}
        onContextMenu={(event) => {
          if (window.innerWidth < 640) event.preventDefault();
        }}
        onMouseEnter={() => {
          if (window.innerWidth >= 640) {
            setFocusedStashIndex(index);
          }
        }}
      >
        <a
          data-row-link
          href={stash.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${title}, ${hostname}. Open in a new tab`}
          className="absolute inset-0 z-0 rounded-lg focus:outline-none"
          onClick={handleLinkClick}
          onFocus={() => setFocusedStashIndex(index)}
        />
        <div className="pointer-events-none relative z-10 flex items-start gap-3">
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
            <p className="text-muted-foreground truncate text-xs">
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

          <div
            data-row-action
            className="pointer-events-auto mt-0.5 hidden shrink-0 items-center gap-0.5 sm:flex"
          >
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
                      aria-label="View details"
                      className={cn(
                        "text-muted-foreground hover:bg-accent hover:text-foreground flex size-8 items-center justify-center rounded-lg transition",
                        isPreviewOpen && "bg-accent text-foreground"
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
                className="max-h-[min(32rem,calc(100dvh-1rem))] w-80 max-w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain p-0"
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
                  aria-label="Copy URL"
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
                  aria-label="Edit stash"
                  className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-8 items-center justify-center rounded-lg transition"
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
                  aria-label="Delete stash"
                  className="text-muted-foreground flex size-8 items-center justify-center rounded-lg transition hover:bg-red-500/10 hover:text-red-300"
                  onClick={(event) => {
                    event.stopPropagation();
                    openDeleteConfirmation({
                      kind: "stash",
                      id: stash.id,
                      title: "Remove stash?",
                      description: "This removes the link from your stash permanently.",
                      confirmLabel: "Remove stash"
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
