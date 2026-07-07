"use client";

import { ReadingListRow } from "@/components/readingList/ReadingListRow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useReadingListQueries } from "@/hooks/useReadingListQueries";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  LuArrowLeft,
  LuCheckCheck,
  LuChevronDown,
  LuClock,
  LuInbox,
  LuLoaderCircle,
  LuCalendar
} from "react-icons/lu";

type Tab = "queue" | "scheduled" | "completed";

interface ReadingListViewProps {
  standalone?: boolean;
}

export function ReadingListView({ standalone = false }: ReadingListViewProps) {
  const {
    items,
    grouped,
    stats,
    createMutation,
    updateMutation,
    deleteMutation,
    isLoading,
    isError
  } = useReadingListQueries();

  const [urlInput, setUrlInput] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("queue");
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [showList, setShowList] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!urlInput.trim()) return;
    try {
      new URL(urlInput.trim());
      createMutation.mutate({ url: urlInput.trim() });
      setUrlInput("");
    } catch {
      toast.error("Please enter a valid URL");
    }
  };

  const handleSchedule = (id: string, dateMs?: number) => {
    updateMutation.mutate({ id, scheduledFor: dateMs ?? null });
  };

  const handleMarkRead = (id: string) => {
    updateMutation.mutate({ id, isRead: true });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const todayItems = grouped.today;
  const upcomingItems = [...grouped.thisWeek, ...grouped.later].sort(
    (a, b) => (a.scheduledFor || 0) - (b.scheduledFor || 0)
  );

  const groupedUpcoming = upcomingItems.reduce(
    (acc, item) => {
      const dateStr = item.scheduledFor
        ? format(new Date(item.scheduledFor), "MMM d, yyyy")
        : "Unscheduled";
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(item);
      return acc;
    },
    {} as Record<string, typeof upcomingItems>
  );

  if (isError) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">Failed to load reading list</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <main className="flex flex-1 flex-col overflow-y-auto">
        <header className="border-border/40 bg-background/80 sticky top-0 z-10 flex items-center justify-between border-b px-4 py-2.5 backdrop-blur-md sm:px-8 sm:py-3">
          <div className="flex items-center gap-3">
            {standalone && (
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="text-muted-foreground hover:text-foreground h-8 w-8 md:hidden"
              >
                <Link href="/">
                  <LuArrowLeft size={16} />
                </Link>
              </Button>
            )}
            <h1 className="text-base font-medium tracking-tight">Reading List</h1>
            {isLoading && items.length === 0 ? (
              <LuLoaderCircle size={14} className="text-muted-foreground/50 animate-spin" />
            ) : (
              <span className="text-muted-foreground/40 font-mono text-xs">{stats.total}</span>
            )}
          </div>
          <div className="bg-muted/30 flex items-center gap-0.5 rounded-lg p-0.5 md:hidden">
            {(["queue", "scheduled", "completed"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                  activeTab === tab
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab === "queue" && (
                  <span className="flex items-center gap-1">
                    <LuInbox size={12} />
                    List
                  </span>
                )}
                {tab === "scheduled" && (
                  <span className="flex items-center gap-1">
                    <LuCalendar size={12} />
                    Scheduled
                  </span>
                )}
                {tab === "completed" && (
                  <span className="flex items-center gap-1">
                    <LuCheckCheck size={12} />
                    Done
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <span className="text-muted-foreground/50 flex items-center gap-1 text-xs">
              <LuInbox size={11} />
              {stats.queue}
            </span>
            <span className="text-muted-foreground/50 flex items-center gap-1 text-xs">
              <LuCalendar size={11} />
              {stats.scheduled}
            </span>
            <span className="text-muted-foreground/50 flex items-center gap-1 text-xs">
              <LuCheckCheck size={11} />
              {stats.completed}
            </span>
          </div>
        </header>

        <div className="mx-auto w-full max-w-3xl px-3 pt-4 pb-16 sm:px-6">
          {isLoading && items.length === 0 ? (
            <div className="py-16 text-center">
              <LuLoaderCircle size={20} className="text-muted-foreground/40 mx-auto animate-spin" />
              <p className="text-muted-foreground/40 mt-3 text-sm">Loading reading list...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-muted-foreground/20 bg-muted/30 mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl">
                <LuClock size={28} />
              </div>
              <p className="text-muted-foreground text-sm font-medium">Nothing added yet</p>
              <p className="text-muted-foreground/40 mt-1 text-xs">
                Paste an article URL below to start your reading list
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Today section — always on top, always expanded */}
              {(activeTab === "queue" || activeTab === "scheduled") && todayItems.length > 0 && (
                <section>
                  <div className="mb-2 flex items-baseline justify-between px-2">
                    <h3 className="text-foreground/80 text-sm font-semibold tracking-tight">
                      Today
                    </h3>
                    <span className="text-muted-foreground/40 font-mono text-xs">
                      {stats.overdue > 0 && (
                        <span className="mr-1.5 text-red-400/70">{stats.overdue} overdue</span>
                      )}
                      {todayItems.length}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-1">
                    {todayItems.map((item) => (
                      <ReadingListRow
                        key={item.id}
                        item={item}
                        onSchedule={handleSchedule}
                        onMarkRead={handleMarkRead}
                        onDelete={handleDelete}
                      />
                    ))}
                  </ul>
                </section>
              )}

              {/* Upcoming section — collapsible, default collapsed */}
              {(activeTab === "queue" || activeTab === "scheduled") && upcomingItems.length > 0 && (
                <section>
                  <button
                    onClick={() => setShowUpcoming(!showUpcoming)}
                    className="hover:bg-muted/30 mb-2 flex w-full items-center justify-between rounded-md px-2 transition-colors"
                  >
                    <h3 className="text-muted-foreground/60 text-sm font-semibold tracking-tight">
                      Upcoming
                    </h3>
                    <span className="flex items-center gap-1.5">
                      <span className="text-muted-foreground/40 font-mono text-xs">
                        {upcomingItems.length}
                      </span>
                      <LuChevronDown
                        size={14}
                        className={cn(
                          "text-muted-foreground/40 transition-transform",
                          showUpcoming && "rotate-180"
                        )}
                      />
                    </span>
                  </button>
                  {showUpcoming && (
                    <div className="space-y-4">
                      {Object.entries(groupedUpcoming).map(([date, dateItems]) => (
                        <div key={date}>
                          <h4 className="text-muted-foreground/70 mb-1.5 px-2 text-xs font-medium tracking-wider uppercase">
                            {date}
                          </h4>
                          <ul className="flex flex-col gap-1">
                            {dateItems.map((item) => (
                              <ReadingListRow
                                key={item.id}
                                item={item}
                                onSchedule={handleSchedule}
                                onMarkRead={handleMarkRead}
                                onDelete={handleDelete}
                              />
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* List section — unscheduled items, collapsible, default collapsed */}
              {(activeTab === "queue" || !standalone) && grouped.queue.length > 0 && (
                <section>
                  <button
                    onClick={() => setShowList(!showList)}
                    className="hover:bg-muted/30 mb-2 flex w-full items-center justify-between rounded-md px-2 transition-colors"
                  >
                    <h3 className="text-muted-foreground/60 text-sm font-semibold tracking-tight">
                      List
                    </h3>
                    <span className="flex items-center gap-1.5">
                      <span className="text-muted-foreground/40 font-mono text-xs">
                        {grouped.queue.length}
                      </span>
                      <LuChevronDown
                        size={14}
                        className={cn(
                          "text-muted-foreground/40 transition-transform",
                          showList && "rotate-180"
                        )}
                      />
                    </span>
                  </button>
                  {showList && (
                    <ul className="flex flex-col gap-1">
                      {grouped.queue.map((item) => (
                        <ReadingListRow
                          key={item.id}
                          item={item}
                          onSchedule={handleSchedule}
                          onMarkRead={handleMarkRead}
                          onDelete={handleDelete}
                        />
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {/* Empty state when queue tab has nothing */}
              {activeTab === "queue" &&
                grouped.queue.length === 0 &&
                todayItems.length === 0 &&
                upcomingItems.length === 0 && (
                  <section>
                    <div className="py-12 text-center">
                      <p className="text-muted-foreground/40 text-sm">No items added yet</p>
                    </div>
                  </section>
                )}

              {/* Empty state when scheduled tab has nothing */}
              {activeTab === "scheduled" &&
                todayItems.length === 0 &&
                upcomingItems.length === 0 && (
                  <section>
                    <div className="py-12 text-center">
                      <p className="text-muted-foreground/40 text-sm">No scheduled items</p>
                    </div>
                  </section>
                )}

              {/* Empty state when completed tab has nothing */}
              {activeTab === "completed" && grouped.completed.length === 0 && (
                <section>
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground/40 text-sm">No completed items yet</p>
                  </div>
                </section>
              )}

              {/* Completed section — collapsed by default */}
              {(activeTab === "queue" || activeTab === "completed") &&
                grouped.completed.length > 0 && (
                  <section>
                    <button
                      onClick={() => setShowCompleted(!showCompleted)}
                      className="hover:bg-muted/30 mb-2 flex w-full items-center justify-between rounded-md px-2 transition-colors"
                    >
                      <h3 className="text-muted-foreground/60 text-sm font-semibold tracking-tight">
                        Completed
                      </h3>
                      <span className="flex items-center gap-1.5">
                        <span className="text-muted-foreground/40 font-mono text-xs">
                          {grouped.completed.length}
                        </span>
                        <LuChevronDown
                          size={14}
                          className={cn(
                            "text-muted-foreground/40 transition-transform",
                            showCompleted && "rotate-180"
                          )}
                        />
                      </span>
                    </button>
                    {showCompleted && (
                      <ul className="flex flex-col gap-1">
                        {grouped.completed
                          .sort(
                            (a, b) =>
                              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                          )
                          .map((item) => (
                            <ReadingListRow
                              key={item.id}
                              item={item}
                              onSchedule={handleSchedule}
                              onMarkRead={handleMarkRead}
                              onDelete={handleDelete}
                              isCompleted
                            />
                          ))}
                      </ul>
                    )}
                  </section>
                )}
            </div>
          )}
        </div>
      </main>

      <div className="mx-auto w-full max-w-2xl shrink-0 px-3 pb-[calc(env(safe-area-inset-bottom)+68px)] sm:px-6 md:pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <div className="w-full">
          <div className="border-border/30 bg-muted/15 focus-within:border-primary/50 focus-within:ring-primary/15 flex w-full items-center gap-2 rounded-xl border p-1.5 transition-all focus-within:ring-4">
            <Input
              ref={inputRef}
              value={urlInput}
              onChange={(event) => setUrlInput(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              placeholder="Paste article URL to add..."
              disabled={createMutation.isPending}
              className="text-foreground placeholder:text-muted-foreground/40 h-10 flex-1 border-0 bg-transparent px-3 py-1.5 shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 shrink-0 rounded-lg px-4 font-semibold shadow-sm transition-all"
              disabled={createMutation.isPending || !urlInput.trim()}
              onClick={() => handleAdd()}
            >
              {createMutation.isPending ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
