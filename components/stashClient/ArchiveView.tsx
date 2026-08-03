"use client";

import { QueryStatus } from "@/components/shared/QueryStatus";
import { getStashTitle } from "@/components/stashClient/helpers";
import { useStashActions } from "@/hooks/useStashActions";
import { useStashQueries } from "@/hooks/useStashQueries";
import { getHostname } from "@/lib/link-utils";
import { getTagLabel, Stash, Tag } from "@/lib/stash-client";
import { useMemo, useState } from "react";
import {
  LuArchive,
  LuChevronRight,
  LuExternalLink,
  LuLoaderCircle,
  LuRotateCcw,
  LuTrash2
} from "react-icons/lu";

interface ArchivedLinkGroup {
  tag: Tag;
  stashes: Stash[];
}

export function ArchiveView() {
  const { rawTags, rawStashes, tagsQuery, stashesQuery } = useStashQueries();
  const {
    handleStashArchiveAction,
    handleTagArchiveAction,
    isSetStashArchivedPending,
    isSetTagArchivedPending,
    openDeleteConfirmation
  } = useStashActions();
  const [expandedTagIds, setExpandedTagIds] = useState<Set<string>>(() => new Set());

  function toggleTagContents(tagId: string) {
    setExpandedTagIds((current) => {
      const next = new Set(current);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  }

  const archivedTags = useMemo(
    () =>
      rawTags
        .filter((tag) => tag.archivedAt)
        .slice()
        .sort(
          (left, right) =>
            new Date(right.archivedAt!).getTime() - new Date(left.archivedAt!).getTime()
        ),
    [rawTags]
  );

  const archivedTagIds = useMemo(() => new Set(archivedTags.map((tag) => tag.id)), [archivedTags]);

  const stashesByTag = useMemo(() => {
    const grouped = new Map<string, Stash[]>();
    for (const stash of rawStashes) {
      const current = grouped.get(stash.tagId) ?? [];
      current.push(stash);
      grouped.set(stash.tagId, current);
    }

    for (const stashes of grouped.values()) {
      stashes.sort((left, right) => getStashTitle(left).localeCompare(getStashTitle(right)));
    }

    return grouped;
  }, [rawStashes]);

  const archivedLinkGroups = useMemo<ArchivedLinkGroup[]>(() => {
    const activeTagsById = new Map(
      rawTags.filter((tag) => !tag.archivedAt).map((tag) => [tag.id, tag])
    );
    const groups = new Map<string, Stash[]>();

    for (const stash of rawStashes) {
      if (!stash.archivedAt || archivedTagIds.has(stash.tagId)) continue;
      if (!activeTagsById.has(stash.tagId)) continue;
      const current = groups.get(stash.tagId) ?? [];
      current.push(stash);
      groups.set(stash.tagId, current);
    }

    return Array.from(groups.entries())
      .map(([tagId, stashes]) => ({
        tag: activeTagsById.get(tagId)!,
        stashes: stashes
          .slice()
          .sort(
            (left, right) =>
              new Date(right.archivedAt!).getTime() - new Date(left.archivedAt!).getTime()
          )
      }))
      .sort((left, right) => getTagLabel(left.tag).localeCompare(getTagLabel(right.tag)));
  }, [archivedTagIds, rawStashes, rawTags]);

  const hasArchivedRecords = archivedTags.length > 0 || archivedLinkGroups.length > 0;
  const isLoading =
    (tagsQuery.isPending && !rawTags.length) || (stashesQuery.isPending && !rawStashes.length);
  const hasBlockingError =
    (tagsQuery.isError && !rawTags.length) || (stashesQuery.isError && !rawStashes.length);

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
      <header className="border-border/40 bg-background/90 sticky top-0 z-10 flex shrink-0 items-center gap-3 border-b px-4 py-2.5 backdrop-blur-md sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <LuArchive className="text-muted-foreground size-4 shrink-0" />
          <h1 className="text-foreground truncate text-base font-medium tracking-tight">Archive</h1>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl space-y-6 px-3 pt-4 pb-20 sm:px-5 md:pb-6">
        {hasBlockingError ? (
          <QueryStatus tone="error">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>Could not load the archive.</span>
              <button
                type="button"
                className="hover:bg-muted min-h-9 rounded-lg px-3 text-sm font-medium"
                onClick={() => {
                  void tagsQuery.refetch();
                  void stashesQuery.refetch();
                }}
              >
                Retry
              </button>
            </div>
          </QueryStatus>
        ) : isLoading ? (
          <QueryStatus>
            <span className="inline-flex items-center gap-2">
              <LuLoaderCircle className="size-4 animate-spin" />
              Loading archive...
            </span>
          </QueryStatus>
        ) : !hasArchivedRecords ? (
          <div className="border-border/50 bg-card/40 flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed px-6 text-center">
            <div className="bg-muted mb-3 flex size-10 items-center justify-center rounded-full">
              <LuArchive className="text-muted-foreground size-5" />
            </div>
            <p className="text-foreground text-sm font-medium">Your archive is empty</p>
            <p className="text-muted-foreground mt-1 max-w-sm text-xs leading-relaxed">
              Archived links and tags stay here until you restore or permanently delete them.
            </p>
          </div>
        ) : (
          <>
            {archivedTags.length > 0 ? (
              <section aria-labelledby="archived-tags-heading">
                <div className="mb-2 flex items-center justify-between gap-3 px-1">
                  <h2
                    id="archived-tags-heading"
                    className="text-muted-foreground text-xs font-semibold tracking-wide uppercase"
                  >
                    Archived tags
                  </h2>
                  <span className="text-muted-foreground/60 text-xs tabular-nums">
                    {archivedTags.length}
                  </span>
                </div>

                <ul className="border-border/50 bg-card/30 divide-border/50 divide-y overflow-hidden rounded-xl border">
                  {archivedTags.map((tag) => {
                    const tagStashes = stashesByTag.get(tag.id) ?? [];
                    const count = tagStashes.length;
                    const label = getTagLabel(tag);
                    const isExpanded = expandedTagIds.has(tag.id);
                    return (
                      <li key={tag.id}>
                        <div className="flex items-center gap-2 px-3 py-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-foreground truncate text-sm font-medium">
                              <span className="text-muted-foreground/50 mr-1.5">#</span>
                              {label}
                            </p>
                            <p className="text-muted-foreground mt-0.5 text-xs">
                              {count} {count === 1 ? "link" : "links"}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-0.5">
                            <button
                              type="button"
                              aria-label={
                                isExpanded ? `Hide links in ${label}` : `Show links in ${label}`
                              }
                              aria-expanded={isExpanded}
                              onClick={() => toggleTagContents(tag.id)}
                              className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring/50 flex min-h-10 min-w-10 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
                            >
                              <LuChevronRight
                                className={`size-4 transition-transform motion-reduce:transition-none ${isExpanded ? "rotate-90" : ""}`}
                              />
                            </button>
                            <button
                              type="button"
                              aria-label={`Restore ${label}`}
                              title="Restore"
                              disabled={isSetTagArchivedPending}
                              onClick={() => void handleTagArchiveAction(tag.id, "restore")}
                              className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring/50 flex min-h-10 min-w-10 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50 sm:min-h-9 sm:min-w-9"
                            >
                              <LuRotateCcw className="size-4" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Permanently delete ${label}`}
                              onClick={() =>
                                openDeleteConfirmation({
                                  kind: "tag",
                                  id: tag.id,
                                  title: `Delete "${label}" permanently?`,
                                  description:
                                    count === 0
                                      ? "This permanently deletes the empty tag."
                                      : count === 1
                                        ? "This permanently deletes the tag and its link, including archived content."
                                        : `This permanently deletes the tag and all ${count} links inside it, including archived content.`,
                                  confirmLabel: "Delete permanently"
                                })
                              }
                              className="text-muted-foreground flex min-h-10 min-w-10 items-center justify-center rounded-lg transition-colors hover:bg-red-500/10 hover:text-red-300 focus-visible:ring-2 focus-visible:ring-red-400/50 focus-visible:outline-none sm:min-h-9 sm:min-w-9"
                            >
                              <LuTrash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                        {isExpanded ? (
                          tagStashes.length > 0 ? (
                            <ul className="border-border/40 bg-background/20 divide-border/30 divide-y border-t">
                              {tagStashes.map((stash) => (
                                <li key={stash.id} className="min-w-0 px-3 py-2 sm:pl-8">
                                  <a
                                    href={stash.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-foreground focus-visible:ring-ring/50 group inline-flex max-w-full items-center gap-1.5 rounded-sm text-sm font-medium hover:underline focus-visible:ring-2 focus-visible:outline-none"
                                  >
                                    <span className="truncate">{getStashTitle(stash)}</span>
                                    <LuExternalLink className="text-muted-foreground/50 size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none" />
                                  </a>
                                  <p className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs">
                                    <span>{stash.hostname || getHostname(stash.url)}</span>
                                    {stash.archivedAt ? (
                                      <>
                                        <span
                                          aria-hidden="true"
                                          className="text-muted-foreground/35"
                                        >
                                          ·
                                        </span>
                                        <span className="text-[10px] font-medium tracking-wide uppercase">
                                          Kept archived
                                        </span>
                                      </>
                                    ) : null}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="border-border/40 text-muted-foreground border-t px-3 py-2 text-xs sm:pl-8">
                              Empty tag
                            </p>
                          )
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            {archivedLinkGroups.length > 0 ? (
              <section aria-labelledby="archived-links-heading">
                <div className="mb-2 px-1">
                  <h2
                    id="archived-links-heading"
                    className="text-muted-foreground text-xs font-semibold tracking-wide uppercase"
                  >
                    Archived links
                  </h2>
                </div>

                <div className="space-y-3">
                  {archivedLinkGroups.map(({ tag, stashes }) => (
                    <div key={tag.id}>
                      <div className="text-muted-foreground/70 mb-1 flex items-center justify-between gap-3 px-2 text-xs font-medium">
                        <span className="truncate"># {getTagLabel(tag)}</span>
                        <span className="text-muted-foreground/45 tabular-nums">
                          {stashes.length}
                        </span>
                      </div>
                      <ul className="border-border/50 bg-card/20 divide-border/40 divide-y overflow-hidden rounded-xl border">
                        {stashes.map((stash) => (
                          <li key={stash.id} className="flex items-center gap-2 px-3 py-2">
                            <div className="min-w-0 flex-1">
                              <a
                                href={stash.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-foreground focus-visible:ring-ring/50 group inline-flex max-w-full items-center gap-1.5 rounded-sm text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
                              >
                                <span className="truncate">{getStashTitle(stash)}</span>
                                <LuExternalLink className="text-muted-foreground/50 size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                              </a>
                              <p className="text-muted-foreground mt-0.5 truncate text-xs">
                                {stash.hostname || getHostname(stash.url)}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-0.5">
                              <button
                                type="button"
                                aria-label={`Restore ${getStashTitle(stash)}`}
                                title="Restore"
                                disabled={isSetStashArchivedPending}
                                onClick={() => void handleStashArchiveAction(stash.id, "restore")}
                                className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring/50 flex min-h-10 min-w-10 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50 sm:min-h-9 sm:min-w-9"
                              >
                                <LuRotateCcw className="size-4" />
                              </button>
                              <button
                                type="button"
                                aria-label={`Permanently delete ${getStashTitle(stash)}`}
                                onClick={() =>
                                  openDeleteConfirmation({
                                    kind: "stash",
                                    id: stash.id,
                                    title: "Delete this archived link permanently?",
                                    description:
                                      "This permanently removes the link from your archive and cannot be undone.",
                                    confirmLabel: "Delete permanently"
                                  })
                                }
                                className="text-muted-foreground flex min-h-10 min-w-10 items-center justify-center rounded-lg transition-colors hover:bg-red-500/10 hover:text-red-300 focus-visible:ring-2 focus-visible:ring-red-400/50 focus-visible:outline-none sm:min-h-9 sm:min-w-9"
                              >
                                <LuTrash2 className="size-4" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
