"use client";

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
  const activeView = useStashStore((s) => s.activeView);
  const setActiveView = useStashStore((s) => s.setActiveView);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "f" && (e.ctrlKey || e.metaKey)) {
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
    <div className="bg-background text-foreground flex h-dvh min-h-svh w-full justify-center overflow-hidden">
      <div className="flex min-h-0 w-full max-w-230">
        <div className="border-border/40 hidden w-60 shrink-0 border-r md:block">
          <StashSidebar
            initialTags={initialTags}
            userEmail={userEmail}
            userInitial={userInitial}
            userName={userName}
          />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {activeView === "search" && <StashSearchResults />}
          {activeView === "tags" && <TagsPage />}
          {activeView === "reading-list" && <ReadingListView />}
          {activeView === "stash" && <StashList />}

          {activeView !== "reading-list" && (
            <div className="mx-auto w-full max-w-2xl shrink-0 px-3 pt-2 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:px-6 md:pb-3">
              <StashComposer />
            </div>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 md:hidden">
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
