"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ReadingListItem } from "@/lib/stash-client";
import { getFaviconUrl, getHostname } from "@/lib/link-utils";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Image from "next/image";
import {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import { DayPicker } from "react-day-picker";
import { LuCalendar, LuCheck, LuLoaderCircle, LuPencil, LuTrash2 } from "react-icons/lu";

export interface ReadingListRowProps {
  item: ReadingListItem;
  onSchedule: (id: string, dateMs?: number) => void;
  onMarkRead: (id: string, isRead: boolean) => void;
  onEdit: (item: ReadingListItem) => void;
  onDelete: (item: ReadingListItem) => void;
  onLongPress: (item: ReadingListItem) => void;
  isCompleted?: boolean;
  isPending?: boolean;
}

export function ReadingListRow({
  item,
  onSchedule,
  onMarkRead,
  onEdit,
  onDelete,
  onLongPress,
  isCompleted = item.isRead,
  isPending = false
}: ReadingListRowProps) {
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const longPressPointerRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);
  const hostname = item.hostname || getHostname(item.url);
  const title = item.title?.trim() || hostname;

  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const selectedDate = item.scheduledFor ? new Date(item.scheduledFor) : undefined;

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
        onLongPress(item);
      }, 480);
    },
    [clearLongPress, item, onLongPress]
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

  function handleDateSelect(date: Date | undefined) {
    if (date) {
      onSchedule(item.id, date.getTime());
    } else {
      onSchedule(item.id);
    }
    setIsScheduleOpen(false);
  }

  function handleClearSchedule(e: React.MouseEvent) {
    e.stopPropagation();
    onSchedule(item.id);
  }

  const scheduleLabel = item.scheduledFor ? format(new Date(item.scheduledFor), "MMM d") : null;

  const isPastScheduled =
    item.scheduledFor &&
    !item.isRead &&
    item.scheduledFor <
      new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();

  return (
    <li className="group py-0.5" data-reading-list-row>
      <div
        className="hover:bg-muted has-focus-visible:ring-ring/50 relative cursor-pointer touch-pan-y rounded-lg px-2 py-1.5 transition duration-150 select-none has-focus-visible:ring-2 sm:select-auto"
        onPointerDown={queueLongPress}
        onPointerMove={handlePointerMove}
        onPointerUp={clearLongPress}
        onPointerCancel={clearLongPress}
        onPointerLeave={clearLongPress}
        onContextMenu={(event) => {
          if (window.innerWidth < 640) event.preventDefault();
        }}
      >
        <a
          data-row-link
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${title}, ${hostname}. Open in a new tab`}
          className="absolute inset-0 z-0 rounded-lg focus:outline-none"
          onClick={handleLinkClick}
        />
        <div className="pointer-events-none relative z-10 flex items-start gap-2.5">
          <button
            data-row-action
            type="button"
            aria-label={isCompleted ? "Mark as unread" : "Mark as read"}
            disabled={isPending}
            className={cn(
              "pointer-events-auto",
              "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
              isCompleted
                ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
                : "border-muted-foreground/30 text-transparent hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-400",
              "disabled:cursor-wait disabled:opacity-50"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(item.id, !item.isRead);
            }}
          >
            {isPending ? (
              <LuLoaderCircle size={12} className="animate-spin text-current" />
            ) : (
              <LuCheck size={12} strokeWidth={3} />
            )}
          </button>

          <div className="bg-muted mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border shadow-sm">
            <Image
              src={getFaviconUrl(hostname)}
              alt=""
              width={14}
              height={14}
              unoptimized
              className="size-3.5 rounded-[2px]"
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <p
              className={cn(
                "line-clamp-1 text-sm leading-tight font-medium",
                isCompleted ? "text-muted-foreground/60 line-through" : "text-foreground"
              )}
            >
              {title}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground/50 truncate text-xs">{hostname}</p>
              {isCompleted && (
                <span className="text-muted-foreground/40 text-[10px]">
                  Read {format(new Date(item.updatedAt), "MMM d")}
                </span>
              )}
            </div>
          </div>

          <div
            data-row-action
            className="pointer-events-auto flex shrink-0 items-center gap-0.5 md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:focus-within:opacity-100"
          >
            {!isCompleted && (
              <>
                {scheduleLabel && (
                  <span
                    className={cn(
                      "mr-1 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                      isPastScheduled
                        ? "bg-red-500/10 text-red-400"
                        : "bg-blue-500/10 text-blue-400"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <LuCalendar size={10} />
                    {scheduleLabel}
                  </span>
                )}

                <Popover open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label="Schedule item"
                      disabled={isPending}
                      className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-7 items-center justify-center rounded-lg transition"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <LuCalendar size={14} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="bottom"
                    align="end"
                    collisionPadding={8}
                    className="max-h-[min(28rem,calc(100dvh-1rem))] w-auto max-w-[calc(100vw-1rem)] overflow-auto overscroll-contain p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-1">
                      <DayPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        disabled={{
                          before: new Date(
                            new Date().getFullYear(),
                            new Date().getMonth(),
                            new Date().getDate()
                          )
                        }}
                        className="rdp-sm"
                        showOutsideDays={false}
                        captionLayout="label"
                      />
                    </div>
                    {selectedDate && (
                      <div className="border-border/40 flex items-center justify-between border-t px-3 py-2">
                        <span className="text-muted-foreground text-xs">
                          {format(selectedDate, "MMM d, yyyy")}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          className="text-muted-foreground hover:text-foreground h-7 px-2 text-xs"
                          onClick={handleClearSchedule}
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </>
            )}

            <div className="hidden items-center gap-0.5 sm:flex">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Edit reading item"
                    disabled={isPending}
                    className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-7 items-center justify-center rounded-lg transition"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEdit(item);
                    }}
                  >
                    <LuPencil size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Edit</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Delete reading item"
                    disabled={isPending}
                    className="text-muted-foreground flex size-7 items-center justify-center rounded-lg transition hover:bg-red-500/10 hover:text-red-400"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(item);
                    }}
                  >
                    <LuTrash2 size={14} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Delete</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
