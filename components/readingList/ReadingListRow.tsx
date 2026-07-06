"use client";

import { getFaviconUrl } from "@/components/stashClient/helpers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ReadingListItem } from "@/lib/stash-client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Image from "next/image";
import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { LuCalendar, LuCheck, LuTrash2 } from "react-icons/lu";

export interface ReadingListRowProps {
  item: ReadingListItem;
  onSchedule: (id: string, dateMs?: number) => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  isCompleted?: boolean;
}

export function ReadingListRow({
  item,
  onSchedule,
  onMarkRead,
  onDelete,
  isCompleted
}: ReadingListRowProps) {
  const hostname =
    item.hostname || (item.url ? new URL(item.url).hostname.replace(/^www\./, "") : "");
  const title = item.title?.trim() || hostname;

  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    item.scheduledFor ? new Date(item.scheduledFor) : undefined
  );

  function handleRowOpen() {
    window.open(item.url, "_blank", "noopener,noreferrer");
  }

  function handleDateSelect(date: Date | undefined) {
    setSelectedDate(date);
    if (date) {
      onSchedule(item.id, date.getTime());
    } else {
      onSchedule(item.id);
    }
    setIsScheduleOpen(false);
  }

  function handleClearSchedule(e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedDate(undefined);
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
        className="hover:bg-muted cursor-pointer rounded-lg px-2 py-1.5 transition duration-150"
        onClick={handleRowOpen}
      >
        <div className="flex items-start gap-2.5">
          <button
            type="button"
            aria-label={isCompleted ? "Mark as unread" : "Mark as read"}
            className={cn(
              "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
              isCompleted
                ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
                : "border-muted-foreground/30 text-transparent hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-400"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(item.id);
            }}
          >
            <LuCheck size={12} strokeWidth={3} />
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

          {!isCompleted && (
            <div className="flex shrink-0 items-center gap-0.5 md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:focus-within:opacity-100">
              {scheduleLabel && (
                <span
                  className={cn(
                    "mr-1 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                    isPastScheduled ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"
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
                    className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-7 items-center justify-center rounded-lg transition"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <LuCalendar size={14} />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  side="bottom"
                  align="end"
                  className="w-auto p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-1">
                    <DayPicker
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      disabled={{ before: new Date() }}
                      className="rdp-sm"
                      showOutsideDays={false}
                      captionLayout="dropdown"
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
                        className="text-muted-foreground hover:text-foreground h-7 px-2 text-xs"
                        onClick={handleClearSchedule}
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              <button
                type="button"
                aria-label="Delete item"
                className="text-muted-foreground flex size-7 items-center justify-center rounded-lg transition hover:bg-red-500/10 hover:text-red-400"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteDialog(true);
                }}
              >
                <LuTrash2 size={14} />
              </button>
            </div>
          )}

          {/* Delete confirmation dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent className="w-[95vw] gap-0 overflow-hidden rounded-xl p-0 sm:max-w-md">
              <DialogHeader className="px-6 pt-6 pb-2">
                <DialogTitle className="text-xl font-semibold tracking-tight">
                  Remove from reading list
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm">
                  Are you sure you want to remove "{title}"?
                </DialogDescription>
              </DialogHeader>
              <div className="px-6 pt-2 pb-6">
                <DialogFooter className="gap-2 sm:justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowDeleteDialog(false)}
                    className="h-9"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      setShowDeleteDialog(false);
                      onDelete(item.id);
                    }}
                    className="h-9"
                  >
                    Delete
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </li>
  );
}
