"use client";

import type { TagEditorState } from "@/store/stash-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
      <DialogContent className="gap-0 p-0 sm:max-w-md">
        <DialogHeader className="px-5 pt-5 pb-2">
          <DialogTitle className="text-base font-semibold tracking-tight">
            {editorState?.mode === "create" ? "Create tag" : "Edit tag"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Choose a name to organize your stashes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="px-5 pt-2 pb-5">
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="tag-name" className="text-muted-foreground text-sm font-medium">
                  Name
                </label>
                {editorState?.name && editorState.name.length >= 80 && (
                  <span className="text-muted-foreground text-xs" role="status">
                    Length limit reached
                  </span>
                )}
              </div>
              <Input
                id="tag-name"
                value={editorState?.name ?? ""}
                onChange={(e) => onChangeName(e.target.value)}
                placeholder="e.g. Reading"
                maxLength={80}
                className="h-10 w-full sm:h-9"
              />
            </div>
            <DialogFooter className="gap-2 pt-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="h-10 sm:h-9"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="h-10 sm:h-9">
                {isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
