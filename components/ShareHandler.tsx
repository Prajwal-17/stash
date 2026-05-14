"use client";

import { FieldLabel, QueryStatus } from "@/components/stashClient/ui";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  createStash,
  createTag,
  fetchTags,
  getDefaultTagId,
  getTagLabel,
  MutationError,
  normalizeUrl,
  stashQueryKeys,
  Tag,
} from "@/lib/stash-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "react-hot-toast";
import {
  LuCheck,
  LuChevronsUpDown,
  LuLoaderCircle,
  LuRefreshCw,
} from "react-icons/lu";

export function ShareHandler({
  initialTags,
  sharedUrl,
  sharedText,
}: {
  initialTags: Tag[];
  sharedUrl: string;
  sharedTitle: string;
  sharedText: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  let defaultUrl = sharedUrl;
  if (!defaultUrl && sharedText) {
    const urlMatches = sharedText.match(/https?:\/\/[^\s]+/);
    if (urlMatches) {
      defaultUrl = urlMatches[0];
    } else if (sharedText.includes(".")) {
      defaultUrl = sharedText;
    }
  }

  const [url, setUrl] = useState(defaultUrl);
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [tagId, setTagId] = useState<string | null>(
    getDefaultTagId(initialTags),
  );
  const [isSaving, setIsSaving] = useState(false);

  const tagsQuery = useQuery({
    queryKey: stashQueryKeys.tags,
    queryFn: fetchTags,
    initialData: initialTags,
  });

  const tags = tagsQuery.data ?? initialTags;
  const resolvedTagId =
    tagId && tags.some((tag) => tag.id === tagId)
      ? tagId
      : getDefaultTagId(tags);

  const createStashMutation = useMutation({
    mutationFn: (payload: {
      url: string;
      tagId: string;
      title?: string;
      description?: string;
    }) => createStash(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: stashQueryKeys.stashes,
      });
      toast.success("Stashed!");
      router.push("/");
    },
    onError: (error: MutationError) => {
      toast.error(error.message);
    },
  });

  const createTagMutation = useMutation({
    mutationFn: (name: string) => createTag(name),
    onSuccess: (createdTag) => {
      queryClient.setQueryData<Tag[]>(stashQueryKeys.tags, (current = []) => [
        ...current,
        createdTag,
      ]);
    },
  });

  async function ensureInboxTag() {
    const existingInbox = tags.find(
      (tag) => tag.name?.trim().toLowerCase() === "inbox",
    );
    if (existingInbox) {
      return existingInbox.id;
    }

    const created = await createTagMutation.mutateAsync("Inbox");
    return created.id;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const validation = normalizeUrl(url);
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    setIsSaving(true);
    let fetchedTitle = undefined;
    let fetchedDescription = undefined;

    try {
      const res = await fetch(
        `/api/metadata?url=${encodeURIComponent(validation.value)}`,
      );
      if (res.ok) {
        const metadata = await res.json();
        if (metadata.title) fetchedTitle = metadata.title;
        if (metadata.description) fetchedDescription = metadata.description;
      }
    } catch (err) {
      console.log(err);
    }

    try {
      const actualTagId = resolvedTagId ?? (await ensureInboxTag());
      await createStashMutation.mutateAsync({
        url: validation.value,
        title: fetchedTitle?.trim() || undefined,
        description: fetchedDescription?.trim() || undefined,
        tagId: actualTagId,
      });
    } catch {
      // mutation errors are surfaced through state
    } finally {
      setIsSaving(false);
    }
  }

  const isMutationPending =
    createStashMutation.isPending || createTagMutation.isPending || isSaving;
  const showTagsLoading = tagsQuery.isPending && !tags.length;
  const showTagsError = tagsQuery.isError && !tags.length;

  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-col items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="border-border bg-card w-full max-w-sm rounded-xl border p-6 shadow-2xl"
      >
        <h1 className="text-foreground mb-2 text-lg font-medium">Stash Link</h1>
        <p className="text-muted-foreground mb-6 text-sm">
          Review and stash the shared link.
        </p>

        <div className="space-y-4">
          <div>
            <FieldLabel>URL</FieldLabel>
            <Input
              className="mt-1"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://..."
              required
            />
          </div>

          <div className="space-y-2">
            <FieldLabel>Tag</FieldLabel>

            {showTagsLoading ? (
              <QueryStatus>
                <span className="inline-flex items-center gap-2">
                  <LuLoaderCircle size={14} className="animate-spin" />
                  Loading tags...
                </span>
              </QueryStatus>
            ) : showTagsError ? (
              <QueryStatus tone="error">
                <div className="flex items-center justify-between gap-3">
                  <span>Could not load tags.</span>
                  <Button
                    type="button"
                    variant="ghost"
                    className="hover:text-foreground h-8 px-2 text-red-100 hover:bg-red-500/10"
                    onClick={() => void tagsQuery.refetch()}
                  >
                    Retry
                  </Button>
                </div>
              </QueryStatus>
            ) : (
              <>
                <div className="relative mt-1">
                  <Popover
                    open={tagPopoverOpen}
                    onOpenChange={setTagPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="border-border bg-background text-foreground flex h-11 w-full items-center justify-between rounded-lg border px-3 text-sm focus:outline-none"
                      >
                        <span className="truncate">
                          {resolvedTagId
                            ? getTagLabel(
                                tags.find((t) => t.id === resolvedTagId)!,
                              )
                            : "Select a Tag"}
                        </span>
                        <LuChevronsUpDown
                          size={16}
                          className="text-muted-foreground shrink-0 opacity-50"
                        />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[calc(100vw-3rem)] rounded-md p-0 sm:w-83.5"
                      align="start"
                    >
                      <Command>
                        <CommandInput placeholder="Search tags..." />
                        <CommandList className="max-h-55 overflow-y-auto">
                          <CommandEmpty>No tags found.</CommandEmpty>
                          <CommandGroup>
                            {tags.map((tag) => {
                              const label = getTagLabel(tag);
                              const isSelected = tag.id === resolvedTagId;
                              return (
                                <CommandItem
                                  key={tag.id}
                                  value={label}
                                  onSelect={() => {
                                    setTagId(tag.id);
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

                {tagsQuery.isFetching ? (
                  <QueryStatus>
                    <span className="inline-flex items-center gap-2">
                      <LuRefreshCw size={14} className="animate-spin" />
                      Syncing tags...
                    </span>
                  </QueryStatus>
                ) : null}
              </>
            )}
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="border-border bg-background text-muted-foreground hover:bg-card hover:text-foreground flex-1 rounded-lg"
            onClick={() => router.push("/")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 rounded-lg"
            disabled={isMutationPending || !url.trim() || showTagsError}
          >
            {isMutationPending ? "Stashing..." : "Stash link"}
          </Button>
        </div>
      </form>
    </div>
  );
}
