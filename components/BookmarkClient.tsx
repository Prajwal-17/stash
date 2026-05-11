"use client";

import {
  getBookmarkTitle,
  getFaviconUrl,
  getHostname,
  getUrlPath,
} from "@/components/bookmark-client/helpers";
import {
  BookmarkClientProps,
  ConfirmationState,
  EditBookmarkState,
  TagEditorState,
} from "@/components/bookmark-client/types";
import { BookmarkComposer } from "@/components/bookmark-client/BookmarkComposer";
import {
  Drawer,
  FieldLabel,
  Modal,
  QueryStatus,
  SurfaceButton,
} from "@/components/bookmark-client/ui";
import { BookmarkNavbar } from "@/components/BookmarkNavbar";
import { TagEditorDialog } from "@/components/TagEditorDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBookmarkMutations } from "@/hooks/use-bookmark-mutations";
import { useBookmarkQueries } from "@/hooks/use-bookmark-queries";
import { authClient } from "@/lib/auth-client";
import {
  Bookmark,
  getDefaultTagId,
  getTagLabel,
  normalizeUrl,
  validateTagName,
} from "@/lib/stash-client";
import { motion } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Toaster } from "react-hot-toast";
import {
  LuCheck,
  LuCopy,
  LuExternalLink,
  LuLink2,
  LuLoaderCircle,
  LuPencil,
  LuRefreshCw,
  LuTag,
  LuTrash2,
} from "react-icons/lu";
export function BookmarkClient({
  initialBookmarks,
  initialTags,
  userEmail,
  userInitial,
  userName,
}: BookmarkClientProps) {
  const router = useRouter();
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
  const [copiedBookmarkId, setCopiedBookmarkId] = useState<string | null>(null);
  const [bookmarkEditor, setBookmarkEditor] =
    useState<EditBookmarkState | null>(null);
  const [tagEditor, setTagEditor] = useState<TagEditorState | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(
    null,
  );
  const [drawerBookmark, setDrawerBookmark] = useState<Bookmark | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const { tagsQuery, bookmarksQuery, tags, bookmarks } = useBookmarkQueries({
    initialBookmarks,
    initialTags,
  });

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

  const bookmarkCountByTag = useMemo(() => {
    const counts = new Map<string, number>();
    for (const bookmark of bookmarks) {
      counts.set(bookmark.tagId, (counts.get(bookmark.tagId) ?? 0) + 1);
    }
    return counts;
  }, [bookmarks]);

  const visibleBookmarks = useMemo(() => {
    const filtered = resolvedActiveTagId
      ? bookmarks.filter((bookmark) => bookmark.tagId === resolvedActiveTagId)
      : bookmarks;

    return filtered
      .slice()
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      );
  }, [bookmarks, resolvedActiveTagId]);

  const {
    createTagMutation,
    updateTagMutation,
    deleteTagMutation,
    createBookmarkMutation,
    updateBookmarkMutation,
    deleteBookmarkMutation,
  } = useBookmarkMutations({
    onTagCreated: (tag) => {
      setActiveTagId(tag.id);
      setComposerTagId(tag.id);
    },
    onTagDeleted: (tagId) => {
      setActiveTagId((current) => (current === tagId ? null : current));
      setComposerTagId((current) => (current === tagId ? null : current));
    },
    onBookmarkCreated: () => {
      setUrlInput("");
    },
    onBookmarkUpdated: () => {
      setBookmarkEditor(null);
      setDrawerBookmark(null);
    },
    onBookmarkDeleted: () => {
      setDrawerBookmark(null);
    },
    setNotice: (nextNotice) => setNotice(nextNotice),
  });

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

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
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await authClient.signOut();
      router.replace("/auth/login");
    } catch {
      setNotice({ type: "error", message: "Logout failed. Please try again." });
      setIsLoggingOut(false);
    }
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

  function openBookmarkEditor(bookmark: Bookmark) {
    setDrawerBookmark(null);
    setBookmarkEditor({
      bookmarkId: bookmark.id,
      url: bookmark.url,
      title: bookmark.title ?? "",
      description: bookmark.description ?? "",
      tagId: bookmark.tagId,
    });
  }

  function queueLongPress(bookmark: Bookmark) {
    if (window.innerWidth >= 640) {
      return;
    }
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
    }
    longPressTriggeredRef.current = false;
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setDrawerBookmark(bookmark);
    }, 480);
  }

  function clearLongPress() {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function openBookmark(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleRowOpen(bookmark: Bookmark) {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    openBookmark(bookmark.url);
  }

  function openDeleteConfirmation(confirmationState: ConfirmationState) {
    setDrawerBookmark(null);
    setConfirmation(confirmationState);
  }

  const isTagMutationPending =
    createTagMutation.isPending ||
    updateTagMutation.isPending ||
    deleteTagMutation.isPending;
  const isBookmarkMutationPending =
    createBookmarkMutation.isPending ||
    updateBookmarkMutation.isPending ||
    deleteBookmarkMutation.isPending;
  const showTagLoadState = tagsQuery.isPending && !tags.length;
  const showBookmarkLoadState = bookmarksQuery.isPending && !bookmarks.length;
  const showTagErrorState = tagsQuery.isError && !tags.length;

  return (
    <div className="bg-background text-foreground flex h-dvh flex-col overflow-hidden">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#151515",
            color: "#f5f5f5",
            border: "1px solid rgba(255,255,255,0.12)",
          },
        }}
      />

      <div className="mx-auto w-full max-w-2xl px-3 pt-4 sm:px-5 sm:pt-8">
        <header className="mb-4">
          <BookmarkNavbar
            tags={tags}
            activeTag={activeTag}
            setActiveTagId={setActiveTagId}
            setComposerTagId={setComposerTagId}
            bookmarkCountByTag={bookmarkCountByTag}
            visibleBookmarksCount={visibleBookmarks.length}
            userInitial={userInitial}
            userName={userName}
            userEmail={userEmail}
            handleLogout={handleLogout}
            isLoggingOut={isLoggingOut}
            setTagEditor={setTagEditor}
          />
        </header>
      </div>

      <main className="flex-1 overflow-y-auto px-3 sm:px-5">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-4 space-y-3">
            {tagsQuery.isError ? (
              <QueryStatus tone="error">
                <div className="flex items-center justify-between gap-3">
                  <span>
                    {tags.length
                      ? "Could not refresh tags."
                      : "Could not load tags."}
                  </span>
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
            ) : null}

            {!showTagLoadState && !showTagErrorState && !tags.length ? (
              <QueryStatus>
                <div className="flex items-center justify-between gap-3">
                  <span>No tags yet. Create one with the `+` button.</span>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-foreground hover:bg-accent hover:text-foreground h-8 px-2"
                    onClick={() => setTagEditor({ mode: "create", name: "" })}
                  >
                    New tag
                  </Button>
                </div>
              </QueryStatus>
            ) : null}

            {tagsQuery.isFetching && !showTagLoadState ? (
              <QueryStatus compact>
                <span className="inline-flex items-center gap-2">
                  <LuRefreshCw size={12} className="animate-spin" />
                  Syncing tags...
                </span>
              </QueryStatus>
            ) : null}
          </div>

          {bookmarksQuery.isError ? (
            <QueryStatus tone="error">
              <div className="flex items-center justify-between gap-3">
                <span>
                  {bookmarks.length
                    ? "Could not refresh bookmarks."
                    : "Could not load bookmarks."}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  className="hover:text-foreground h-8 px-2 text-red-100 hover:bg-red-500/10"
                  onClick={() => void bookmarksQuery.refetch()}
                >
                  Retry
                </Button>
              </div>
            </QueryStatus>
          ) : showBookmarkLoadState ? (
            <QueryStatus>
              <span className="inline-flex items-center gap-2">
                <LuLoaderCircle size={14} className="animate-spin" />
                Loading bookmarks...
              </span>
            </QueryStatus>
          ) : !visibleBookmarks.length ? (
            <QueryStatus>
              {resolvedActiveTagId
                ? "No bookmarks in this tag yet."
                : "No bookmarks here yet."}
            </QueryStatus>
          ) : (
            <ul className="divide-y divide-white/8">
              {visibleBookmarks.map((bookmark) => {
                const hostname = bookmark.hostname || getHostname(bookmark.url);
                const title = getBookmarkTitle(bookmark);

                return (
                  <motion.li key={bookmark.id} layout className="group py-1">
                    <div
                      className="hover:bg-muted cursor-pointer rounded-2xl px-2 py-3 transition duration-200"
                      onPointerDown={() => queueLongPress(bookmark)}
                      onPointerUp={clearLongPress}
                      onPointerCancel={clearLongPress}
                      onPointerLeave={clearLongPress}
                      onClick={() => handleRowOpen(bookmark)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex shrink-0 items-center justify-center">
                          <Image
                            src={getFaviconUrl(hostname)}
                            alt=""
                            width={20}
                            height={20}
                            unoptimized
                            className="size-5 rounded"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-foreground truncate text-sm font-medium">
                            {title}
                          </p>
                          <p className="text-muted-foreground mt-1 truncate text-xs">
                            {bookmark.url}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-0.5 self-center sm:gap-1">
                          <button
                            type="button"
                            className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-8 items-center justify-center rounded-xl transition sm:size-9"
                            onClick={(event) => {
                              event.stopPropagation();
                              void copyText(bookmark.url, bookmark.id);
                            }}
                          >
                            {copiedBookmarkId === bookmark.id ? (
                              <LuCheck size={16} />
                            ) : (
                              <LuCopy size={16} />
                            )}
                          </button>
                          <a
                            href={bookmark.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-8 items-center justify-center rounded-xl transition sm:size-9"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <LuExternalLink size={16} />
                          </a>
                          <button
                            type="button"
                            className="text-muted-foreground hover:bg-accent hover:text-foreground hidden size-9 items-center justify-center rounded-xl transition sm:flex"
                            onClick={(event) => {
                              event.stopPropagation();
                              openBookmarkEditor(bookmark);
                            }}
                          >
                            <LuPencil size={16} />
                          </button>
                          <button
                            type="button"
                            className="text-muted-foreground hidden size-9 items-center justify-center rounded-xl transition hover:bg-red-500/10 hover:text-red-300 sm:flex"
                            onClick={(event) => {
                              event.stopPropagation();
                              openDeleteConfirmation({
                                kind: "bookmark",
                                id: bookmark.id,
                                title: "Delete bookmark?",
                                description:
                                  "This removes the saved link permanently.",
                                confirmLabel: "Delete bookmark",
                              });
                            }}
                          >
                            <LuTrash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}

          {bookmarksQuery.isFetching && !showBookmarkLoadState ? (
            <div className="mt-3">
              <QueryStatus compact>
                <span className="inline-flex items-center gap-2">
                  <LuRefreshCw size={12} className="animate-spin" />
                  Syncing bookmarks...
                </span>
              </QueryStatus>
            </div>
          ) : null}
        </div>
      </main>

      <div className="mx-auto w-full max-w-2xl px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] sm:px-5">
        <BookmarkComposer
          urlInput={urlInput}
          setUrlInput={setUrlInput}
          handleComposerKeyDown={handleComposerKeyDown}
          handleSave={handleSave}
          isPending={createBookmarkMutation.isPending}
          isSyncing={isTagMutationPending || isBookmarkMutationPending}
          showTagErrorState={showTagErrorState}
          inputRef={inputRef}
          notice={notice}
          setNotice={setNotice}
        />
      </div>

      <TagEditorDialog
        editorState={tagEditor}
        onOpenChange={(open) => {
          if (!open) setTagEditor(null);
        }}
        onChangeName={(name) =>
          setTagEditor((current) => (current ? { ...current, name } : current))
        }
        // @ts-ignore
        onSubmit={submitTagEditor}
        isPending={createTagMutation.isPending || updateTagMutation.isPending}
      />

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
            <Input
              autoFocus
              value={bookmarkEditor?.url ?? ""}
              onChange={(event) =>
                setBookmarkEditor((current) =>
                  current ? { ...current, url: event.target.value } : current,
                )
              }
              className="border-border bg-muted text-foreground placeholder:text-muted-foreground focus:border-ring h-12 w-full rounded-2xl border px-4 text-sm"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel>Title</FieldLabel>
              <Input
                value={bookmarkEditor?.title ?? ""}
                onChange={(event) =>
                  setBookmarkEditor((current) =>
                    current
                      ? { ...current, title: event.target.value }
                      : current,
                  )
                }
                className="border-border bg-muted text-foreground placeholder:text-muted-foreground focus:border-ring h-12 w-full rounded-2xl border px-4 text-sm"
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
                <SelectTrigger className="border-border bg-accent text-foreground h-12 w-full rounded-2xl shadow-none focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="Select a Tag" />
                </SelectTrigger>
                <SelectContent className="border-border bg-popover text-foreground z-80 rounded-2xl">
                  {tags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      {getTagLabel(tag)}
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
              className="border-border bg-muted text-foreground placeholder:text-muted-foreground focus:border-ring min-h-28 w-full rounded-2xl border px-4 py-3 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2">
            <SurfaceButton
              type="button"
              onClick={() => setBookmarkEditor(null)}
              disabled={updateBookmarkMutation.isPending}
            >
              Cancel
            </SurfaceButton>
            <Button
              type="submit"
              className="bg-background text-foreground hover:bg-accent h-10 rounded-2xl px-4"
              disabled={updateBookmarkMutation.isPending}
            >
              {updateBookmarkMutation.isPending ? "Saving..." : "Save changes"}
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
          <SurfaceButton
            type="button"
            onClick={() => setConfirmation(null)}
            disabled={
              deleteBookmarkMutation.isPending || deleteTagMutation.isPending
            }
          >
            Cancel
          </SurfaceButton>
          <Button
            type="button"
            variant="destructive"
            className="h-10 rounded-2xl"
            disabled={
              deleteBookmarkMutation.isPending || deleteTagMutation.isPending
            }
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
            {deleteBookmarkMutation.isPending || deleteTagMutation.isPending
              ? "Deleting..."
              : (confirmation?.confirmLabel ?? "Delete")}
          </Button>
        </div>
      </Modal>

      <Drawer
        open={drawerBookmark !== null}
        onClose={() => setDrawerBookmark(null)}
        title={drawerBookmark ? getHostname(drawerBookmark.url) : "Bookmark"}
        description={
          drawerBookmark
            ? drawerBookmark.title?.trim() &&
              drawerBookmark.title.trim() !== getHostname(drawerBookmark.url)
              ? drawerBookmark.title.trim()
              : undefined
            : undefined
        }
      >
        {drawerBookmark ? (
          <div className="space-y-2">
            <div className="border-border bg-muted rounded-2xl border px-4 py-3">
              <p className="text-foreground text-sm break-all">
                {getUrlPath(drawerBookmark.url)}
              </p>
            </div>
            <button
              type="button"
              className="bg-accent0 flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left text-sm text-neutral-900"
              onClick={() =>
                void copyText(drawerBookmark.url, drawerBookmark.id)
              }
            >
              <span className="flex items-center gap-3">
                <LuCopy size={18} className="text-neutral-700" />
                Copy link
              </span>
              {copiedBookmarkId === drawerBookmark.id ? (
                <LuCheck size={16} className="text-emerald-600" />
              ) : null}
            </button>
            <a
              href={drawerBookmark.url}
              target="_blank"
              rel="noreferrer"
              className="bg-accent0 flex w-full items-center justify-between rounded-2xl px-4 py-4 text-sm text-neutral-900"
            >
              <span className="flex items-center gap-3">
                <LuExternalLink size={18} className="text-neutral-700" />
                Open link
              </span>
              <LuLink2 size={16} className="text-muted-foreground" />
            </a>
            <button
              type="button"
              className="bg-accent0 flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left text-sm text-neutral-900"
              onClick={() => openBookmarkEditor(drawerBookmark)}
            >
              <span className="flex items-center gap-3">
                <LuPencil size={18} className="text-neutral-700" />
                Edit bookmark
              </span>
              <LuTag size={16} className="text-muted-foreground" />
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-2xl bg-red-50 px-4 py-4 text-left text-sm text-red-700"
              onClick={() =>
                openDeleteConfirmation({
                  kind: "bookmark",
                  id: drawerBookmark.id,
                  title: "Delete bookmark?",
                  description: "This removes the saved link permanently.",
                  confirmLabel: "Delete bookmark",
                })
              }
            >
              <span className="flex items-center gap-3">
                <LuTrash2 size={18} className="text-red-600" />
                Delete bookmark
              </span>
            </button>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
