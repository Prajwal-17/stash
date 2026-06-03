"use client";

import { EditStashDialog } from "@/components/stashClient/EditStashDialog";
import { StashActionDrawer } from "@/components/stashClient/StashActionDrawer";
import { StashComposer } from "@/components/stashClient/StashComposer";
import { StashList } from "@/components/stashClient/StashList";
import { StashSearchResults } from "@/components/stashClient/StashSearchResults";
import { TagEditorDialog } from "@/components/stashClient/TagEditorDialog";
import { useStashActions } from "@/hooks/useStashActions";
import { getDefaultTagId, Stash, Tag } from "@/lib/stash-client";
import { useStashStore } from "@/store/stashStore";
import { useEffect, useRef } from "react";
import { Toaster } from "react-hot-toast";
import { DeleteConfirmationDialog } from "./stashClient/DeleteConfirmationDialog";
import { StashMobileNav } from "./stashClient/StashMobileNav";
import { StashSidebar } from "./stashClient/StashSidebar";
import { TagsPage } from "./stashClient/TagsPage";

interface StashShellProps {
  initialStashes: Stash[];
  initialTags: Tag[];
  userEmail: string;
  userInitial: string;
  userName: string;
}

export function StashShell({
  initialStashes,
  initialTags,
  userEmail,
  userInitial,
  userName
}: StashShellProps) {
  const hydratedRef = useRef<boolean>(null);
  const isSearchOpen = useStashStore((s) => s.isSearchOpen);
  const setIsSearchOpen = useStashStore((s) => s.setIsSearchOpen);
  const isTagsPageOpen = useStashStore((s) => s.isTagsPageOpen);

  // Global Ctrl+F / Cmd+F shortcut to open and focus search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "f" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsSearchOpen(true);
        // Focus the search input if it is already mounted, or let autoFocus handle it
        const searchInput = document.querySelector(
          'input[placeholder*="Search stashes"]'
        ) as HTMLInputElement | null;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
    };
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [setIsSearchOpen]);

  // Hydrate store once with SSR data (React 19 null-check pattern)
  if (hydratedRef.current === null) {
    const store = useStashStore.getState();
    store.setInitialData({ stashes: initialStashes, tags: initialTags });
    store.setUserInfo({
      email: userEmail,
      initial: userInitial,
      name: userName
    });

    const defaultTagId = getDefaultTagId(initialTags);
    store.setActiveTagId(defaultTagId);
    store.setComposerTagId(defaultTagId);

    hydratedRef.current = true;
  }

  return (
    <div className="bg-background text-foreground flex h-dvh w-full justify-center overflow-hidden">
      <div className="flex w-full max-w-230">
        <div className="border-border/40 hidden w-60 shrink-0 border-r md:block">
          <StashSidebar
            initialTags={initialTags}
            userEmail={userEmail}
            userInitial={userInitial}
            userName={userName}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden pb-[env(safe-area-inset-bottom)] md:pb-0">
          {isSearchOpen ? <StashSearchResults /> : isTagsPageOpen ? <TagsPage /> : <StashList />}

          <div className="mx-auto w-full max-w-2xl px-3 pb-[calc(env(safe-area-inset-bottom)+68px)] sm:px-6 md:pb-[calc(env(safe-area-inset-bottom)+12px)]">
            <StashComposer />
          </div>
        </div>
      </div>

      <div className="fixed right-0 bottom-0 left-0 z-50 md:hidden">
        <StashMobileNav
          initialTags={initialTags}
          userEmail={userEmail}
          userInitial={userInitial}
          userName={userName}
        />
      </div>

      <StashDialogs />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "hsl(35 10% 11%)",
            color: "hsl(35 20% 93%)",
            border: "1px solid hsl(35 10% 20%)"
          }
        }}
      />
    </div>
  );
}

function StashDialogs() {
  const tagEditor = useStashStore((s) => s.tagEditor);
  const setTagEditor = useStashStore((s) => s.setTagEditor);
  const { submitTagEditor, isCreateTagPending, isUpdateTagPending } = useStashActions();

  return (
    <>
      <TagEditorDialog
        editorState={tagEditor}
        onOpenChange={(open) => {
          if (!open) setTagEditor(null);
        }}
        onChangeName={(name) => setTagEditor(tagEditor ? { ...tagEditor, name } : null)}
        onSubmit={submitTagEditor}
        isPending={isCreateTagPending || isUpdateTagPending}
      />

      <EditStashDialog />
      <DeleteConfirmationDialog />
      <StashActionDrawer />
    </>
  );
}
