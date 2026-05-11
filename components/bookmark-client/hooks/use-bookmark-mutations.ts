import {
  Bookmark,
  createBookmark,
  createTag,
  deleteBookmark,
  deleteTag,
  MutationError,
  stashQueryKeys,
  Tag,
  updateBookmark,
  updateTag,
} from "@/lib/stash-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

export function useBookmarkMutations({
  onTagCreated,
  onTagDeleted,
  onBookmarkCreated,
  onBookmarkUpdated,
  onBookmarkDeleted,
  setNotice,
}: {
  onTagCreated: (tag: Tag) => void;
  onTagDeleted: (tagId: string) => void;
  onBookmarkCreated: () => void;
  onBookmarkUpdated: () => void;
  onBookmarkDeleted: () => void;
  setNotice: (notice: { type: "error" | "success"; message: string }) => void;
}) {
  const queryClient = useQueryClient();

  const createTagMutation = useMutation({
    mutationFn: (name: string) => createTag(name),
    onSuccess: (tag) => {
      queryClient.setQueryData<Tag[]>(stashQueryKeys.tags, (current = []) => [
        ...current,
        tag,
      ]);
      onTagCreated(tag);
      setNotice({ type: "success", message: "Tag created." });
    },
    onError: (error: MutationError) => {
      setNotice({ type: "error", message: error.message });
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: ({ tagId, name }: { tagId: string; name: string }) =>
      updateTag({ tagId, name }),
    onSuccess: (updatedTag) => {
      queryClient.setQueryData<Tag[]>(stashQueryKeys.tags, (current = []) =>
        current.map((tag) => (tag.id === updatedTag.id ? updatedTag : tag)),
      );
      setNotice({ type: "success", message: "Tag updated." });
    },
    onError: (error: MutationError) => {
      setNotice({ type: "error", message: error.message });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (tagId: string) => deleteTag(tagId),
    onSuccess: (_, tagId) => {
      queryClient.setQueryData<Tag[]>(stashQueryKeys.tags, (current = []) =>
        current.filter((tag) => tag.id !== tagId),
      );
      queryClient.setQueryData<Bookmark[]>(stashQueryKeys.bookmarks, (current = []) =>
        current.filter((bookmark) => bookmark.tagId !== tagId),
      );
      onTagDeleted(tagId);
      setNotice({ type: "success", message: "Tag deleted." });
    },
    onError: (error: MutationError) => {
      setNotice({ type: "error", message: error.message });
    },
  });

  const createBookmarkMutation = useMutation({
    mutationFn: (payload: {
      url: string;
      tagId: string;
      title?: string;
      description?: string;
    }) => createBookmark(payload),
    onSuccess: (bookmark) => {
      queryClient.setQueryData<Bookmark[]>(stashQueryKeys.bookmarks, (current = []) => [
        bookmark,
        ...current,
      ]);
      onBookmarkCreated();
      toast.success("Bookmark saved.");
    },
    onError: (error: MutationError) => {
      toast.error(error.message);
    },
  });

  const updateBookmarkMutation = useMutation({
    mutationFn: (payload: {
      bookmarkId: string;
      tagId: string;
      url: string;
      title?: string;
      description?: string;
    }) => updateBookmark(payload),
    onSuccess: (updatedBookmark) => {
      queryClient.setQueryData<Bookmark[]>(stashQueryKeys.bookmarks, (current = []) =>
        current.map((bookmark) =>
          bookmark.id === updatedBookmark.id ? updatedBookmark : bookmark,
        ),
      );
      onBookmarkUpdated();
      toast.success("Bookmark updated.");
    },
    onError: (error: MutationError) => {
      toast.error(error.message);
    },
  });

  const deleteBookmarkMutation = useMutation({
    mutationFn: (bookmarkId: string) => deleteBookmark(bookmarkId),
    onSuccess: (_, bookmarkId) => {
      queryClient.setQueryData<Bookmark[]>(stashQueryKeys.bookmarks, (current = []) =>
        current.filter((bookmark) => bookmark.id !== bookmarkId),
      );
      onBookmarkDeleted();
      setNotice({ type: "success", message: "Bookmark deleted." });
    },
    onError: (error: MutationError) => {
      setNotice({ type: "error", message: error.message });
    },
  });

  return {
    createTagMutation,
    updateTagMutation,
    deleteTagMutation,
    createBookmarkMutation,
    updateBookmarkMutation,
    deleteBookmarkMutation,
  };
}
