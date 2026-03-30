"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createBookmark,
  createTag,
  fetchTags,
  getDefaultTagId,
  getTagLabel,
  MutationError,
  normalizeUrl,
  stashQueryKeys,
  Tag,
} from "@/lib/stash-client";
import { cn } from "@/lib/utils";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, InputHTMLAttributes, ReactNode, useState } from "react";

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="block text-[11px] font-medium tracking-[0.18em] text-neutral-500 uppercase">
      {children}
    </label>
  );
}

function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-11 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-700",
        props.className,
      )}
    />
  );
}

function InlineStatus({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "error";
}) {
  return (
    <div
      className={cn(
        "rounded-lg px-3 py-2 text-sm",
        tone === "error"
          ? "bg-red-500/10 text-red-200"
          : "bg-white/[0.04] text-neutral-400",
      )}
    >
      {children}
    </div>
  );
}

export function ShareHandler({
  initialTags,
  sharedUrl,
  sharedTitle,
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
  const [title, setTitle] = useState(sharedTitle);
  const [tagId, setTagId] = useState<string | null>(getDefaultTagId(initialTags));
  const [notice, setNotice] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);

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

  const createBookmarkMutation = useMutation({
    mutationFn: (payload: { url: string; tagId: string; title?: string }) =>
      createBookmark(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: stashQueryKeys.bookmarks });
      router.push("/");
    },
    onError: (error: MutationError) => {
      setNotice({ type: "error", message: error.message });
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
    const existingInbox = tags.find((tag) => tag.name?.toLowerCase() === "inbox");
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
      setNotice({ type: "error", message: validation.message });
      return;
    }

    try {
      const actualTagId = resolvedTagId ?? (await ensureInboxTag());
      await createBookmarkMutation.mutateAsync({
        url: validation.value,
        title: title.trim() || undefined,
        tagId: actualTagId,
      });
    } catch {
      // mutation errors are surfaced through state
    }
  }

  const isSaving =
    createBookmarkMutation.isPending || createTagMutation.isPending;
  const showTagsLoading = tagsQuery.isPending && !tags.length;
  const showTagsError = tagsQuery.isError && !tags.length;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[#141414] p-4 text-neutral-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl"
      >
        <h1 className="mb-2 text-lg font-medium text-white">Save Bookmark</h1>
        <p className="mb-6 text-sm text-neutral-400">
          Review and save the shared link.
        </p>

        {notice ? (
          <div
            className={cn(
              "mb-4 rounded-lg border px-3 py-2 text-sm",
              notice.type === "error"
                ? "border-red-500/20 bg-red-500/10 text-red-200"
                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
            )}
          >
            {notice.message}
          </div>
        ) : null}

        <div className="space-y-4">
          <div>
            <FieldLabel>URL</FieldLabel>
            <TextInput
              className="mt-1"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://..."
              required
            />
          </div>

          <div>
            <FieldLabel>Title (Optional)</FieldLabel>
            <TextInput
              className="mt-1"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Page title"
            />
          </div>

          <div className="space-y-2">
            <FieldLabel>Tag</FieldLabel>

            {showTagsLoading ? (
              <InlineStatus>
                <span className="inline-flex items-center gap-2">
                  <LoaderCircle size={14} className="animate-spin" />
                  Loading tags...
                </span>
              </InlineStatus>
            ) : showTagsError ? (
              <InlineStatus tone="error">
                <div className="flex items-center justify-between gap-3">
                  <span>Could not load tags.</span>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 px-2 text-red-100 hover:bg-red-500/10 hover:text-white"
                    onClick={() => void tagsQuery.refetch()}
                  >
                    Retry
                  </Button>
                </div>
              </InlineStatus>
            ) : (
              <>
                <div className="relative">
                  <Select
                    value={resolvedTagId ?? "none"}
                    onValueChange={(value) =>
                      setTagId(value === "none" ? null : value)
                    }
                  >
                    <SelectTrigger className="h-11 w-full border-neutral-800 bg-neutral-950 text-neutral-100 focus:ring-0 focus:ring-offset-0">
                      <SelectValue placeholder="Select a Tag" />
                    </SelectTrigger>
                    <SelectContent className="border-neutral-800 bg-[#1a1a1a] text-neutral-200">
                      {tags.length ? (
                        tags.map((tag) => (
                          <SelectItem key={tag.id} value={tag.id}>
                            {getTagLabel(tag)}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none">
                          (Creates &quot;Inbox&quot; tag)
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {tagsQuery.isFetching ? (
                  <InlineStatus>
                    <span className="inline-flex items-center gap-2">
                      <RefreshCw size={14} className="animate-spin" />
                      Syncing tags...
                    </span>
                  </InlineStatus>
                ) : null}
              </>
            )}
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-lg border-neutral-800 bg-neutral-950 text-neutral-300 hover:bg-neutral-900 hover:text-white"
            onClick={() => router.push("/")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 rounded-lg bg-neutral-100 text-black hover:bg-white"
            disabled={isSaving || !url.trim() || showTagsError}
          >
            {isSaving ? "Saving..." : "Save bookmark"}
          </Button>
        </div>
      </form>
    </div>
  );
}
