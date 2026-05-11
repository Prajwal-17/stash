"use client";

import { QueryStatus } from "@/components/bookmark-client/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { LuLoaderCircle } from "react-icons/lu";

interface BookmarkComposerProps {
  urlInput: string;
  setUrlInput: (val: string) => void;
  handleComposerKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleSave: () => void;
  isPending: boolean;
  isSyncing: boolean;
  showTagErrorState: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  notice: { type: "error" | "success"; message: string } | null;
  setNotice: (notice: null) => void;
}

export function BookmarkComposer({
  urlInput,
  setUrlInput,
  handleComposerKeyDown,
  handleSave,
  isPending,
  isSyncing,
  showTagErrorState,
  inputRef,
  notice,
  setNotice,
}: BookmarkComposerProps) {
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
            placeholder="Paste a link..."
            disabled={isPending || showTagErrorState}
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
          disabled={isPending || !urlInput.trim() || showTagErrorState}
          onClick={() => void handleSave()}
        >
          {isPending ? "Adding..." : "+ Add"}
        </Button>
      </div>

      {isSyncing && !isPending ? (
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
