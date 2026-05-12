"use client";

import { QueryStatus } from "@/components/stashClient/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
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
    isStashMutationPending,
  } = useStashActions();

  const showTagErrorState = tagsQuery.isError && !tags.length;
  const isSyncing = isTagMutationPending || isStashMutationPending;

  // ⌘+K shortcut to focus input
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
              "mb-3 rounded-lg border px-3 py-2 text-sm",
              notice.type === "error"
                ? "border-red-500/20 bg-red-500/10 text-red-200"
                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
            )}
          >
            {notice.message}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="flex w-full items-center gap-2">
        <div className="relative flex flex-1 items-center">
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
            placeholder="Paste link to stash..."
            disabled={isCreateStashPending || isFetchingMetadata || showTagErrorState}
            className="border-border text-foreground placeholder:text-muted-foreground focus:border-ring h-12 flex-1 rounded-lg bg-transparent px-4 pr-32"
          />
          <div className="pointer-events-none absolute right-3 hidden items-center gap-1.5 sm:flex">
            <Kbd>
              <span className="text-[10px]">⌘</span>K
            </Kbd>
            <span className="text-muted-foreground/60 text-[10px] font-medium">
              to focus
            </span>
            <div className="bg-border mx-1 h-3 w-px" />
            <Kbd className="px-2">↵</Kbd>
            <span className="text-muted-foreground/60 text-[10px] font-medium">
              to add
            </span>
          </div>
        </div>

        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 shrink-0 rounded-lg px-5 font-semibold"
          disabled={
            isCreateStashPending || isFetchingMetadata || !urlInput.trim() || showTagErrorState
          }
          onClick={() => void handleSave()}
        >
          {isFetchingMetadata ? "Fetching..." : isCreateStashPending ? "Stashing..." : "+ Stash"}
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
