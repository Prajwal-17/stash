"use client";

import { FieldLabel } from "@/components/shared/FieldLabel";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
        if (!open && !isUpdateStashPending) {
          setTagPopoverOpen(false);
          setStashEditor(null);
        }
      }}
    >
      <DialogContent
        className="gap-0 p-0 sm:max-w-lg"
        onCloseAutoFocus={() => setTagPopoverOpen(false)}
      >
        <DialogHeader className="px-5 pt-6 pb-2 sm:px-6">
          <DialogTitle className="text-xl font-semibold tracking-tight">Edit stash</DialogTitle>
          <DialogDescription className="sr-only">Edit the details of this stash.</DialogDescription>
        </DialogHeader>

        <form
          className="px-5 pt-2 pb-6 sm:px-6"
          onSubmit={(event) => void submitStashEditor(event)}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <FieldLabel htmlFor="stash-url">URL</FieldLabel>
              <Input
                id="stash-url"
                value={stashEditor?.url ?? ""}
                onChange={(event) =>
                  setStashEditor(stashEditor ? { ...stashEditor, url: event.target.value } : null)
                }
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="h-11 w-full"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="min-w-0 space-y-2">
                <FieldLabel htmlFor="stash-title">Title</FieldLabel>
                <Input
                  id="stash-title"
                  value={stashEditor?.title ?? ""}
                  onChange={(event) =>
                    setStashEditor(
                      stashEditor ? { ...stashEditor, title: event.target.value } : null
                    )
                  }
                  className="h-11 w-full"
                />
              </div>

              <div className="min-w-0 space-y-2">
                <FieldLabel id="stash-tag-label">Tag</FieldLabel>
                <select
                  aria-labelledby="stash-tag-label"
                  value={stashEditor?.tagId ?? ""}
                  onChange={(event) =>
                    setStashEditor(
                      stashEditor ? { ...stashEditor, tagId: event.target.value } : null
                    )
                  }
                  className="border-input bg-card text-foreground focus-visible:border-ring focus-visible:ring-ring/50 h-11 w-full min-w-0 rounded-md border px-3 text-base outline-none focus-visible:ring-2 sm:hidden"
                >
                  <option value="" disabled>
                    Select a tag
                  </option>
                  {tags.map((tag) => (
                    <option key={tag.id} value={tag.id}>
                      {getTagLabel(tag)}
                    </option>
                  ))}
                </select>
                <div className="hidden sm:block">
                  <Popover open={isOpen && tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        role="combobox"
                        aria-expanded={tagPopoverOpen}
                        aria-controls="stash-tag-options"
                        aria-haspopup="dialog"
                        aria-labelledby="stash-tag-label stash-tag-value"
                        className={cn(
                          "border-input bg-card text-foreground hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-ring/50 flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-md border px-3 text-sm outline-none focus-visible:ring-2",
                          !selectedTag && "text-muted-foreground"
                        )}
                      >
                        <span id="stash-tag-value" className="truncate">
                          {selectedTag ? getTagLabel(selectedTag) : "Select a tag"}
                        </span>
                        <LuChevronsUpDown size={14} className="text-muted-foreground shrink-0" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      id="stash-tag-options"
                      align="start"
                      className="w-(--radix-popover-trigger-width) p-0"
                    >
                      <Command label="Search tags">
                        <CommandInput placeholder="Search tags..." />
                        <CommandList className="max-h-48 overflow-y-auto">
                          <CommandEmpty>No tags found.</CommandEmpty>
                          <CommandGroup>
                            {tags.map((tag) => {
                              const label = getTagLabel(tag);
                              const isSelected = tag.id === stashEditor?.tagId;
                              return (
                                <CommandItem
                                  key={tag.id}
                                  value={tag.id}
                                  keywords={[label]}
                                  onSelect={() => {
                                    setStashEditor(
                                      stashEditor
                                        ? {
                                            ...stashEditor,
                                            tagId: tag.id
                                          }
                                        : null
                                    );
                                    setTagPopoverOpen(false);
                                  }}
                                  className="flex min-w-0 justify-between gap-2"
                                >
                                  <span className="truncate">{label}</span>
                                  {isSelected ? (
                                    <LuCheck size={14} className="text-primary shrink-0" />
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
            </div>

            <div className="space-y-2">
              <FieldLabel htmlFor="stash-description">Description</FieldLabel>
              <Textarea
                id="stash-description"
                value={stashEditor?.description ?? ""}
                onChange={(event) =>
                  setStashEditor(
                    stashEditor ? { ...stashEditor, description: event.target.value } : null
                  )
                }
                className="min-h-28 w-full resize-y"
              />
            </div>

            <DialogFooter className="gap-2 pt-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTagPopoverOpen(false);
                  setStashEditor(null);
                }}
                disabled={isUpdateStashPending}
                className="h-11 sm:h-9"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdateStashPending} className="h-11 sm:h-9">
                {isUpdateStashPending ? "Updating..." : "Update stash"}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
