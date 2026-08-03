import {
  createStash,
  createTag,
  deleteStash,
  deleteTag,
  getDefaultTagId,
  MutationError,
  setStashArchived,
  setTagArchived,
  Stash,
  stashQueryKeys,
  Tag,
  updateStash,
  updateTag
} from "@/lib/stash-client";
import { useStashStore } from "@/store/stashStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

export function useStashMutations() {
  const queryClient = useQueryClient();
  const setActiveTagId = useStashStore((s) => s.setActiveTagId);
  const setComposerTagId = useStashStore((s) => s.setComposerTagId);
  const setUrlInput = useStashStore((s) => s.setUrlInput);
  const setStashEditor = useStashStore((s) => s.setStashEditor);
  const setDrawerStash = useStashStore((s) => s.setDrawerStash);

  const createTagMutation = useMutation({
    mutationFn: (name: string) => createTag(name),
    onSuccess: (tag) => {
      queryClient.setQueryData<Tag[]>(stashQueryKeys.tags, (current = []) => [...current, tag]);
      setActiveTagId(tag.id);
      setComposerTagId(tag.id);
      toast.success("Tag created.");
    },
    onError: (error: MutationError) => {
      toast.error(error.message);
    }
  });

  const updateTagMutation = useMutation({
    mutationFn: ({ tagId, name }: { tagId: string; name: string }) => updateTag({ tagId, name }),
    onSuccess: (updatedTag) => {
      queryClient.setQueryData<Tag[]>(stashQueryKeys.tags, (current = []) =>
        current.map((tag) => (tag.id === updatedTag.id ? updatedTag : tag))
      );
      toast.success("Tag updated.");
    },
    onError: (error: MutationError) => {
      toast.error(error.message);
    }
  });
  const setTagArchivedMutation = useMutation({
    mutationFn: ({ tagId, action }: { tagId: string; action: "archive" | "restore" }) =>
      setTagArchived(tagId, action),
    onSuccess: (updatedTag, { action }) => {
      const currentTags = queryClient.getQueryData<Tag[]>(stashQueryKeys.tags) ?? [];
      const nextTags = currentTags.map((tag) => (tag.id === updatedTag.id ? updatedTag : tag));
      queryClient.setQueryData<Tag[]>(stashQueryKeys.tags, nextTags);

      if (action === "archive") {
        const store = useStashStore.getState();
        const fallbackTagId = getDefaultTagId(nextTags);
        if (store.activeTagId === updatedTag.id) store.setActiveTagId(fallbackTagId);
        if (store.composerTagId === updatedTag.id) store.setComposerTagId(fallbackTagId);
        store.setPreviewStash(null);
        store.setDrawerStash(null);
        store.setStashEditor(null);
        store.setTagEditor(null);
        store.setFocusedStashIndex(-1);
      }

      toast.success(action === "archive" ? "Tag archived." : "Tag restored.");
    },
    onError: (error: MutationError) => {
      toast.error(error.message);
    }
  });

  const deleteTagMutation = useMutation({
    mutationFn: (tagId: string) => deleteTag(tagId),
    onSuccess: (_, tagId) => {
      queryClient.setQueryData<Tag[]>(stashQueryKeys.tags, (current = []) =>
        current.filter((tag) => tag.id !== tagId)
      );
      queryClient.setQueryData<Stash[]>(stashQueryKeys.stashes, (current = []) =>
        current.filter((stash) => stash.tagId !== tagId)
      );
      // Reset active/composer tag if the deleted tag was selected
      const store = useStashStore.getState();
      if (store.activeTagId === tagId) setActiveTagId(null);
      if (store.composerTagId === tagId) setComposerTagId(null);
      if (store.previewStash?.tagId === tagId) store.setPreviewStash(null);
      if (store.drawerStash?.tagId === tagId) store.setDrawerStash(null);
      if (store.stashEditor?.tagId === tagId) store.setStashEditor(null);
      if (store.tagEditor?.tagId === tagId) store.setTagEditor(null);
      store.setFocusedStashIndex(-1);
      toast.success("Tag deleted.");
    },
    onError: (error: MutationError) => {
      toast.error(error.message);
    }
  });

  const createStashMutation = useMutation({
    mutationFn: (payload: { url: string; tagId: string; title?: string; description?: string }) =>
      createStash(payload),
    onSuccess: (stash) => {
      queryClient.setQueryData<Stash[]>(stashQueryKeys.stashes, (current = []) => [
        stash,
        ...current
      ]);
      setUrlInput("");
      toast.success("Stashed!");
    },
    onError: (error: MutationError) => {
      toast.error(error.message);
    }
  });

  const updateStashMutation = useMutation({
    mutationFn: (payload: {
      stashId: string;
      tagId: string;
      url: string;
      title?: string;
      description?: string;
    }) => updateStash(payload),
    onSuccess: (updatedStash) => {
      queryClient.setQueryData<Stash[]>(stashQueryKeys.stashes, (current = []) =>
        current.map((stash) => (stash.id === updatedStash.id ? updatedStash : stash))
      );
      setStashEditor(null);
      setDrawerStash(null);
      toast.success("Stash updated.");
    },
    onError: (error: MutationError) => {
      toast.error(error.message);
    }
  });
  const setStashArchivedMutation = useMutation({
    mutationFn: ({ stashId, action }: { stashId: string; action: "archive" | "restore" }) =>
      setStashArchived(stashId, action),
    onSuccess: (updatedStash, { action }) => {
      queryClient.setQueryData<Stash[]>(stashQueryKeys.stashes, (current = []) =>
        current.map((stash) => (stash.id === updatedStash.id ? updatedStash : stash))
      );

      if (action === "archive") {
        const store = useStashStore.getState();
        if (store.previewStash?.id === updatedStash.id) store.setPreviewStash(null);
        if (store.drawerStash?.id === updatedStash.id) store.setDrawerStash(null);
        if (store.stashEditor?.stashId === updatedStash.id) store.setStashEditor(null);
        store.setFocusedStashIndex(-1);
      }

      toast.success(action === "archive" ? "Stash archived." : "Stash restored.");
    },
    onError: (error: MutationError) => {
      toast.error(error.message);
    }
  });

  const deleteStashMutation = useMutation({
    mutationFn: (stashId: string) => deleteStash(stashId),
    onSuccess: (_, stashId) => {
      queryClient.setQueryData<Stash[]>(stashQueryKeys.stashes, (current = []) =>
        current.filter((stash) => stash.id !== stashId)
      );
      const store = useStashStore.getState();
      if (store.previewStash?.id === stashId) store.setPreviewStash(null);
      if (store.drawerStash?.id === stashId) store.setDrawerStash(null);
      if (store.stashEditor?.stashId === stashId) store.setStashEditor(null);
      store.setFocusedStashIndex(-1);
      toast.success("Stash removed.");
    },
    onError: (error: MutationError) => {
      toast.error(error.message);
    }
  });

  return {
    createTagMutation,
    updateTagMutation,
    setTagArchivedMutation,
    deleteTagMutation,
    createStashMutation,
    updateStashMutation,
    setStashArchivedMutation,
    deleteStashMutation
  };
}
