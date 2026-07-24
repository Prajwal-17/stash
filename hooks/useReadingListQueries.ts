import {
  createReadingListItem,
  deleteReadingListItem,
  fetchReadingList,
  ReadingListItem,
  ReadingListUpdatePayload,
  stashQueryKeys,
  updateReadingListItem
} from "@/lib/stash-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import toast from "react-hot-toast";

export function useReadingListQueries() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: stashQueryKeys.readingList,
    queryFn: () => fetchReadingList(true)
  });

  const items: ReadingListItem[] = useMemo(() => query.data ?? [], [query.data]);

  const createMutation = useMutation({
    mutationFn: (payload: { url: string; scheduledFor?: number | null }) =>
      createReadingListItem(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: stashQueryKeys.readingList });
      const previous = queryClient.getQueryData<ReadingListItem[]>(stashQueryKeys.readingList);
      const optimisticItem: ReadingListItem = {
        id: "temp-" + Date.now(),
        userId: "temp",
        url: payload.url,
        title: payload.url,
        hostname: (() => {
          try {
            return new URL(payload.url).hostname.replace(/^www\./, "");
          } catch {
            return null;
          }
        })(),
        description: null,
        scheduledFor: payload.scheduledFor ?? null,
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      queryClient.setQueryData<ReadingListItem[]>(stashQueryKeys.readingList, (old) => [
        ...(old || []),
        optimisticItem
      ]);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(stashQueryKeys.readingList, context.previous);
      }
      toast.error("Failed to add to reading list");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: stashQueryKeys.readingList });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (payload: ReadingListUpdatePayload) => updateReadingListItem(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: stashQueryKeys.readingList });
      const previous = queryClient.getQueryData<ReadingListItem[]>(stashQueryKeys.readingList);
      queryClient.setQueryData<ReadingListItem[]>(stashQueryKeys.readingList, (old) => {
        if (!old) return old;
        return old.map((item) => {
          if (item.id !== payload.id) return item;

          let hostname = item.hostname;
          if (payload.url) {
            try {
              hostname = new URL(payload.url).hostname;
            } catch {
              // The form validates URLs before the optimistic update.
            }
          }

          return {
            ...item,
            ...payload,
            hostname,
            updatedAt: new Date().toISOString()
          };
        });
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(stashQueryKeys.readingList, context.previous);
      }
      toast.error("Failed to update item");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: stashQueryKeys.readingList });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteReadingListItem(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: stashQueryKeys.readingList });
      const previous = queryClient.getQueryData<ReadingListItem[]>(stashQueryKeys.readingList);
      queryClient.setQueryData<ReadingListItem[]>(stashQueryKeys.readingList, (old) => {
        if (!old) return old;
        return old.filter((item) => item.id !== id);
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(stashQueryKeys.readingList, context.previous);
      }
      toast.error("Failed to delete item");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: stashQueryKeys.readingList });
    }
  });

  const grouped = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const tomorrowEnd = todayStart + 24 * 60 * 60 * 1000;
    const weekEnd = todayStart + 7 * 24 * 60 * 60 * 1000;

    const queue: ReadingListItem[] = [];
    const today: ReadingListItem[] = [];
    const thisWeek: ReadingListItem[] = [];
    const later: ReadingListItem[] = [];
    const completed: ReadingListItem[] = [];

    for (const item of items) {
      if (item.isRead) {
        completed.push(item);
      } else if (item.scheduledFor) {
        if (item.scheduledFor < todayStart) {
          today.push(item);
        } else if (item.scheduledFor >= todayStart && item.scheduledFor < tomorrowEnd) {
          today.push(item);
        } else if (item.scheduledFor < weekEnd) {
          thisWeek.push(item);
        } else {
          later.push(item);
        }
      } else {
        queue.push(item);
      }
    }

    return { queue, today, thisWeek, later, completed };
  }, [items]);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const overdue = items.filter(
      (i) => !i.isRead && i.scheduledFor && i.scheduledFor < todayStart
    ).length;
    const scheduledToday = items.filter(
      (i) =>
        !i.isRead &&
        i.scheduledFor &&
        i.scheduledFor >= todayStart &&
        i.scheduledFor < todayStart + 24 * 60 * 60 * 1000
    ).length;

    return {
      total: items.length,
      queue: items.filter((i) => !i.isRead && !i.scheduledFor).length,
      scheduled: items.filter((i) => !i.isRead && i.scheduledFor).length,
      completed: items.filter((i) => i.isRead).length,
      today: scheduledToday,
      overdue
    };
  }, [items]);

  return {
    query,
    items,
    grouped,
    stats,
    createMutation,
    updateMutation,
    deleteMutation,
    isLoading: query.isPending,
    isError: query.isError
  };
}
