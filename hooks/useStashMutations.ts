import {
  Stash,
  createStash,
  createTag,
  deleteStash,
  deleteTag,
  MutationError,
  stashQueryKeys,
  Tag,
  updateStash,
  updateTag,
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
  const setNotice = useStashStore((s) => s.setNotice);

  const createTagMutation = useMutation({
    mutationFn: (name: string) => createTag(name),
    onSuccess: (tag) => {
      queryClient.setQueryData<Tag[]>(stashQueryKeys.tags, (current = []) => [
        ...current,
        tag,
      ]);
      setActiveTagId(tag.id);
      setComposerTagId(tag.id);
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
      queryClient.setQueryData<Stash[]>(
        stashQueryKeys.stashes,
        (current = []) =>
          current.filter((stash) => stash.tagId !== tagId),
      );
      // Reset active/composer tag if the deleted tag was selected
      const store = useStashStore.getState();
      if (store.activeTagId === tagId) setActiveTagId(null);
      if (store.composerTagId === tagId) setComposerTagId(null);
      setNotice({ type: "success", message: "Tag deleted." });
    },
    onError: (error: MutationError) => {
      setNotice({ type: "error", message: error.message });
    },
  });

  const createStashMutation = useMutation({
    mutationFn: (payload: {
      url: string;
      tagId: string;
      title?: string;
      description?: string;
    }) => createStash(payload),
    onSuccess: (stash) => {
      queryClient.setQueryData<Stash[]>(
        stashQueryKeys.stashes,
        (current = []) => [stash, ...current],
      );
      setUrlInput("");
      toast.success("Stashed!");
    },
    onError: (error: MutationError) => {
      toast.error(error.message);
    },
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
      queryClient.setQueryData<Stash[]>(
        stashQueryKeys.stashes,
        (current = []) =>
          current.map((stash) =>
            stash.id === updatedStash.id ? updatedStash : stash,
          ),
      );
      setStashEditor(null);
      setDrawerStash(null);
      toast.success("Stash updated.");
    },
    onError: (error: MutationError) => {
      toast.error(error.message);
    },
  });

  const deleteStashMutation = useMutation({
    mutationFn: (stashId: string) => deleteStash(stashId),
    onSuccess: (_, stashId) => {
      queryClient.setQueryData<Stash[]>(
        stashQueryKeys.stashes,
        (current = []) =>
          current.filter((stash) => stash.id !== stashId),
      );
      setDrawerStash(null);
      toast.success("Stash removed.");
    },
    onError: (error: MutationError) => {
      toast.error(error.message);
    },
  });

  return {
    createTagMutation,
    updateTagMutation,
    deleteTagMutation,
    createStashMutation,
    updateStashMutation,
    deleteStashMutation,
  };
}
