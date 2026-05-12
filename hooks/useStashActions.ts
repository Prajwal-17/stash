"use client";

import { ConfirmationState } from "@/components/stashClient/types";
import { useStashMutations } from "@/hooks/useStashMutations";
import { useStashQueries } from "@/hooks/useStashQueries";
import { authClient } from "@/lib/auth-client";
import {
  Stash,
  getDefaultTagId,
  normalizeUrl,
  validateTagName,
} from "@/lib/stash-client";
import { useStashStore } from "@/store/stashStore";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "react-hot-toast";

export function useStashActions() {
  const router = useRouter();
  const store = useStashStore();
  const { tags } = useStashQueries();
  const {
    createTagMutation,
    updateTagMutation,
    deleteTagMutation,
    createStashMutation,
    updateStashMutation,
    deleteStashMutation,
  } = useStashMutations();

  const resolvedComposerTagId =
    store.composerTagId && tags.some((tag) => tag.id === store.composerTagId)
      ? store.composerTagId
      : getDefaultTagId(tags);

  async function ensureInboxTag() {
    const existingInbox = tags.find(
      (tag) => tag.name?.trim().toLowerCase() === "inbox",
    );
    if (existingInbox) {
      return existingInbox.id;
    }
    const created = await createTagMutation.mutateAsync("Inbox");
    return created.id;
  }

  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);

  async function handleSave() {
    const validation = normalizeUrl(store.urlInput);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    setIsFetchingMetadata(true);
    let title = undefined;
    let description = undefined;
    
    try {
      const res = await fetch(`/api/metadata?url=${encodeURIComponent(validation.value)}`);
      if (res.ok) {
        const metadata = await res.json();
        title = metadata.title || undefined;
        description = metadata.description || undefined;
      }
    } catch (e) {
      // Ignore error and proceed without metadata
    } finally {
      setIsFetchingMetadata(false);
    }

    const targetTagId = resolvedComposerTagId ?? (await ensureInboxTag());
    await createStashMutation.mutateAsync({
      tagId: targetTagId,
      url: validation.value,
      title,
      description,
    });
  }

  async function handleLogout() {
    if (store.isLoggingOut) return;
    store.setIsLoggingOut(true);
    try {
      await authClient.signOut();
      router.replace("/auth/login");
    } catch {
      store.setNotice({
        type: "error",
        message: "Logout failed. Please try again.",
      });
      store.setIsLoggingOut(false);
    }
  }

  async function copyText(value: string, stashId: string) {
    try {
      await navigator.clipboard.writeText(value);
      store.setCopiedStashId(stashId);
      window.setTimeout(() => store.setCopiedStashId(null), 1200);
    } catch {
      store.setNotice({ type: "error", message: "Clipboard write failed." });
    }
  }

  function openStashEditor(stash: Stash) {
    store.setDrawerStash(null);
    store.setStashEditor({
      stashId: stash.id,
      url: stash.url,
      title: stash.title ?? "",
      description: stash.description ?? "",
      tagId: stash.tagId,
    });
  }

  function openDeleteConfirmation(confirmationState: ConfirmationState) {
    store.setDrawerStash(null);
    store.setConfirmation(confirmationState);
  }

  async function submitStashEditor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const editor = store.stashEditor;
    if (!editor) return;

    const validation = normalizeUrl(editor.url);
    if (!validation.valid) {
      store.setNotice({ type: "error", message: validation.message });
      return;
    }

    await updateStashMutation.mutateAsync({
      stashId: editor.stashId,
      tagId: editor.tagId,
      url: validation.value,
      title: editor.title.trim() || undefined,
      description: editor.description.trim() || undefined,
    });
  }

  async function submitTagEditor(event: FormEvent) {
    event.preventDefault();
    const editor = store.tagEditor;
    if (!editor) return;

    const validation = validateTagName(editor.name);
    if (!validation.valid) {
      store.setNotice({ type: "error", message: validation.message });
      return;
    }

    if (editor.mode === "create") {
      await createTagMutation.mutateAsync(validation.value);
    } else if (editor.tagId) {
      await updateTagMutation.mutateAsync({
        tagId: editor.tagId,
        name: validation.value,
      });
    }

    store.setTagEditor(null);
  }

  async function handleDeleteConfirmation() {
    const conf = store.confirmation;
    if (!conf) return;

    if (conf.kind === "stash") {
      await deleteStashMutation.mutateAsync(conf.id);
    } else {
      await deleteTagMutation.mutateAsync(conf.id);
    }
    store.setConfirmation(null);
  }

  return {
    handleSave,
    handleLogout,
    copyText,
    openStashEditor,
    openDeleteConfirmation,
    submitStashEditor,
    submitTagEditor,
    handleDeleteConfirmation,
    isFetchingMetadata,
    // Expose mutation states for loading indicators
    isCreateStashPending: createStashMutation.isPending,
    isUpdateStashPending: updateStashMutation.isPending,
    isDeleteStashPending: deleteStashMutation.isPending,
    isCreateTagPending: createTagMutation.isPending,
    isUpdateTagPending: updateTagMutation.isPending,
    isDeleteTagPending: deleteTagMutation.isPending,
    isTagMutationPending:
      createTagMutation.isPending ||
      updateTagMutation.isPending ||
      deleteTagMutation.isPending,
    isStashMutationPending:
      createStashMutation.isPending ||
      updateStashMutation.isPending ||
      deleteStashMutation.isPending,
  };
}
