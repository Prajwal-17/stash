"use client";

import { DeleteReadingListDialog } from "@/components/readingList/DeleteReadingListDialog";
import {
  EditReadingListDialog,
  ReadingListEditorState
} from "@/components/readingList/EditReadingListDialog";
import { ReadingListActionDrawer } from "@/components/readingList/ReadingListActionDrawer";
import { ReadingListRow } from "@/components/readingList/ReadingListRow";
import { QueryStatus } from "@/components/shared/QueryStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useReadingListQueries } from "@/hooks/useReadingListQueries";
import { ReadingListItem, ReadingListUpdatePayload } from "@/lib/stash-client";
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
    query,
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
  const [drawerItem, setDrawerItem] = useState<ReadingListItem | null>(null);
  const [editor, setEditor] = useState<ReadingListEditorState | null>(null);
  const [deleteItem, setDeleteItem] = useState<ReadingListItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!urlInput.trim()) return;
    try {
      const nextUrl = urlInput.trim();
      new URL(nextUrl);
      createMutation.mutate(
        { url: nextUrl },
        {
          onSuccess: () => {
            setUrlInput((current) => (current.trim() === nextUrl ? "" : current));
          }
        }
      );
    } catch {
      toast.error("Please enter a valid URL");
    }
  };

  const handleSchedule = (id: string, dateMs?: number) => {
    updateMutation.mutate({ id, scheduledFor: dateMs ?? null });
  };

  const handleMarkRead = (id: string, isRead: boolean) => {
    updateMutation.mutate({ id, isRead });
  };

  const handleEditRequest = (item: ReadingListItem) => {
    setDrawerItem(null);
    setEditor({
      id: item.id,
      url: item.url,
      title: item.title ?? "",
      description: item.description ?? ""
    });
  };

  const handleEditSubmit = async (payload: ReadingListUpdatePayload) => {
    try {
      await updateMutation.mutateAsync(payload);
      setEditor(null);
      toast.success("Reading item updated");
    } catch {
      // The mutation surfaces its error with a toast.
    }
  };

  const handleDeleteRequest = (item: ReadingListItem) => {
    setDrawerItem(null);
    setDeleteItem(item);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return;

    try {
      await deleteMutation.mutateAsync(deleteItem.id);
      setDeleteItem(null);
    } catch {
      // The mutation surfaces its error with a toast.
    }
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

  const completedItems = [...grouped.completed].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  const pendingUpdateId = updateMutation.isPending ? updateMutation.variables?.id : null;
  const pendingDeleteId = deleteMutation.isPending ? deleteMutation.variables : null;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        <header className="border-border/40 bg-background/90 sticky top-0 z-10 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-4 py-3 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {standalone && (
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="text-muted-foreground hover:text-foreground h-8 w-8 md:hidden"
              >
                <Link href="/" aria-label="Back to Stash">
                  <LuArrowLeft size={16} />
                </Link>
              </Button>
            )}
            <h1 className="truncate text-base font-medium tracking-tight">Reading List</h1>
            {isLoading && items.length === 0 ? (
              <LuLoaderCircle size={14} className="text-muted-foreground/50 animate-spin" />
            ) : (
              <span className="text-muted-foreground/40 font-mono text-xs">{stats.total}</span>
            )}
          </div>
          <div className="bg-muted/30 order-last grid w-full grid-cols-3 items-center gap-0.5 rounded-lg p-0.5 sm:order-0 sm:flex sm:w-auto md:hidden">
            {(["queue", "scheduled", "completed"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                aria-pressed={activeTab === tab}
                className={cn(
                  "focus-visible:ring-ring/50 flex min-h-8 items-center justify-center rounded-md px-2 py-1 text-xs font-medium capitalize transition-colors focus-visible:ring-2 focus-visible:outline-none",
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
          {isError && items.length > 0 ? (
            <div className="mb-4">
              <QueryStatus tone="error">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span>Could not refresh the reading list.</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={query.isFetching}
                    onClick={() => void query.refetch()}
                  >
                    {query.isFetching ? "Retrying..." : "Retry"}
                  </Button>
                </div>
              </QueryStatus>
            </div>
          ) : null}

          {isError && items.length === 0 ? (
            <QueryStatus tone="error">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>Failed to load the reading list.</span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={query.isFetching}
                  onClick={() => void query.refetch()}
                >
                  {query.isFetching ? "Retrying..." : "Retry"}
                </Button>
              </div>
            </QueryStatus>
          ) : isLoading && items.length === 0 ? (
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
              {todayItems.length > 0 && (
                <section className={cn(activeTab !== "scheduled" && "hidden md:block")}>
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
                        onEdit={handleEditRequest}
                        onDelete={handleDeleteRequest}
                        onLongPress={setDrawerItem}
                        isPending={pendingUpdateId === item.id || pendingDeleteId === item.id}
                      />
                    ))}
                  </ul>
                </section>
              )}

              {upcomingItems.length > 0 && (
                <section className={cn(activeTab !== "scheduled" && "hidden md:block")}>
                  <button
                    type="button"
                    onClick={() => setShowUpcoming(!showUpcoming)}
                    aria-expanded={showUpcoming || activeTab === "scheduled"}
                    className="hover:bg-muted/30 focus-visible:ring-ring/50 mb-2 flex min-h-8 w-full items-center justify-between rounded-md px-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
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
                          (showUpcoming || activeTab === "scheduled") && "rotate-180"
                        )}
                      />
                    </span>
                  </button>
                  {(showUpcoming || activeTab === "scheduled") && (
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
                                onEdit={handleEditRequest}
                                onDelete={handleDeleteRequest}
                                onLongPress={setDrawerItem}
                                isPending={
                                  pendingUpdateId === item.id || pendingDeleteId === item.id
                                }
                              />
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {grouped.queue.length > 0 && (
                <section className={cn(activeTab !== "queue" && "hidden md:block")}>
                  <button
                    type="button"
                    onClick={() => setShowList(!showList)}
                    aria-expanded={showList}
                    className="hover:bg-muted/30 focus-visible:ring-ring/50 mb-2 flex min-h-8 w-full items-center justify-between rounded-md px-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
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
                          onEdit={handleEditRequest}
                          onDelete={handleDeleteRequest}
                          onLongPress={setDrawerItem}
                          isPending={pendingUpdateId === item.id || pendingDeleteId === item.id}
                        />
                      ))}
                    </ul>
                  )}
                </section>
              )}

              {activeTab === "queue" && grouped.queue.length === 0 && (
                <section className="md:hidden">
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground/40 text-sm">No items added yet</p>
                  </div>
                </section>
              )}

              {activeTab === "scheduled" &&
                todayItems.length === 0 &&
                upcomingItems.length === 0 && (
                  <section className="md:hidden">
                    <div className="py-12 text-center">
                      <p className="text-muted-foreground/40 text-sm">No scheduled items</p>
                    </div>
                  </section>
                )}

              {activeTab === "completed" && grouped.completed.length === 0 && (
                <section className="md:hidden">
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground/40 text-sm">No completed items yet</p>
                  </div>
                </section>
              )}

              {grouped.completed.length > 0 && (
                <section className={cn(activeTab !== "completed" && "hidden md:block")}>
                  <button
                    type="button"
                    onClick={() => setShowCompleted(!showCompleted)}
                    aria-expanded={showCompleted || activeTab === "completed"}
                    className="hover:bg-muted/30 focus-visible:ring-ring/50 mb-2 flex min-h-8 w-full items-center justify-between rounded-md px-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
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
                          (showCompleted || activeTab === "completed") && "rotate-180"
                        )}
                      />
                    </span>
                  </button>
                  {(showCompleted || activeTab === "completed") && (
                    <ul className="flex flex-col gap-1">
                      {completedItems.map((item) => (
                        <ReadingListRow
                          key={item.id}
                          item={item}
                          onSchedule={handleSchedule}
                          onMarkRead={handleMarkRead}
                          onEdit={handleEditRequest}
                          onDelete={handleDeleteRequest}
                          onLongPress={setDrawerItem}
                          isCompleted
                          isPending={pendingUpdateId === item.id || pendingDeleteId === item.id}
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

      <div
        className={cn(
          "mx-auto w-full max-w-2xl shrink-0 px-3 pt-2 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:px-6 md:pb-3",
          standalone && "pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
        )}
      >
        <div className="w-full">
          <div className="border-border/30 bg-muted/15 focus-within:border-primary/50 focus-within:ring-primary/15 flex w-full items-center gap-2 rounded-xl border p-1.5 transition-all focus-within:ring-4">
            <Input
              ref={inputRef}
              aria-label="Article URL"
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
              className="text-foreground placeholder:text-muted-foreground/40 h-10 min-w-0 flex-1 border-0 bg-transparent px-3 py-1.5 shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
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

      <ReadingListActionDrawer
        item={drawerItem}
        onOpenChange={(open) => {
          if (!open) setDrawerItem(null);
        }}
        onEdit={handleEditRequest}
        onDelete={handleDeleteRequest}
      />
      <EditReadingListDialog
        editor={editor}
        onEditorChange={setEditor}
        onSubmit={handleEditSubmit}
        isPending={updateMutation.isPending && updateMutation.variables?.id === editor?.id}
      />
      <DeleteReadingListDialog
        item={deleteItem}
        isPending={deleteMutation.isPending && deleteMutation.variables === deleteItem?.id}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setDeleteItem(null);
        }}
        onConfirm={() => void handleDeleteConfirm()}
      />
    </div>
  );
}
