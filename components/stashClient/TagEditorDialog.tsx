"use client";

import type { TagEditorState } from "@/store/stash-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormEvent } from "react";

export interface TagEditorDialogProps {
  editorState: TagEditorState | null;
  onOpenChange: (open: boolean) => void;
  onChangeName: (name: string) => void;
  onSubmit: (e: FormEvent) => void | Promise<void>;
  isPending: boolean;
}

export function TagEditorDialog({
  editorState,
  onOpenChange,
  onChangeName,
  onSubmit,
  isPending
}: TagEditorDialogProps) {
  const isOpen = editorState !== null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isPending) onOpenChange(open);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] gap-0 overflow-y-auto overscroll-contain rounded-xl p-0 sm:max-h-[calc(100dvh-2rem)] sm:max-w-md">
        <DialogHeader className="px-5 pt-6 pb-2 sm:px-6">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {editorState?.mode === "create" ? "Create tag" : "Edit tag"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="px-5 pt-2 pb-6 sm:px-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="tag-name" className="text-muted-foreground text-sm font-medium">
                  Name
                </label>
                {editorState?.name && editorState.name.length >= 80 && (
                  <span className="text-destructive animate-in fade-in zoom-in slide-in-from-top-1 text-xs">
                    Length limit reached
                  </span>
                )}
              </div>
              <Input
                id="tag-name"
                autoFocus
                value={editorState?.name ?? ""}
                onChange={(e) => onChangeName(e.target.value)}
                placeholder="e.g. Reading"
                maxLength={80}
                className="my-2 h-10 w-full"
              />
            </div>
            <DialogFooter className="gap-2 pt-2 sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="h-11 sm:h-9"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="h-11 sm:h-9">
                {isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
