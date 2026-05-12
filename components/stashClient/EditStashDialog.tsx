"use client";

import { FieldLabel } from "@/components/stashClient/ui";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useStashActions } from "@/hooks/useStashActions";
import { useStashQueries } from "@/hooks/useStashQueries";
import { getTagLabel } from "@/lib/stash-client";
import { cn } from "@/lib/utils";
import { useStashStore } from "@/store/stashStore";
import { useState } from "react";
import { LuCheck, LuChevronsUpDown } from "react-icons/lu";

export function EditStashDialog() {
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);

  const stashEditor = useStashStore((s) => s.stashEditor);
  const setStashEditor = useStashStore((s) => s.setStashEditor);

  const { tags } = useStashQueries();
  const { submitStashEditor, isUpdateStashPending } = useStashActions();

  const isOpen = stashEditor !== null;
  const selectedTag = tags.find((t) => t.id === stashEditor?.tagId);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) setStashEditor(null);
      }}
    >
      <DialogContent className="w-[95vw] gap-0 overflow-hidden rounded-xl p-0 sm:max-w-lg">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Edit stash
          </DialogTitle>
          <DialogDescription className="sr-only">
            Edit the details of this stash.
          </DialogDescription>
        </DialogHeader>

        <form
          className="px-6 pt-2 pb-6"
          onSubmit={(event) => void submitStashEditor(event)}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <FieldLabel>URL</FieldLabel>
              <Input
                autoFocus
                value={stashEditor?.url ?? ""}
                onChange={(event) =>
                  setStashEditor(
                    stashEditor
                      ? { ...stashEditor, url: event.target.value }
                      : null,
                  )
                }
                className="border-border bg-muted text-foreground placeholder:text-muted-foreground focus:border-ring h-12 w-full rounded-lg border px-4 text-sm"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel>Title</FieldLabel>
                <Input
                  value={stashEditor?.title ?? ""}
                  onChange={(event) =>
                    setStashEditor(
                      stashEditor
                        ? { ...stashEditor, title: event.target.value }
                        : null,
                    )
                  }
                  className="border-border bg-muted text-foreground placeholder:text-muted-foreground focus:border-ring h-12 w-full rounded-lg border px-4 text-sm"
                />
              </div>

              <div className="space-y-2">
                <FieldLabel>Tag</FieldLabel>
                <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "border-border bg-muted text-foreground flex h-12 w-full items-center justify-between rounded-lg border px-4 text-sm",
                        !selectedTag && "text-muted-foreground",
                      )}
                    >
                      <span className="truncate">
                        {selectedTag
                          ? getTagLabel(selectedTag)
                          : "Select a tag"}
                      </span>
                      <LuChevronsUpDown
                        size={14}
                        className="text-muted-foreground shrink-0"
                      />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] rounded-md p-0">
                    <Command>
                      <CommandInput placeholder="Search tags..." />
                      <CommandList className="max-h-45 overflow-y-auto">
                        <CommandEmpty>No tags found.</CommandEmpty>
                        <CommandGroup>
                          {tags.map((tag) => {
                            const label = getTagLabel(tag);
                            const isSelected = tag.id === stashEditor?.tagId;
                            return (
                              <CommandItem
                                key={tag.id}
                                value={label}
                                onSelect={() => {
                                  setStashEditor(
                                    stashEditor
                                      ? {
                                          ...stashEditor,
                                          tagId: tag.id,
                                        }
                                      : null,
                                  );
                                  setTagPopoverOpen(false);
                                }}
                                className="flex justify-between"
                              >
                                <span className="truncate">{label}</span>
                                {isSelected ? (
                                  <LuCheck
                                    size={14}
                                    className="text-foreground shrink-0"
                                  />
                                ) : null}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <FieldLabel>Description</FieldLabel>
              <Textarea
                value={stashEditor?.description ?? ""}
                onChange={(event) =>
                  setStashEditor(
                    stashEditor
                      ? { ...stashEditor, description: event.target.value }
                      : null,
                  )
                }
                className="border-border bg-muted text-foreground placeholder:text-muted-foreground focus:border-ring min-h-28 w-full rounded-lg border px-4 py-3 text-sm"
              />
            </div>

            <DialogFooter className="gap-2 pt-2 sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStashEditor(null)}
                disabled={isUpdateStashPending}
                className="h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUpdateStashPending}
                className="h-9"
              >
                {isUpdateStashPending ? "Stashing..." : "Update stash"}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
