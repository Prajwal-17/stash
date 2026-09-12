"use client";

import { QueryStatus } from "@/components/shared/QueryStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStashActions } from "@/hooks/useStashActions";
import { useStashQueries } from "@/hooks/useStashQueries";
import { cn } from "@/lib/utils";
import { useStashStore } from "@/store/stashStore";
import { AnimatePresence, motion } from "motion/react";
import { KeyboardEvent as ReactKeyboardEvent, useEffect, useRef } from "react";
import { LuLoaderCircle } from "react-icons/lu";

export function StashComposer() {
  const inputRef = useRef<HTMLInputElement>(null);

  const urlInput = useStashStore((s) => s.urlInput);
  const setUrlInput = useStashStore((s) => s.setUrlInput);
  const notice = useStashStore((s) => s.notice);
  const setNotice = useStashStore((s) => s.setNotice);

  const { tagsQuery, tags } = useStashQueries();

  const {
    handleSave,
    isFetchingMetadata,
    isCreateStashPending,
    isTagMutationPending,
    isStashMutationPending
  } = useStashActions();

  const showTagErrorState = tagsQuery.isError && !tags.length;
  const isSyncing = isTagMutationPending || isStashMutationPending;

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "k" &&
        (e.metaKey || e.ctrlKey) &&
        !document.querySelector("[role='dialog'][data-state='open'], [role='menu']")
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const activeEl = document.activeElement;
      if (document.querySelector("[role='dialog'][data-state='open'], [role='menu']")) return;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.getAttribute("contenteditable") === "true")
      ) {
        return;
      }

      const pastedText = e.clipboardData?.getData("text");
      if (pastedText) {
        e.preventDefault();
        setUrlInput(pastedText);
        setNotice(null);
        inputRef.current?.focus();
      }
    };

    document.addEventListener("paste", handleGlobalPaste);
    return () => document.removeEventListener("paste", handleGlobalPaste);
  }, [setUrlInput, setNotice]);

  function handleComposerKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (
      event.key === "Enter" &&
      !event.nativeEvent.isComposing &&
      !isCreateStashPending &&
      !isFetchingMetadata &&
      !showTagErrorState
    ) {
      event.preventDefault();
      void handleSave();
    }
  }

  return (
    <div className="w-full">
      <AnimatePresence>
        {notice ? (
          <motion.div
            role={notice.type === "error" ? "alert" : "status"}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={cn(
              "mb-3 rounded-lg border px-3 py-2 text-sm wrap-break-word",
              notice.type === "error"
                ? "border-destructive/25 bg-destructive/10 text-destructive"
                : "border-primary/25 bg-primary/10 text-foreground"
            )}
          >
            {notice.message}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="border-border bg-card focus-within:border-primary/60 focus-within:ring-primary/15 flex w-full items-center gap-1 rounded-xl border p-1.5 shadow-sm transition-[border-color,box-shadow] focus-within:ring-4 sm:gap-2">
        <Input
          ref={inputRef}
          value={urlInput}
          onChange={(event) => {
            setUrlInput(event.target.value);
            if (notice) {
              setNotice(null);
            }
          }}
          onKeyDown={handleComposerKeyDown}
          aria-label="URL to stash"
          aria-keyshortcuts="Control+k Meta+k"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Paste a link to stash…"
          disabled={isCreateStashPending || isFetchingMetadata || showTagErrorState}
          className="text-foreground placeholder:text-muted-foreground h-11 min-w-0 flex-1 border-0 bg-transparent px-2 py-1.5 text-base shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:px-3 sm:text-sm dark:bg-transparent"
        />
        <kbd className="text-muted-foreground hidden shrink-0 px-1 text-xs sm:inline">Ctrl/⌘ K</kbd>
        <Button
          type="button"
          className="h-11 shrink-0 rounded-lg px-3 font-semibold sm:px-4"
          disabled={
            isCreateStashPending || isFetchingMetadata || !urlInput.trim() || showTagErrorState
          }
          onClick={() => void handleSave()}
        >
          {isFetchingMetadata ? "Snagging..." : isCreateStashPending ? "Storing..." : "Stash"}
        </Button>
      </div>

      {isSyncing && !isCreateStashPending ? (
        <div className="mt-3">
          <QueryStatus compact>
            <span className="inline-flex items-center gap-2">
              <LuLoaderCircle size={12} className="animate-spin" />
              Updating your stash...
            </span>
          </QueryStatus>
        </div>
      ) : null}
    </div>
  );
}
