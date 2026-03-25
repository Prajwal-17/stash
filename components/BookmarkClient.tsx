"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  ArrowSquareOut,
  Check,
  Copy,
  PencilSimple,
  Plus,
  SignOut,
  Trash,
  X,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import {
  ComponentProps,
  FormEvent,
  InputHTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  RefObject,
  TextareaHTMLAttributes,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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

interface Props {
  initialBookmarks: Bookmark[];
  initialTags: Tag[];
  userEmail: string;
  userInitial: string;
  userName: string;
}

interface EditBookmarkState {
  bookmarkId: string;
  url: string;
  title: string;
  description: string;
  tagId: string;
}

interface TagEditorState {
  mode: "create" | "edit";
  tagId?: string;
  name: string;
}

interface ConfirmationState {
  kind: "bookmark" | "tag";
  id: string;
  title: string;
  description: string;
  confirmLabel: string;
}

interface ApiResponse<T> {
  msg: string;
  data: T;
}

interface MutationError {
  message: string;
}

type UrlValidationResult =
  | { valid: true; value: string }
  | { valid: false; message: string };

type TagValidationResult =
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

function validateTagName(value: string): TagValidationResult {
  const trimmed = value.trim();
  if (!trimmed) {
    return { valid: false, message: "Tag name is required." };
  }
  if (trimmed.length > 50) {
    return { valid: false, message: "Tag name must be 50 characters or less." };
  }
  return { valid: true, value: trimmed };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getDefaultTagId(tags: Tag[]) {
  return (
    tags.find((tag) => tag.name?.toLowerCase() === "inbox")?.id ??
    tags[0]?.id ??
    null
  );
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

function useDismissableLayer(
  open: boolean,
  onDismiss: () => void,
  containerRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (containerRef.current?.contains(target)) {
        return;
      }
      onDismiss();
    };

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        onDismiss();
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [containerRef, onDismiss, open]);
}

function SurfaceButton({
  className,
  children,
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      variant="outline"
      className={cn(
        "h-9 rounded-lg border-neutral-800 bg-neutral-950 text-neutral-300 shadow-none hover:border-neutral-700 hover:bg-neutral-900 hover:text-white",
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="block text-xs font-medium tracking-[0.18em] text-neutral-500 uppercase">
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

function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-24 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-700",
        props.className,
      )}
    />
  );
}

function Modal({
  title,
  description,
  open,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md rounded-xl border border-neutral-800 bg-neutral-900 p-5"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.14 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-medium text-neutral-100">
                  {title}
                </h2>
                {description ? (
                  <p className="mt-1 text-sm text-neutral-400">{description}</p>
                ) : null}
              </div>
              <button
                type="button"
                className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200"
                onClick={onClose}
              >
                <X size={14} />
              </button>
            </div>
            <div className="mt-5">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function BookmarkClient({
  initialBookmarks,
  initialTags,
  userEmail,
  userInitial,
  userName,
}: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = createClient();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [activeTagId, setActiveTagId] = useState<string | null>(
    getDefaultTagId(initialTags),
  );
  const [composerTagId, setComposerTagId] = useState<string | null>(
    getDefaultTagId(initialTags),
  );
  const [urlInput, setUrlInput] = useState("");
  const [notice, setNotice] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [copiedBookmarkId, setCopiedBookmarkId] = useState<string | null>(null);
  const [bookmarkEditor, setBookmarkEditor] =
    useState<EditBookmarkState | null>(null);
  const [tagEditor, setTagEditor] = useState<TagEditorState | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(
    null,
  );

  useDismissableLayer(userMenuOpen, () => setUserMenuOpen(false), userMenuRef);

  const tagsQuery = useQuery({
    queryKey: ["tags"],
    queryFn: () => requestJson<Tag[]>("/api/tags"),
    initialData: initialTags,
  });

  const bookmarksQuery = useQuery({
    queryKey: ["bookmarks"],
    queryFn: () => requestJson<Bookmark[]>("/api/bookmarks"),
    initialData: initialBookmarks,
  });

  const tags = tagsQuery.data;
  const bookmarks = bookmarksQuery.data;

  const resolvedActiveTagId =
    activeTagId && tags.some((tag) => tag.id === activeTagId)
      ? activeTagId
      : getDefaultTagId(tags);

  const resolvedComposerTagId =
    composerTagId && tags.some((tag) => tag.id === composerTagId)
      ? composerTagId
      : getDefaultTagId(tags);

  const activeTag = useMemo(
    () => tags.find((tag) => tag.id === resolvedActiveTagId) ?? null,
    [resolvedActiveTagId, tags],
  );

  const visibleBookmarks = useMemo(() => {
    if (!resolvedActiveTagId) {
      return [];
    }

    return bookmarks
      .filter((bookmark) => bookmark.tagId === resolvedActiveTagId)
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      );
  }, [bookmarks, resolvedActiveTagId]);

  const createTagMutation = useMutation({
    mutationFn: (name: string) =>
      requestJson<Tag>("/api/tags", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    onSuccess: (tag) => {
      queryClient.setQueryData<Tag[]>(["tags"], (current = []) => [
        ...current,
        tag,
      ]);
      setActiveTagId(tag.id);
      setComposerTagId(tag.id);
      setNotice({ type: "success", message: "Tag created." });
    },
    onError: (error: MutationError) => {
      setNotice({ type: "error", message: error.message });
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: ({ tagId, name }: { tagId: string; name: string }) =>
      requestJson<Tag>("/api/tags", {
        method: "PATCH",
        body: JSON.stringify({ tagId, name }),
      }),
    onSuccess: (updatedTag) => {
      queryClient.setQueryData<Tag[]>(["tags"], (current = []) =>
        current.map((tag) => (tag.id === updatedTag.id ? updatedTag : tag)),
      );
      setNotice({ type: "success", message: "Tag updated." });
    },
    onError: (error: MutationError) => {
      setNotice({ type: "error", message: error.message });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (tagId: string) =>
      requestJson<Tag>("/api/tags", {
        method: "DELETE",
        body: JSON.stringify({ tagId }),
      }),
    onSuccess: (_, tagId) => {
      queryClient.setQueryData<Tag[]>(["tags"], (current = []) =>
        current.filter((tag) => tag.id !== tagId),
      );
      queryClient.setQueryData<Bookmark[]>(["bookmarks"], (current = []) =>
        current.filter((bookmark) => bookmark.tagId !== tagId),
      );
      setNotice({ type: "success", message: "Tag deleted." });
    },
    onError: (error: MutationError) => {
      setNotice({ type: "error", message: error.message });
    },
  });

  const createBookmarkMutation = useMutation({
    mutationFn: (payload: {
      url: string;
      tagId: string;
      title?: string;
      description?: string;
    }) =>
      requestJson<Bookmark>("/api/bookmarks", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (bookmark) => {
      queryClient.setQueryData<Bookmark[]>(["bookmarks"], (current = []) => [
        bookmark,
        ...current,
      ]);
      setUrlInput("");
      setNotice({ type: "success", message: "Bookmark saved." });
    },
    onError: (error: MutationError) => {
      setNotice({ type: "error", message: error.message });
    },
  });

  const updateBookmarkMutation = useMutation({
    mutationFn: (payload: {
      bookmarkId: string;
      tagId: string;
      url: string;
      title?: string;
      description?: string;
    }) =>
      requestJson<Bookmark>("/api/bookmarks", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: (updatedBookmark) => {
      queryClient.setQueryData<Bookmark[]>(["bookmarks"], (current = []) =>
        current.map((bookmark) =>
          bookmark.id === updatedBookmark.id ? updatedBookmark : bookmark,
        ),
      );
      setBookmarkEditor(null);
      setNotice({ type: "success", message: "Bookmark updated." });
    },
    onError: (error: MutationError) => {
      setNotice({ type: "error", message: error.message });
    },
  });

  const deleteBookmarkMutation = useMutation({
    mutationFn: (bookmarkId: string) =>
      requestJson<Bookmark>("/api/bookmarks", {
        method: "DELETE",
        body: JSON.stringify({ bookmarkId }),
      }),
    onSuccess: (_, bookmarkId) => {
      queryClient.setQueryData<Bookmark[]>(["bookmarks"], (current = []) =>
        current.filter((bookmark) => bookmark.id !== bookmarkId),
      );
      setNotice({ type: "success", message: "Bookmark deleted." });
    },
    onError: (error: MutationError) => {
      setNotice({ type: "error", message: error.message });
    },
  });

  async function ensureInboxTag() {
    const existingInbox = tags.find(
      (tag) => tag.name?.toLowerCase() === "inbox",
    );
    if (existingInbox) {
      return existingInbox.id;
    }
    const created = await createTagMutation.mutateAsync("Inbox");
    return created.id;
  }

  async function handleSave() {
    const validation = normalizeUrl(urlInput);
    if (!validation.valid) {
      setNotice({ type: "error", message: validation.message });
      return;
    }

    const targetTagId = resolvedComposerTagId ?? (await ensureInboxTag());
    await createBookmarkMutation.mutateAsync({
      tagId: targetTagId,
      url: validation.value,
    });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }

  async function copyText(value: string, bookmarkId: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedBookmarkId(bookmarkId);
      window.setTimeout(() => setCopiedBookmarkId(null), 1200);
    } catch {
      setNotice({ type: "error", message: "Clipboard write failed." });
    }
  }

  async function submitTagEditor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!tagEditor) {
      return;
    }

    const validation = validateTagName(tagEditor.name);
    if (!validation.valid) {
      setNotice({ type: "error", message: validation.message });
      return;
    }

    if (tagEditor.mode === "create") {
      await createTagMutation.mutateAsync(validation.value);
    } else if (tagEditor.tagId) {
      await updateTagMutation.mutateAsync({
        tagId: tagEditor.tagId,
        name: validation.value,
      });
    }

    setTagEditor(null);
  }

  async function submitBookmarkEditor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!bookmarkEditor) {
      return;
    }

    const validation = normalizeUrl(bookmarkEditor.url);
    if (!validation.valid) {
      setNotice({ type: "error", message: validation.message });
      return;
    }

    await updateBookmarkMutation.mutateAsync({
      bookmarkId: bookmarkEditor.bookmarkId,
      tagId: bookmarkEditor.tagId,
      url: validation.value,
      title: bookmarkEditor.title.trim() || undefined,
      description: bookmarkEditor.description.trim() || undefined,
    });
  }

  function handleComposerKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      void handleSave();
    }
  }

  return (
    <div className="min-h-dvh bg-[#141414] text-neutral-100">
      <main className="mx-auto w-full max-w-190 px-4 pt-10 pb-16 sm:px-6">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="size-7 rounded-full border border-neutral-700 bg-neutral-200" />
            <span className="text-neutral-500">/</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-neutral-200">
                {activeTag?.name ?? "All Bookmarks"}
              </p>
            </div>
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-full bg-[#6b4b3f] text-sm text-white"
              onClick={() => setUserMenuOpen((current) => !current)}
            >
              {userInitial}
            </button>

            <AnimatePresence>
              {userMenuOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute top-11 right-0 z-50 w-56 rounded-xl border border-neutral-800 bg-[#1a1a1a] p-2 shadow-2xl"
                >
                  <div className="rounded-lg px-3 py-2">
                    <p className="truncate text-sm text-neutral-100">
                      {userName}
                    </p>
                    <p className="truncate text-xs text-neutral-500">
                      {userEmail}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="mt-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900 hover:text-white"
                    onClick={handleLogout}
                  >
                    Logout
                    <SignOut size={14} />
                  </button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </header>

        <section className="mb-6 grid gap-3 sm:grid-cols-[200px_1fr_auto]">
          <div className="flex gap-2">
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-800 bg-[#1a1a1a] text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
              onClick={() => setTagEditor({ mode: "create", name: "" })}
            >
              <Plus size={18} />
            </button>
            <div className="relative flex-1">
              <Select
                value={resolvedActiveTagId ?? "all"}
                onValueChange={(value) => {
                  const tagId = value === "all" ? null : value;
                  setActiveTagId(tagId);
                  setComposerTagId(tagId);
                }}
              >
                <SelectTrigger className="h-11 w-full border-neutral-800 bg-neutral-950 text-neutral-100 focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="All Bookmarks" />
                </SelectTrigger>
                <SelectContent className="border-neutral-800 bg-[#1a1a1a] text-neutral-200">
                  <SelectItem value="all">All Bookmarks</SelectItem>
                  {tags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      {tag.name ?? "Untitled"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TextInput
            value={urlInput}
            onChange={(event) => {
              setUrlInput(event.target.value);
              if (notice) {
                setNotice(null);
              }
            }}
            onKeyDown={handleComposerKeyDown}
            placeholder="Paste your URL here..."
            disabled={createBookmarkMutation.isPending}
          />

          <Button
            className="h-11 rounded-lg bg-neutral-100 px-4 text-black hover:bg-white"
            disabled={createBookmarkMutation.isPending || !urlInput.trim()}
            onClick={() => void handleSave()}
          >
            Save
          </Button>
        </section>

        <AnimatePresence>
          {notice ? (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={cn(
                "mb-4 rounded-lg border px-3 py-2 text-sm",
                notice.type === "error"
                  ? "border-red-500/20 bg-red-500/10 text-red-200"
                  : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
              )}
            >
              {notice.message}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <section className="rounded-xl border border-neutral-900 bg-transparent">
          <div className="grid grid-cols-[minmax(0,1fr)_88px] gap-4 border-b border-neutral-900 px-3 py-3 text-[11px] font-medium tracking-[0.16em] text-neutral-500 uppercase sm:grid-cols-[minmax(0,1fr)_auto_110px]">
            <span>Title</span>
            <span className="hidden text-right sm:block">Actions</span>
            <span className="text-right">Created</span>
          </div>

          {bookmarksQuery.isPending && !bookmarks.length ? (
            <div className="px-3 py-4 text-sm text-neutral-500">Loading...</div>
          ) : !visibleBookmarks.length ? (
            <div className="px-3 py-8 text-sm text-neutral-500">
              {tags.length
                ? "No bookmarks in this tag."
                : "Create a tag or save a link to start."}
            </div>
          ) : (
            <ul>
              {visibleBookmarks.map((bookmark) => {
                const title =
                  bookmark.title?.trim() || getHostname(bookmark.url);
                const hostname = bookmark.hostname || getHostname(bookmark.url);

                return (
                  <motion.li
                    key={bookmark.id}
                    layout
                    className="grid grid-cols-[minmax(0,1fr)_88px] gap-4 border-b border-neutral-900 px-3 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto_110px]"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="flex size-4 shrink-0 items-center justify-center rounded-sm bg-neutral-700 text-[9px] font-medium text-neutral-200 uppercase">
                          {hostname.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-neutral-100">
                            {title}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-neutral-400">
                            {bookmark.url}
                          </p>
                          {title !== hostname && (
                            <p className="mt-0.5 truncate text-[11px] text-neutral-600">
                              {hostname}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-1 sm:hidden">
                        <button
                          type="button"
                          className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-900 hover:text-neutral-200"
                          onClick={() =>
                            void copyText(bookmark.url, bookmark.id)
                          }
                        >
                          {copiedBookmarkId === bookmark.id ? (
                            <Check size={14} />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-900 hover:text-neutral-200"
                        >
                          <ArrowSquareOut size={14} />
                        </a>
                        <button
                          type="button"
                          className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-900 hover:text-neutral-200"
                          onClick={() =>
                            setBookmarkEditor({
                              bookmarkId: bookmark.id,
                              url: bookmark.url,
                              title: bookmark.title ?? "",
                              description: bookmark.description ?? "",
                              tagId: bookmark.tagId,
                            })
                          }
                        >
                          <PencilSimple size={14} />
                        </button>
                        <button
                          type="button"
                          className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-900 hover:text-red-300"
                          onClick={() =>
                            setConfirmation({
                              kind: "bookmark",
                              id: bookmark.id,
                              title: "Delete bookmark?",
                              description:
                                "This removes the saved link permanently.",
                              confirmLabel: "Delete bookmark",
                            })
                          }
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="hidden items-center justify-end gap-1 sm:flex">
                      <button
                        type="button"
                        className="rounded-md p-2 text-neutral-500 hover:bg-neutral-900 hover:text-neutral-200"
                        onClick={() => void copyText(bookmark.url, bookmark.id)}
                      >
                        {copiedBookmarkId === bookmark.id ? (
                          <Check size={14} />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                      <a
                        href={bookmark.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md p-2 text-neutral-500 hover:bg-neutral-900 hover:text-neutral-200"
                      >
                        <ArrowSquareOut size={14} />
                      </a>
                      <button
                        type="button"
                        className="rounded-md p-2 text-neutral-500 hover:bg-neutral-900 hover:text-neutral-200"
                        onClick={() =>
                          setBookmarkEditor({
                            bookmarkId: bookmark.id,
                            url: bookmark.url,
                            title: bookmark.title ?? "",
                            description: bookmark.description ?? "",
                            tagId: bookmark.tagId,
                          })
                        }
                      >
                        <PencilSimple size={14} />
                      </button>
                      <button
                        type="button"
                        className="rounded-md p-2 text-neutral-500 hover:bg-neutral-900 hover:text-red-300"
                        onClick={() =>
                          setConfirmation({
                            kind: "bookmark",
                            id: bookmark.id,
                            title: "Delete bookmark?",
                            description:
                              "This removes the saved link permanently.",
                            confirmLabel: "Delete bookmark",
                          })
                        }
                      >
                        <Trash size={14} />
                      </button>
                    </div>

                    <div className="flex items-center justify-end gap-2 text-right">
                      <span className="text-sm text-neutral-400">
                        {formatDate(bookmark.createdAt)}
                      </span>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <SurfaceButton
            size="sm"
            onClick={() =>
              activeTag &&
              setTagEditor({
                mode: "edit",
                tagId: activeTag.id,
                name: activeTag.name ?? "",
              })
            }
            disabled={!activeTag}
          >
            Edit tag
          </SurfaceButton>
          <SurfaceButton
            size="sm"
            onClick={() =>
              activeTag &&
              setConfirmation({
                kind: "tag",
                id: activeTag.id,
                title: `Delete ${activeTag.name ?? "tag"}?`,
                description:
                  "This also deletes all bookmarks currently inside the tag.",
                confirmLabel: "Delete tag",
              })
            }
            disabled={!activeTag}
          >
            Delete tag
          </SurfaceButton>
        </div>
      </main>

      <Modal
        open={tagEditor !== null}
        onClose={() => setTagEditor(null)}
        title={tagEditor?.mode === "create" ? "New tag" : "Edit tag"}
      >
        <form
          className="space-y-4"
          onSubmit={(event) => void submitTagEditor(event)}
        >
          <div className="space-y-2">
            <FieldLabel>Name</FieldLabel>
            <TextInput
              autoFocus
              value={tagEditor?.name ?? ""}
              onChange={(event) =>
                setTagEditor((current) =>
                  current ? { ...current, name: event.target.value } : current,
                )
              }
              placeholder="Reading"
            />
          </div>

          <div className="flex justify-end gap-2">
            <SurfaceButton type="button" onClick={() => setTagEditor(null)}>
              Cancel
            </SurfaceButton>
            <Button
              type="submit"
              className="h-9 rounded-lg bg-neutral-100 px-4 text-black hover:bg-white"
            >
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={bookmarkEditor !== null}
        onClose={() => setBookmarkEditor(null)}
        title="Edit bookmark"
      >
        <form
          className="space-y-4"
          onSubmit={(event) => void submitBookmarkEditor(event)}
        >
          <div className="space-y-2">
            <FieldLabel>URL</FieldLabel>
            <TextInput
              autoFocus
              value={bookmarkEditor?.url ?? ""}
              onChange={(event) =>
                setBookmarkEditor((current) =>
                  current ? { ...current, url: event.target.value } : current,
                )
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel>Title</FieldLabel>
              <TextInput
                value={bookmarkEditor?.title ?? ""}
                onChange={(event) =>
                  setBookmarkEditor((current) =>
                    current
                      ? { ...current, title: event.target.value }
                      : current,
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <FieldLabel>Tag</FieldLabel>
              <Select
                value={bookmarkEditor?.tagId ?? ""}
                onValueChange={(value) =>
                  setBookmarkEditor((current) =>
                    current ? { ...current, tagId: value } : current,
                  )
                }
              >
                <SelectTrigger className="h-11 w-full border-neutral-800 bg-neutral-950 text-neutral-100 focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="Select a Tag" />
                </SelectTrigger>
                <SelectContent className="border-neutral-800 bg-[#1a1a1a] text-neutral-200">
                  {tags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      {tag.name ?? "Untitled"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <FieldLabel>Description</FieldLabel>
            <Textarea
              value={bookmarkEditor?.description ?? ""}
              onChange={(event) =>
                setBookmarkEditor((current) =>
                  current
                    ? { ...current, description: event.target.value }
                    : current,
                )
              }
            />
          </div>

          <div className="flex justify-end gap-2">
            <SurfaceButton
              type="button"
              onClick={() => setBookmarkEditor(null)}
            >
              Cancel
            </SurfaceButton>
            <Button
              type="submit"
              className="h-9 rounded-lg bg-neutral-100 px-4 text-black hover:bg-white"
            >
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={confirmation !== null}
        onClose={() => setConfirmation(null)}
        title={confirmation?.title ?? "Confirm"}
        description={confirmation?.description}
      >
        <div className="flex justify-end gap-2">
          <SurfaceButton type="button" onClick={() => setConfirmation(null)}>
            Cancel
          </SurfaceButton>
          <Button
            type="button"
            variant="destructive"
            className="h-9 rounded-lg"
            onClick={() => {
              if (!confirmation) {
                return;
              }
              if (confirmation.kind === "bookmark") {
                void deleteBookmarkMutation.mutateAsync(confirmation.id);
              } else {
                void deleteTagMutation.mutateAsync(confirmation.id);
              }
              setConfirmation(null);
            }}
          >
            {confirmation?.confirmLabel ?? "Delete"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
