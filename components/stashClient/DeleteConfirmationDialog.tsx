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
import { useStashActions } from "@/hooks/useStashActions";
import { useStashStore } from "@/store/stashStore";

export function DeleteConfirmationDialog() {
  const confirmation = useStashStore((s) => s.confirmation);
  const setConfirmation = useStashStore((s) => s.setConfirmation);

  const { handleDeleteConfirmation, isDeleteStashPending, isDeleteTagPending } = useStashActions();

  const isOpen = confirmation !== null;
  const isDeleting = isDeleteStashPending || isDeleteTagPending;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isDeleting) setConfirmation(null);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] gap-0 overflow-y-auto overscroll-contain rounded-xl p-0 sm:max-h-[calc(100dvh-2rem)] sm:max-w-md">
        <DialogHeader className="px-5 pt-6 pb-2 sm:px-6">
          <DialogTitle className="pr-5 text-xl font-semibold tracking-tight wrap-break-word">
            {confirmation?.title ?? "Confirm"}
          </DialogTitle>
          {confirmation?.description ? (
            <DialogDescription className="text-muted-foreground text-sm wrap-break-word">
              {confirmation.description}
            </DialogDescription>
          ) : (
            <DialogDescription className="sr-only">Confirm this action</DialogDescription>
          )}
        </DialogHeader>

        <div className="px-5 pt-2 pb-6 sm:px-6">
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmation(null)}
              disabled={isDeleting}
              className="h-11 sm:h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => void handleDeleteConfirmation()}
              className="h-11 sm:h-9"
            >
              {isDeleting ? "Removing..." : (confirmation?.confirmLabel ?? "Delete")}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
