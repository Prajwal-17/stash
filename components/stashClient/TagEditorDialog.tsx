"use client";

import { TagEditorState } from "@/components/stashClient/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  isPending,
}: TagEditorDialogProps) {
  const isOpen = editorState !== null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] gap-0 overflow-hidden rounded-xl p-0 sm:max-w-md">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {editorState?.mode === "create" ? "Create tag" : "Edit tag"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="px-6 pt-2 pb-6">
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-muted-foreground text-sm font-medium">
                  Name
                </label>
                {editorState?.name && editorState.name.length >= 80 && (
                  <span className="text-destructive animate-in fade-in zoom-in slide-in-from-top-1 text-xs">
                    Length limit reached
                  </span>
                )}
              </div>
              <Input
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
                className="h-9"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="h-9">
                {isPending ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
