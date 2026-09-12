"use client";

import { ArchiveView } from "@/components/stashClient/ArchiveView";
import { EditStashDialog } from "@/components/stashClient/EditStashDialog";
import { StashActionDrawer } from "@/components/stashClient/StashActionDrawer";
import { StashComposer } from "@/components/stashClient/StashComposer";
import { StashList } from "@/components/stashClient/StashList";
import { StashSearchResults } from "@/components/stashClient/StashSearchResults";
import { TagEditorDialog } from "@/components/stashClient/TagEditorDialog";
import { ReadingListView } from "@/components/readingList/ReadingListView";
import { useStashActions } from "@/hooks/useStashActions";
import { getDefaultTagId, Stash, Tag } from "@/lib/stash-client";
import { useStashStore } from "@/store/stashStore";
import { useEffect, useRef } from "react";
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
  const activeView = useStashStore((s) => s.activeView);
  const setActiveView = useStashStore((s) => s.setActiveView);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "f" && (e.ctrlKey || e.metaKey)) {
        if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
        e.preventDefault();
        setActiveView("search");
        window.requestAnimationFrame(() => {
          const searchInput = document.querySelector<HTMLInputElement>("[data-stash-search-input]");
          searchInput?.focus();
          searchInput?.select();
        });
      }
    };
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [setActiveView]);

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
    <div className="bg-background text-foreground flex h-dvh w-full flex-col items-center overflow-hidden pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)]">
      <div className="border-border flex min-h-0 w-full max-w-6xl flex-1 md:border-x">
        <div className="border-border hidden w-56 shrink-0 border-r md:block lg:w-64">
          <StashSidebar
            initialTags={initialTags}
            userEmail={userEmail}
            userInitial={userInitial}
            userName={userName}
          />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {activeView === "archive" && <ArchiveView />}
          {activeView === "search" && <StashSearchResults />}
          {activeView === "tags" && <TagsPage />}
          {activeView === "reading-list" && <ReadingListView />}
          {activeView === "stash" && <StashList />}

          {activeView !== "reading-list" && activeView !== "archive" && (
            <div className="border-border bg-background mx-auto w-full max-w-3xl shrink-0 border-t px-4 py-3 sm:px-6 lg:px-8">
              <StashComposer />
            </div>
          )}
        </div>
      </div>

      <div className="relative z-20 w-full shrink-0 md:hidden">
        <StashMobileNav
          initialTags={initialTags}
          userEmail={userEmail}
          userInitial={userInitial}
          userName={userName}
        />
      </div>

      <StashDialogs />
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
