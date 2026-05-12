"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStashActions } from "@/hooks/useStashActions";
import { useStashStore } from "@/store/stashStore";

export function DeleteConfirmationDialog() {
  const confirmation = useStashStore((s) => s.confirmation);
  const setConfirmation = useStashStore((s) => s.setConfirmation);

  const { handleDeleteConfirmation, isDeleteStashPending, isDeleteTagPending } =
    useStashActions();

  const isOpen = confirmation !== null;
  const isDeleting = isDeleteStashPending || isDeleteTagPending;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) setConfirmation(null);
      }}
    >
      <DialogContent className="w-[95vw] gap-0 overflow-hidden rounded-xl p-0 sm:max-w-md">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {confirmation?.title ?? "Confirm"}
          </DialogTitle>
          {confirmation?.description ? (
            <DialogDescription className="text-muted-foreground text-sm">
              {confirmation.description}
            </DialogDescription>
          ) : (
            <DialogDescription className="sr-only">
              Confirm this action
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="px-6 pt-2 pb-6">
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmation(null)}
              disabled={isDeleting}
              className="h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => void handleDeleteConfirmation()}
              className="h-9"
            >
              {isDeleting
                ? "Removing..."
                : (confirmation?.confirmLabel ?? "Delete")}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
