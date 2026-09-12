"use client";

import { FieldLabel } from "@/components/shared/FieldLabel";
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
import { Textarea } from "@/components/ui/textarea";
import { normalizeUrl, ReadingListUpdatePayload } from "@/lib/stash-client";
import { FormEvent } from "react";
import toast from "react-hot-toast";

export interface ReadingListEditorState {
  id: string;
  url: string;
  title: string;
  description: string;
}

interface EditReadingListDialogProps {
  editor: ReadingListEditorState | null;
  onEditorChange: (editor: ReadingListEditorState | null) => void;
  onSubmit: (payload: ReadingListUpdatePayload) => Promise<void>;
  isPending: boolean;
}

export function EditReadingListDialog({
  editor,
  onEditorChange,
  onSubmit,
  isPending
}: EditReadingListDialogProps) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || isPending) return;

    const validation = normalizeUrl(editor.url);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    await onSubmit({
      id: editor.id,
      url: validation.value,
      title: editor.title.trim() || null,
      description: editor.description.trim() || null
    });
  }

  return (
    <Dialog
      open={editor !== null}
      onOpenChange={(open) => {
        if (!open && !isPending) onEditorChange(null);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] gap-0 overflow-y-auto overscroll-contain rounded-lg p-0 sm:max-h-[calc(100dvh-2rem)] sm:max-w-lg">
        <DialogHeader className="px-5 pt-5 pb-2">
          <DialogTitle className="pr-8 text-base font-semibold tracking-tight">
            Edit reading item
          </DialogTitle>
          <DialogDescription className="sr-only">
            Edit the link and details for this reading-list item.
          </DialogDescription>
        </DialogHeader>

        <form className="px-5 pt-2 pb-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <FieldLabel htmlFor="reading-item-url">URL</FieldLabel>
              <Input
                id="reading-item-url"
                inputMode="url"
                autoComplete="url"
                required
                disabled={isPending}
                value={editor?.url ?? ""}
                onChange={(event) =>
                  onEditorChange(editor ? { ...editor, url: event.target.value } : null)
                }
                className="border-input bg-muted/30 text-foreground placeholder:text-muted-foreground focus:border-ring h-10 w-full rounded-md border px-3 text-base sm:h-9 sm:text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <FieldLabel htmlFor="reading-item-title">Title</FieldLabel>
              <Input
                id="reading-item-title"
                disabled={isPending}
                value={editor?.title ?? ""}
                onChange={(event) =>
                  onEditorChange(editor ? { ...editor, title: event.target.value } : null)
                }
                placeholder="Use the website title"
                className="border-input bg-muted/30 text-foreground placeholder:text-muted-foreground focus:border-ring h-10 w-full rounded-md border px-3 text-base sm:h-9 sm:text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <FieldLabel htmlFor="reading-item-description">Description</FieldLabel>
              <Textarea
                id="reading-item-description"
                disabled={isPending}
                value={editor?.description ?? ""}
                onChange={(event) =>
                  onEditorChange(editor ? { ...editor, description: event.target.value } : null)
                }
                placeholder="Add a note or summary"
                className="border-input bg-muted/30 text-foreground placeholder:text-muted-foreground focus:border-ring min-h-24 w-full rounded-md border px-3 py-2 text-base sm:text-sm"
              />
            </div>

            <DialogFooter className="gap-2 pt-2 sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                onClick={() => onEditorChange(null)}
                className="h-10 sm:h-9"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="h-10 sm:h-9">
                {isPending ? "Updating..." : "Update item"}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
