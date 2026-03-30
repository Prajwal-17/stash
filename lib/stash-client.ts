"use client";

export interface Bookmark {
  id: string;
  tagId: string;
  url: string;
  title: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  hostname: string | null;
}

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

export interface MutationError {
  message: string;
}

export type UrlValidationResult =
  | { valid: true; value: string }
  | { valid: false; message: string };

export type TagValidationResult =
  | { valid: true; value: string }
  | { valid: false; message: string };

export const stashQueryKeys = {
  bookmarks: ["bookmarks"] as const,
  tags: ["tags"] as const,
};

export async function requestJson<T>(input: string, init?: RequestInit) {
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

export function fetchBookmarks() {
  return requestJson<Bookmark[]>("/api/bookmarks");
}

export function fetchTags() {
  return requestJson<Tag[]>("/api/tags");
}

export function createBookmark(payload: {
  url: string;
  tagId: string;
  title?: string;
  description?: string;
}) {
  return requestJson<Bookmark>("/api/bookmarks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateBookmark(payload: {
  bookmarkId: string;
  tagId: string;
  url: string;
  title?: string;
  description?: string;
}) {
  return requestJson<Bookmark>("/api/bookmarks", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteBookmark(bookmarkId: string) {
  return requestJson<Bookmark>("/api/bookmarks", {
    method: "DELETE",
    body: JSON.stringify({ bookmarkId }),
  });
}

export function createTag(name: string) {
  return requestJson<Tag>("/api/tags", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function updateTag(payload: { tagId: string; name: string }) {
  return requestJson<Tag>("/api/tags", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteTag(tagId: string) {
  return requestJson<Tag>("/api/tags", {
    method: "DELETE",
    body: JSON.stringify({ tagId }),
  });
}

export function normalizeUrl(value: string): UrlValidationResult {
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

export function validateTagName(value: string): TagValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { valid: false, message: "Tag name is required." };
  }
  if (trimmed.length > 50) {
    return { valid: false, message: "Tag name must be 50 characters or less." };
  }
  return { valid: true, value: trimmed };
}

export function getDefaultTagId(tags: Tag[]) {
  return (
    tags.find((tag) => tag.name?.toLowerCase() === "inbox")?.id ??
    tags[0]?.id ??
    null
  );
}

export function getTagLabel(tag: Tag | null | undefined) {
  return tag?.name?.trim() || "Untitled";
}
