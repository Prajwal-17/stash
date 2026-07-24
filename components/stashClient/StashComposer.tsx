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
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
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
    if (event.key === "Enter") {
      void handleSave();
    }
  }

  return (
    <div className="w-full">
      <AnimatePresence>
        {notice ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={cn(
              "mb-3 rounded-lg border px-3 py-2 text-sm wrap-break-word",
              notice.type === "error"
                ? "border-red-500/20 bg-red-500/10 text-red-200"
                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
            )}
          >
            {notice.message}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="border-border/30 bg-muted/15 focus-within:border-primary/50 focus-within:ring-primary/15 flex w-full items-center gap-2 rounded-xl border p-1.5 transition-all focus-within:ring-4">
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
          placeholder="Paste link to stash... (Ctrl/⌘K)"
          disabled={isCreateStashPending || isFetchingMetadata || showTagErrorState}
          className="text-foreground placeholder:text-muted-foreground/40 h-10 min-w-0 flex-1 border-0 bg-transparent px-3 py-1.5 shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 shrink-0 rounded-lg px-4 font-semibold shadow-sm transition-all"
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
