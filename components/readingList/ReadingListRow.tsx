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
import {
  LuCalendar,
  LuCheck,
  LuEllipsis,
  LuLoaderCircle,
  LuPencil,
  LuTrash2
} from "react-icons/lu";

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
    setIsScheduleOpen(false);
  }

  const scheduleLabel = item.scheduledFor ? format(new Date(item.scheduledFor), "MMM d") : null;

  const isPastScheduled =
    item.scheduledFor &&
    !item.isRead &&
    item.scheduledFor <
      new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();

  return (
    <li className="group min-w-0 py-0.5" data-reading-list-row>
      <div
        className="hover:bg-muted/50 has-focus-visible:ring-ring/50 relative touch-pan-y rounded-md px-2 py-1 transition-colors select-none has-focus-visible:ring-2 sm:select-auto"
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
          className="absolute inset-0 z-0 rounded-md focus:outline-none"
          onClick={handleLinkClick}
        />
        <div className="pointer-events-none relative z-10 flex items-center gap-1.5 sm:gap-2">
          <button
            data-row-action
            type="button"
            aria-label={isCompleted ? "Mark as unread" : "Mark as read"}
            aria-pressed={isCompleted}
            disabled={isPending}
            className="focus-visible:ring-ring/50 pointer-events-auto flex size-8 shrink-0 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none disabled:cursor-wait disabled:opacity-50"
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(item.id, !item.isRead);
            }}
          >
            <span
              className={cn(
                "flex size-4 items-center justify-center rounded-[3px] border transition-colors",
                isCompleted
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-muted-foreground/30 group-hover:border-muted-foreground/50 text-transparent"
              )}
            >
              {isPending ? (
                <LuLoaderCircle size={11} className="text-muted-foreground animate-spin" />
              ) : (
                <LuCheck size={11} strokeWidth={2.5} />
              )}
            </span>
          </button>

          <div className="hidden size-4 shrink-0 items-center justify-center sm:flex">
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
                "line-clamp-2 text-sm leading-tight font-medium sm:line-clamp-1",
                isCompleted ? "text-muted-foreground line-through" : "text-foreground"
              )}
            >
              {title}
            </p>
            <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
              <p className="text-muted-foreground min-w-0 truncate text-xs">{hostname}</p>
              {isCompleted && (
                <span className="text-muted-foreground text-xs">
                  Read {format(new Date(item.updatedAt), "MMM d")}
                </span>
              )}
              {!isCompleted && scheduleLabel && (
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 text-[11px]",
                    isPastScheduled ? "text-destructive" : "text-muted-foreground"
                  )}
                >
                  <LuCalendar size={11} />
                  {scheduleLabel}
                </span>
              )}
            </div>
          </div>

          <div
            data-row-action
            className={cn(
              "pointer-events-auto flex shrink-0 items-center gap-0.5 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-focus-within:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100",
              isScheduleOpen && "[@media(hover:hover)_and_(pointer:fine)]:opacity-100"
            )}
          >
            {!isCompleted && (
              <>
                <Popover open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label="Schedule item"
                      disabled={isPending}
                      className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring/50 flex size-8 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50 sm:size-7"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <LuCalendar size={14} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="bottom"
                    align="end"
                    collisionPadding={8}
                    aria-label={`Schedule ${title}`}
                    className="max-h-[min(28rem,var(--radix-popover-content-available-height))] w-auto p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-2">
                      <DayPicker
                        autoFocus
                        mode="single"
                        defaultMonth={selectedDate}
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        disabled={{
                          before: new Date(
                            new Date().getFullYear(),
                            new Date().getMonth(),
                            new Date().getDate()
                          )
                        }}
                        showOutsideDays={false}
                        captionLayout="label"
                      />
                    </div>
                    {selectedDate && (
                      <div className="flex items-center justify-between gap-3 px-3 pb-2">
                        <span className="text-muted-foreground text-xs">
                          {format(selectedDate, "MMM d, yyyy")}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isPending}
                          className="text-muted-foreground hover:text-foreground h-8 px-2 text-xs"
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
                    className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring/50 flex size-8 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50 sm:size-7"
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
                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:ring-ring/50 flex size-8 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50 sm:size-7"
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
            <button
              type="button"
              aria-label={`More actions for ${title}`}
              disabled={isPending}
              className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring/50 flex size-8 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50 sm:hidden"
              onClick={(event) => {
                event.stopPropagation();
                onLongPress(item);
              }}
            >
              <LuEllipsis size={16} />
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
