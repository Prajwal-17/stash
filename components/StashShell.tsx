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
import { useRef } from "react";
import { Toaster } from "react-hot-toast";
import { DeleteConfirmationDialog } from "./stashClient/DeleteConfirmationDialog";
import { StashNavbar } from "./stashClient/StashNavbar";

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
  userName,
}: StashShellProps) {
  const hydratedRef = useRef<boolean>(null);
  const isSearchOpen = useStashStore((s) => s.isSearchOpen);

  // Hydrate store once with SSR data (React 19 null-check pattern)
  if (hydratedRef.current === null) {
    const store = useStashStore.getState();
    store.setInitialData({ stashes: initialStashes, tags: initialTags });
    store.setUserInfo({
      email: userEmail,
      initial: userInitial,
      name: userName,
    });

    const defaultTagId = getDefaultTagId(initialTags);
    store.setActiveTagId(defaultTagId);
    store.setComposerTagId(defaultTagId);

    hydratedRef.current = true;
  }

  return (
    <div className="bg-background text-foreground flex h-dvh flex-col overflow-hidden">
      <div className="mx-auto w-full max-w-2xl px-3 pt-4 sm:px-5 sm:pt-8">
        <header className="mb-4">
          <StashNavbar
            initialTags={initialTags}
            initialStashes={initialStashes}
            userEmail={userEmail}
            userInitial={userInitial}
            userName={userName}
          />
        </header>
      </div>

      {isSearchOpen ? <StashSearchResults /> : <StashList />}

      <div className="mx-auto w-full max-w-2xl px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+12px)] sm:px-5">
        <StashComposer />
      </div>

      <StashDialogs />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#151515",
            color: "#f5f5f5",
            border: "1px solid rgba(255,255,255,0.12)",
          },
        }}
      />
    </div>
  );
}

function StashDialogs() {
  const tagEditor = useStashStore((s) => s.tagEditor);
  const setTagEditor = useStashStore((s) => s.setTagEditor);
  const { submitTagEditor, isCreateTagPending, isUpdateTagPending } =
    useStashActions();

  return (
    <>
      <TagEditorDialog
        editorState={tagEditor}
        onOpenChange={(open) => {
          if (!open) setTagEditor(null);
        }}
        onChangeName={(name) =>
          setTagEditor(tagEditor ? { ...tagEditor, name } : null)
        }
        onSubmit={submitTagEditor}
        isPending={isCreateTagPending || isUpdateTagPending}
      />

      <EditStashDialog />
      <DeleteConfirmationDialog />
      <StashActionDrawer />
    </>
  );
}
