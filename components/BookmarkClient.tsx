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
  Bookmark,
  createBookmark,
  createTag,
  deleteBookmark,
  deleteTag,
  fetchBookmarks,
  fetchTags,
  getDefaultTagId,
  getTagLabel,
  MutationError,
  normalizeUrl,
  stashQueryKeys,
  Tag,
  updateBookmark,
  updateTag,
  validateTagName,
} from "@/lib/stash-client";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  Copy,
  EllipsisVertical,
  ExternalLink,
  Link2,
  LoaderCircle,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Tag as TagIcon,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
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

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getBookmarkTitle(bookmark: Bookmark) {
  return bookmark.title?.trim() || getHostname(bookmark.url);
}

function getFaviconUrl(hostname: string) {
  return `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(hostname)}`;
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
        "h-10 rounded-2xl border border-white/10 bg-white/[0.04] text-neutral-200 shadow-none backdrop-blur hover:bg-white/[0.08] hover:text-white",
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
    <label className="block text-[11px] font-semibold tracking-[0.18em] text-neutral-500 uppercase">
      {children}
    </label>
  );
}

function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-white/20",
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
        "min-h-28 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-white/20",
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
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[#111112] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.45)]"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">{title}</h2>
                {description ? (
                  <p className="mt-1 text-sm text-neutral-500">{description}</p>
                ) : null}
              </div>
              <button
                type="button"
                className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-neutral-500 transition hover:text-white"
                onClick={onClose}
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-5">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Drawer({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end bg-black/55 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full rounded-t-[28px] border-t border-white/10 bg-[#111112] px-5 pt-3 pb-7 shadow-[0_-18px_60px_rgba(0,0,0,0.4)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            drag="y"
            dragDirectionLock
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.18 }}
            dragMomentum={false}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 700) {
                onClose();
              }
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close drawer"
              className="mx-auto mb-4 block h-1.5 w-12 rounded-full bg-neutral-700"
              onClick={onClose}
            />
            <div className="mb-4">
              <h3 className="text-base font-semibold text-white">{title}</h3>
              {description ? (
                <p className="mt-1 text-sm text-neutral-500">{description}</p>
              ) : null}
            </div>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function QueryStatus({
  children,
  tone = "muted",
  compact = false,
}: {
  children: ReactNode;
  tone?: "muted" | "error";
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl px-3 py-2 text-sm",
        compact ? "text-xs" : "text-sm",
        tone === "error"
          ? "bg-red-500/10 text-red-200"
          : "bg-white/[0.04] text-neutral-400",
      )}
    >
      {children}
    </div>
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
  const tagOverflowRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);

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
  const [drawerBookmark, setDrawerBookmark] = useState<Bookmark | null>(null);
  const [tagOverflowOpen, setTagOverflowOpen] = useState(false);

  useDismissableLayer(userMenuOpen, () => setUserMenuOpen(false), userMenuRef);
  useDismissableLayer(
    tagOverflowOpen,
    () => setTagOverflowOpen(false),
    tagOverflowRef,
  );

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const tagsQuery = useQuery({
    queryKey: stashQueryKeys.tags,
    queryFn: fetchTags,
    initialData: initialTags,
  });

  const bookmarksQuery = useQuery({
    queryKey: stashQueryKeys.bookmarks,
    queryFn: fetchBookmarks,
    initialData: initialBookmarks,
  });

  const tags = tagsQuery.data ?? initialTags;
  const bookmarks = bookmarksQuery.data ?? initialBookmarks;

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

  const orderedTags = useMemo(() => {
    if (!resolvedActiveTagId) {
      return tags;
    }

    const activeIndex = tags.findIndex((tag) => tag.id === resolvedActiveTagId);
    if (activeIndex <= 3) {
      return tags;
    }

    const active = tags[activeIndex];
    return [
      active,
      ...tags.slice(0, activeIndex),
      ...tags.slice(activeIndex + 1),
    ];
  }, [resolvedActiveTagId, tags]);

  const visibleTagChips = useMemo(() => orderedTags.slice(0, 4), [orderedTags]);
  const hiddenTags = useMemo(() => orderedTags.slice(4), [orderedTags]);

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

  const createTagMutation = useMutation({
    mutationFn: (name: string) => createTag(name),
    onSuccess: (tag) => {
      queryClient.setQueryData<Tag[]>(stashQueryKeys.tags, (current = []) => [
        ...current,
        tag,
      ]);
      setActiveTagId(tag.id);
      setComposerTagId(tag.id);
      setTagOverflowOpen(false);
      setNotice({ type: "success", message: "Tag created." });
    },
    onError: (error: MutationError) => {
      setNotice({ type: "error", message: error.message });
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: ({ tagId, name }: { tagId: string; name: string }) =>
      updateTag({ tagId, name }),
    onSuccess: (updatedTag) => {
      queryClient.setQueryData<Tag[]>(stashQueryKeys.tags, (current = []) =>
        current.map((tag) => (tag.id === updatedTag.id ? updatedTag : tag)),
      );
      setNotice({ type: "success", message: "Tag updated." });
    },
    onError: (error: MutationError) => {
      setNotice({ type: "error", message: error.message });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (tagId: string) => deleteTag(tagId),
    onSuccess: (_, tagId) => {
      queryClient.setQueryData<Tag[]>(stashQueryKeys.tags, (current = []) =>
        current.filter((tag) => tag.id !== tagId),
      );
      queryClient.setQueryData<Bookmark[]>(
        stashQueryKeys.bookmarks,
        (current = []) =>
          current.filter((bookmark) => bookmark.tagId !== tagId),
      );
      setActiveTagId((current) => (current === tagId ? null : current));
      setComposerTagId((current) => (current === tagId ? null : current));
      setTagOverflowOpen(false);
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
    }) => createBookmark(payload),
    onSuccess: (bookmark) => {
      queryClient.setQueryData<Bookmark[]>(
        stashQueryKeys.bookmarks,
        (current = []) => [bookmark, ...current],
      );
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
    }) => updateBookmark(payload),
    onSuccess: (updatedBookmark) => {
      queryClient.setQueryData<Bookmark[]>(
        stashQueryKeys.bookmarks,
        (current = []) =>
          current.map((bookmark) =>
            bookmark.id === updatedBookmark.id ? updatedBookmark : bookmark,
          ),
      );
      setBookmarkEditor(null);
      setDrawerBookmark(null);
      setNotice({ type: "success", message: "Bookmark updated." });
    },
    onError: (error: MutationError) => {
      setNotice({ type: "error", message: error.message });
    },
  });

  const deleteBookmarkMutation = useMutation({
    mutationFn: (bookmarkId: string) => deleteBookmark(bookmarkId),
    onSuccess: (_, bookmarkId) => {
      queryClient.setQueryData<Bookmark[]>(
        stashQueryKeys.bookmarks,
        (current = []) =>
          current.filter((bookmark) => bookmark.id !== bookmarkId),
      );
      setDrawerBookmark(null);
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

  function openBookmarkEditor(bookmark: Bookmark) {
    setDrawerBookmark(null);
    setTagOverflowOpen(false);
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
    setTagOverflowOpen(false);
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
    <div className="min-h-dvh bg-[#090909] text-neutral-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_28%),linear-gradient(180deg,_#090909_0%,_#0c0c0d_100%)]" />

      <main className="relative mx-auto w-full max-w-3xl px-3 pt-4 pb-32 sm:px-5 sm:pt-8 sm:pb-36">
        <div className="mx-auto w-full max-w-2xl">
          <header className="mb-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-neutral-100">
                {activeTag ? getTagLabel(activeTag) : "All bookmarks"}
              </p>
              <p className="text-xs text-neutral-500">
                {visibleBookmarks.length} links
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-xs font-semibold text-white"
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
                      className="absolute top-11 right-0 z-50 w-60 rounded-2xl border border-white/10 bg-[#151515] p-2 shadow-2xl"
                    >
                      <div className="rounded-xl px-3 py-2.5">
                        <p className="truncate text-sm text-white">
                          {userName}
                        </p>
                        <p className="truncate text-xs text-neutral-500">
                          {userEmail}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="mt-1 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-neutral-300 transition hover:bg-white/[0.06] hover:text-white"
                        onClick={handleLogout}
                      >
                        Logout
                        <LogOut size={16} />
                      </button>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </header>

          <div className="mb-4 space-y-3">
            <div className="-mx-1 overflow-x-auto px-1">
              <div className="flex w-max items-center gap-2">
                <button
                  type="button"
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm transition",
                    resolvedActiveTagId === null
                      ? "bg-white text-black"
                      : "bg-white/[0.06] text-neutral-300 hover:bg-white/[0.1]",
                  )}
                  onClick={() => setActiveTagId(null)}
                >
                  All
                </button>

                {showTagLoadState ? (
                  <QueryStatus compact>
                    <span className="inline-flex items-center gap-2">
                      <LoaderCircle size={12} className="animate-spin" />
                      Loading tags...
                    </span>
                  </QueryStatus>
                ) : null}

                {visibleTagChips.map((tag) => {
                  const isActive = resolvedActiveTagId === tag.id;

                  if (!isActive) {
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        className="rounded-full bg-white/[0.06] px-3 py-1.5 text-sm text-neutral-300 transition hover:bg-white/[0.1]"
                        onClick={() => {
                          setActiveTagId(tag.id);
                          setComposerTagId(tag.id);
                        }}
                      >
                        {getTagLabel(tag)}
                      </button>
                    );
                  }

                  return (
                    <div
                      key={tag.id}
                      className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-sm text-black"
                    >
                      <button
                        type="button"
                        className="rounded-full px-1 py-0.5 transition hover:bg-black/6"
                        onClick={() => {
                          setActiveTagId(tag.id);
                          setComposerTagId(tag.id);
                        }}
                      >
                        {getTagLabel(tag)}
                      </button>
                      <span className="text-[10px] text-black/55">
                        {bookmarkCountByTag.get(tag.id) ?? 0}
                      </span>
                      <span className="mx-0.5 h-3.5 w-px bg-black/15" />
                      <button
                        type="button"
                        className="rounded-full p-1 text-black/60 transition hover:bg-black/8 hover:text-black"
                        onClick={() =>
                          setTagEditor({
                            mode: "edit",
                            tagId: tag.id,
                            name: tag.name ?? "",
                          })
                        }
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        type="button"
                        className="rounded-full p-1 text-black/60 transition hover:bg-black/8 hover:text-black disabled:opacity-40"
                        disabled={deleteTagMutation.isPending}
                        onClick={() =>
                          openDeleteConfirmation({
                            kind: "tag",
                            id: tag.id,
                            title: `Delete ${tag.name ?? "tag"}?`,
                            description:
                              "This also deletes all bookmarks currently inside the tag.",
                            confirmLabel: "Delete tag",
                          })
                        }
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}

                <button
                  type="button"
                  className="flex size-8 items-center justify-center rounded-full bg-white/[0.06] text-neutral-300 transition hover:bg-white/[0.1] hover:text-white"
                  onClick={() => setTagEditor({ mode: "create", name: "" })}
                >
                  <Plus size={14} />
                </button>

                {hiddenTags.length ? (
                  <div className="relative" ref={tagOverflowRef}>
                    <button
                      type="button"
                      className="flex size-8 items-center justify-center rounded-full bg-white/[0.06] text-neutral-300 transition hover:bg-white/[0.1] hover:text-white"
                      onClick={() => setTagOverflowOpen((current) => !current)}
                    >
                      <EllipsisVertical size={14} />
                    </button>

                    <AnimatePresence>
                      {tagOverflowOpen ? (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="absolute top-10 right-0 z-40 w-64 rounded-2xl border border-white/10 bg-[#151515] p-2 shadow-2xl"
                        >
                          <div className="max-h-72 space-y-1 overflow-y-auto">
                            {hiddenTags.map((tag) => (
                              <div
                                key={tag.id}
                                className="flex items-center gap-2 rounded-xl px-2 py-1"
                              >
                                <button
                                  type="button"
                                  className={cn(
                                    "flex min-w-0 flex-1 items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition",
                                    resolvedActiveTagId === tag.id
                                      ? "bg-white text-black"
                                      : "text-neutral-200 hover:bg-white/[0.06]",
                                  )}
                                  onClick={() => {
                                    setActiveTagId(tag.id);
                                    setComposerTagId(tag.id);
                                    setTagOverflowOpen(false);
                                  }}
                                >
                                  <span className="truncate">
                                    {getTagLabel(tag)}
                                  </span>
                                  <span className="ml-3 shrink-0 text-xs opacity-65">
                                    {bookmarkCountByTag.get(tag.id) ?? 0}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  className="flex size-8 shrink-0 items-center justify-center rounded-xl text-neutral-500 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
                                  disabled={deleteTagMutation.isPending}
                                  onClick={() => {
                                    openDeleteConfirmation({
                                      kind: "tag",
                                      id: tag.id,
                                      title: `Delete ${tag.name ?? "tag"}?`,
                                      description:
                                        "This also deletes all bookmarks currently inside the tag.",
                                      confirmLabel: "Delete tag",
                                    });
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                ) : null}
              </div>
            </div>

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
                    className="h-8 px-2 text-red-100 hover:bg-red-500/10 hover:text-white"
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
                    className="h-8 px-2 text-neutral-200 hover:bg-white/[0.06] hover:text-white"
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
                  <RefreshCw size={12} className="animate-spin" />
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
                  className="h-8 px-2 text-red-100 hover:bg-red-500/10 hover:text-white"
                  onClick={() => void bookmarksQuery.refetch()}
                >
                  Retry
                </Button>
              </div>
            </QueryStatus>
          ) : showBookmarkLoadState ? (
            <QueryStatus>
              <span className="inline-flex items-center gap-2">
                <LoaderCircle size={14} className="animate-spin" />
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
                      className="cursor-pointer rounded-2xl px-2 py-3 transition duration-200 hover:bg-white/[0.04]"
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
                          <p className="truncate text-sm font-medium text-neutral-100">
                            {title}
                          </p>
                          <p className="mt-1 truncate text-xs text-neutral-500">
                            {bookmark.url}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-0.5 self-center sm:gap-1">
                          <button
                            type="button"
                            className="flex size-8 items-center justify-center rounded-xl text-neutral-400 transition hover:bg-white/[0.06] hover:text-white sm:size-9"
                            onClick={(event) => {
                              event.stopPropagation();
                              void copyText(bookmark.url, bookmark.id);
                            }}
                          >
                            {copiedBookmarkId === bookmark.id ? (
                              <Check size={16} />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                          <a
                            href={bookmark.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex size-8 items-center justify-center rounded-xl text-neutral-400 transition hover:bg-white/[0.06] hover:text-white sm:size-9"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <ExternalLink size={16} />
                          </a>
                          <button
                            type="button"
                            className="hidden size-9 items-center justify-center rounded-xl text-neutral-400 transition hover:bg-white/[0.06] hover:text-white sm:flex"
                            onClick={(event) => {
                              event.stopPropagation();
                              openBookmarkEditor(bookmark);
                            }}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            className="hidden size-9 items-center justify-center rounded-xl text-neutral-400 transition hover:bg-red-500/10 hover:text-red-300 sm:flex"
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
                            <Trash2 size={16} />
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
                  <RefreshCw size={12} className="animate-spin" />
                  Syncing bookmarks...
                </span>
              </QueryStatus>
            </div>
          ) : null}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0b0b0c]/95 px-3 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur-xl">
        <div className="mx-auto w-full max-w-3xl">
          <AnimatePresence>
            {notice ? (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={cn(
                  "mb-3 rounded-2xl border px-3 py-2 text-sm",
                  notice.type === "error"
                    ? "border-red-500/20 bg-red-500/10 text-red-200"
                    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
                )}
              >
                {notice.message}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Select
              value={resolvedComposerTagId ?? "none"}
              onValueChange={(value) =>
                setComposerTagId(value === "none" ? null : value)
              }
            >
              <SelectTrigger
                className="h-11 w-full rounded-2xl border-white/10 bg-white/[0.06] text-left text-neutral-200 focus:ring-0 focus:ring-offset-0 sm:w-[190px] sm:shrink-0"
                icon={false}
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-neutral-500 uppercase">
                    Save to
                  </p>
                  <SelectValue placeholder="Inbox" />
                </div>
                <ChevronDown className="ml-3 size-4 shrink-0 opacity-70" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-white/10 bg-[#151515] text-neutral-100">
                {tags.length ? (
                  tags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      {getTagLabel(tag)}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none">Inbox</SelectItem>
                )}
              </SelectContent>
            </Select>

            <div className="flex items-end gap-2">
              <TextInput
                value={urlInput}
                onChange={(event) => {
                  setUrlInput(event.target.value);
                  if (notice) {
                    setNotice(null);
                  }
                }}
                onKeyDown={handleComposerKeyDown}
                placeholder="Paste a link"
                disabled={createBookmarkMutation.isPending || showTagErrorState}
                className="h-11 flex-1 border-white/10 bg-transparent px-4 text-neutral-100 placeholder:text-neutral-500 focus:border-white/20"
              />

              <Button
                className="h-11 shrink-0 rounded-2xl bg-white px-4 text-black hover:bg-neutral-200"
                disabled={
                  createBookmarkMutation.isPending ||
                  !urlInput.trim() ||
                  showTagErrorState
                }
                onClick={() => void handleSave()}
              >
                {createBookmarkMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>

          {(isTagMutationPending || isBookmarkMutationPending) &&
          !(createBookmarkMutation.isPending && urlInput.trim()) ? (
            <div className="mt-3">
              <QueryStatus compact>
                <span className="inline-flex items-center gap-2">
                  <LoaderCircle size={12} className="animate-spin" />
                  Updating your stash...
                </span>
              </QueryStatus>
            </div>
          ) : null}
        </div>
      </div>

      <Modal
        open={tagEditor !== null}
        onClose={() => setTagEditor(null)}
        title={tagEditor?.mode === "create" ? "Create tag" : "Edit tag"}
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
            <SurfaceButton
              type="button"
              onClick={() => setTagEditor(null)}
              disabled={isTagMutationPending}
            >
              Cancel
            </SurfaceButton>
            <Button
              type="submit"
              className="h-10 rounded-2xl bg-neutral-950 px-4 text-white hover:bg-neutral-800"
              disabled={isTagMutationPending}
            >
              {createTagMutation.isPending || updateTagMutation.isPending
                ? "Saving..."
                : "Save"}
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
                <SelectTrigger className="h-12 w-full rounded-2xl border-black/10 bg-white/80 text-neutral-900 shadow-none focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="Select a Tag" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-black/10 bg-[#fbf8f2] text-neutral-900">
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
              className="h-10 rounded-2xl bg-neutral-950 px-4 text-white hover:bg-neutral-800"
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
        title={drawerBookmark ? getBookmarkTitle(drawerBookmark) : "Bookmark"}
        description={
          drawerBookmark
            ? drawerBookmark.hostname || getHostname(drawerBookmark.url)
            : undefined
        }
      >
        {drawerBookmark ? (
          <div className="space-y-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-neutral-500 uppercase">
                Full link
              </p>
              <p className="mt-2 break-all text-sm text-neutral-200">
                {drawerBookmark.url}
              </p>
            </div>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-2xl bg-white/80 px-4 py-4 text-left text-sm text-neutral-900"
              onClick={() =>
                void copyText(drawerBookmark.url, drawerBookmark.id)
              }
            >
              <span className="flex items-center gap-3">
                <Copy size={18} className="text-neutral-700" />
                Copy link
              </span>
              {copiedBookmarkId === drawerBookmark.id ? (
                <Check size={16} className="text-emerald-600" />
              ) : null}
            </button>
            <a
              href={drawerBookmark.url}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-between rounded-2xl bg-white/80 px-4 py-4 text-sm text-neutral-900"
            >
              <span className="flex items-center gap-3">
                <ExternalLink size={18} className="text-neutral-700" />
                Open link
              </span>
              <Link2 size={16} className="text-neutral-500" />
            </a>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-2xl bg-white/80 px-4 py-4 text-left text-sm text-neutral-900"
              onClick={() => openBookmarkEditor(drawerBookmark)}
            >
              <span className="flex items-center gap-3">
                <Pencil size={18} className="text-neutral-700" />
                Edit bookmark
              </span>
              <TagIcon size={16} className="text-neutral-500" />
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
                <Trash2 size={18} className="text-red-600" />
                Delete bookmark
              </span>
            </button>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
