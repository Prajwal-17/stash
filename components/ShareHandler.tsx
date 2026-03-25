"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FormEvent, InputHTMLAttributes, useState } from "react";

export interface Tag {
  id: string;
  name: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  msg: string;
  data: T;
}

interface MutationError {
  message: string;
}

async function requestJson<T>(input: string, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload: ApiResponse<T> = await response.json();
  if (!response.ok) {
    throw { message: payload.msg || "Request failed" } satisfies MutationError;
  }
  return payload.data;
}

type UrlValidationResult =
  | { valid: true; value: string }
  | { valid: false; message: string };

function normalizeUrl(value: string): UrlValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { valid: false, message: "URL is required." };
  }

  const withProtocol =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { valid: false, message: "Use an http or https URL." };
    }
    return { valid: true, value: withProtocol };
  } catch {
    return { valid: false, message: "Enter a valid URL." };
  }
}

function getDefaultTagId(tags: Tag[]) {
  return (
    tags.find((tag) => tag.name?.toLowerCase() === "inbox")?.id ??
    tags[0]?.id ??
    null
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
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

  // Attempt to extract URL from `text` if `url` is empty
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
  const [tagId, setTagId] = useState<string | null>(
    getDefaultTagId(initialTags),
  );
  const [notice, setNotice] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);

  const createBookmarkMutation = useMutation({
    mutationFn: (payload: { url: string; tagId: string; title?: string }) =>
      requestJson<{ id: string }>("/api/bookmarks", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      router.push("/");
    },
    onError: (error: MutationError) => {
      setNotice({ type: "error", message: error.message });
    },
  });

  const createTagMutation = useMutation({
    mutationFn: (name: string) =>
      requestJson<Tag>("/api/tags", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
  });

  async function ensureInboxTag() {
    const existingInbox = initialTags.find(
      (t) => t.name?.toLowerCase() === "inbox",
    );
    if (existingInbox) {
      return existingInbox.id;
    }
    const created = await createTagMutation.mutateAsync("Inbox");
    return created.id;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validation = normalizeUrl(url);
    if (!validation.valid) {
      setNotice({ type: "error", message: validation.message });
      return;
    }

    try {
      const actualTagId = tagId ?? (await ensureInboxTag());
      await createBookmarkMutation.mutateAsync({
        url: validation.value,
        title: title.trim() || undefined,
        tagId: actualTagId,
      });
    } catch (err) {
      // errors handled by mutation hook
    }
  }

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

        {notice && (
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
        )}

        <div className="space-y-4">
          <div>
            <FieldLabel>URL</FieldLabel>
            <TextInput
              className="mt-1"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              required
            />
          </div>

          <div>
            <FieldLabel>Title (Optional)</FieldLabel>
            <TextInput
              className="mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Page title"
            />
          </div>

          <div>
            <FieldLabel>Tag</FieldLabel>
            <div className="relative mt-1">
              <Select
                value={tagId ?? "none"}
                onValueChange={(value) =>
                  setTagId(value === "none" ? null : value)
                }
              >
                <SelectTrigger className="h-11 w-full border-neutral-800 bg-neutral-950 text-neutral-100 focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="Select a Tag" />
                </SelectTrigger>
                <SelectContent className="border-neutral-800 bg-[#1a1a1a] text-neutral-200">
                  {initialTags.length ? (
                    initialTags.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name ?? "Untitled"}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none">(Creates "Inbox" tag)</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
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
            disabled={createBookmarkMutation.isPending || !url.trim()}
          >
            {createBookmarkMutation.isPending ? "Saving..." : "Save bookmark"}
          </Button>
        </div>
      </form>
    </div>
  );
}
