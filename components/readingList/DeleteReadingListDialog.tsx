"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { ReadingListItem } from "@/lib/stash-client";
import { getHostname } from "@/lib/link-utils";

interface DeleteReadingListDialogProps {
  item: ReadingListItem | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteReadingListDialog({
  item,
  isPending,
  onOpenChange,
  onConfirm
}: DeleteReadingListDialogProps) {
  const title = item ? item.title?.trim() || item.hostname || getHostname(item.url) : "this item";

  return (
    <Dialog open={item !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] gap-0 overflow-y-auto overscroll-contain rounded-xl p-0 sm:max-h-[calc(100dvh-2rem)] sm:max-w-md">
        <DialogHeader className="px-5 pt-6 pb-2 sm:px-6">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Remove from reading list
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm wrap-break-word">
            Are you sure you want to remove &ldquo;{title}&rdquo;?
          </DialogDescription>
        </DialogHeader>
        <div className="px-5 pt-2 pb-6 sm:px-6">
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              className="h-11 sm:h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={onConfirm}
              className="h-11 sm:h-9"
            >
              {isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
