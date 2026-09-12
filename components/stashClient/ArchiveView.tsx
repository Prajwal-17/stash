"use client";

import { QueryStatus } from "@/components/shared/QueryStatus";
import { Input } from "@/components/ui/input";
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
  LuSearch,
  LuTrash2,
  LuX
} from "react-icons/lu";

interface ArchivedLinkGroup {
  tag: Tag;
  stashes: Stash[];
}

interface ArchivedTagGroup extends ArchivedLinkGroup {
  totalCount: number;
}

function stashMatchesSearch(stash: Stash, query: string) {
  return [getStashTitle(stash), stash.url, stash.hostname, stash.description].some((value) =>
    value?.toLowerCase().includes(query)
  );
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
  const [searchQuery, setSearchQuery] = useState("");

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
  const normalizedQuery = searchQuery.trim().toLowerCase();

  function updateSearchQuery(value: string) {
    setSearchQuery(value);
    setExpandedTagIds(value.trim() ? new Set(archivedTags.map((tag) => tag.id)) : new Set());
  }

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

  const archivedTagGroups = useMemo<ArchivedTagGroup[]>(
    () =>
      archivedTags.flatMap((tag) => {
        const allStashes = stashesByTag.get(tag.id) ?? [];

        if (!normalizedQuery) {
          return [{ tag, stashes: allStashes, totalCount: allStashes.length }];
        }

        const tagMatches = getTagLabel(tag).toLowerCase().includes(normalizedQuery);
        const matchingStashes = tagMatches
          ? allStashes
          : allStashes.filter((stash) => stashMatchesSearch(stash, normalizedQuery));

        return tagMatches || matchingStashes.length
          ? [{ tag, stashes: matchingStashes, totalCount: allStashes.length }]
          : [];
      }),
    [archivedTags, normalizedQuery, stashesByTag]
  );

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
      .flatMap(([tagId, stashes]) => {
        const tag = activeTagsById.get(tagId)!;
        const sortedStashes = stashes
          .slice()
          .sort(
            (left, right) =>
              new Date(right.archivedAt!).getTime() - new Date(left.archivedAt!).getTime()
          );

        if (!normalizedQuery || getTagLabel(tag).toLowerCase().includes(normalizedQuery)) {
          return [{ tag, stashes: sortedStashes }];
        }

        const matchingStashes = sortedStashes.filter((stash) =>
          stashMatchesSearch(stash, normalizedQuery)
        );
        return matchingStashes.length ? [{ tag, stashes: matchingStashes }] : [];
      })
      .sort((left, right) => getTagLabel(left.tag).localeCompare(getTagLabel(right.tag)));
  }, [archivedTagIds, normalizedQuery, rawStashes, rawTags]);

  const hasArchivedRecords =
    archivedTags.length > 0 || rawStashes.some((stash) => stash.archivedAt);
  const hasSearchResults = archivedTagGroups.length > 0 || archivedLinkGroups.length > 0;
  const isLoading =
    (tagsQuery.isPending && !rawTags.length) || (stashesQuery.isPending && !rawStashes.length);
  const hasBlockingError =
    (tagsQuery.isError && !rawTags.length) || (stashesQuery.isError && !rawStashes.length);

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <header className="mx-auto flex h-13 w-full max-w-2xl shrink-0 items-center gap-3 px-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <LuArchive className="text-muted-foreground size-4 shrink-0" />
          <h1 className="text-foreground truncate text-base font-medium tracking-tight">Archive</h1>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-2xl space-y-5 px-3 pt-2 pb-4 sm:px-5">
          <div className="relative">
            <label htmlFor="archive-search" className="sr-only">
              Search archive
            </label>
            <LuSearch
              aria-hidden="true"
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <Input
              id="archive-search"
              type="search"
              value={searchQuery}
              onChange={(event) => updateSearchQuery(event.target.value)}
              placeholder="Search archive"
              autoComplete="off"
              disabled={isLoading || hasBlockingError}
              className="border-border bg-card h-10 pr-9 pl-9 sm:h-9"
            />
            {searchQuery ? (
              <button
                type="button"
                aria-label="Clear archive search"
                onClick={() => updateSearchQuery("")}
                className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring/50 absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none"
              >
                <LuX className="size-3.5" />
              </button>
            ) : null}
          </div>

          {hasBlockingError ? (
            <QueryStatus tone="error">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>Could not load the archive.</span>
                <button
                  type="button"
                  className="hover:bg-muted focus-visible:ring-ring/50 min-h-8 rounded-md px-2 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
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
            <div className="flex min-h-32 flex-col items-center justify-center px-4 text-center">
              <div className="mb-2 flex size-6 items-center justify-center">
                <LuArchive className="text-muted-foreground size-4" />
              </div>
              <p className="text-foreground text-sm font-medium">Your archive is empty</p>
            </div>
          ) : normalizedQuery && !hasSearchResults ? (
            <div className="text-muted-foreground flex min-h-24 items-center justify-center px-4 py-4 text-center text-sm wrap-anywhere">
              No archive matches “{searchQuery.trim()}”
            </div>
          ) : (
            <>
              {archivedTagGroups.length > 0 ? (
                <section aria-labelledby="archived-tags-heading">
                  <div className="mb-2 flex items-center justify-between gap-3 px-1">
                    <h2
                      id="archived-tags-heading"
                      className="text-muted-foreground text-xs font-medium"
                    >
                      Archived tags
                    </h2>
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {archivedTagGroups.length}
                    </span>
                  </div>

                  <ul className="space-y-0.5">
                    {archivedTagGroups.map(({ tag, stashes: tagStashes, totalCount }) => {
                      const count = totalCount;
                      const label = getTagLabel(tag);
                      const isExpanded = expandedTagIds.has(tag.id);
                      return (
                        <li key={tag.id}>
                          <div className="group hover:bg-muted flex min-h-11 items-center gap-2 rounded-md px-2 py-1.5">
                            <button
                              type="button"
                              aria-label={
                                isExpanded ? `Hide links in ${label}` : `Show links in ${label}`
                              }
                              title={isExpanded ? "Hide links" : "Show links"}
                              aria-expanded={isExpanded}
                              onClick={() => toggleTagContents(tag.id)}
                              className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring/50 flex size-9 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
                            >
                              <LuChevronRight
                                className={`size-4 transition-transform motion-reduce:transition-none ${isExpanded ? "rotate-90" : ""}`}
                              />
                            </button>
                            <div className="min-w-0 flex-1">
                              <p className="text-foreground truncate text-sm font-medium">
                                <span className="text-muted-foreground mr-1.5">#</span>
                                {label}
                              </p>
                              <p className="text-muted-foreground mt-0.5 text-xs">
                                {normalizedQuery && tagStashes.length !== count
                                  ? `${tagStashes.length} of ${count} links`
                                  : `${count} ${count === 1 ? "link" : "links"}`}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-0.5 [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-focus-within:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100">
                              <button
                                type="button"
                                aria-label={`Restore ${label}`}
                                title="Restore"
                                disabled={isSetTagArchivedPending}
                                onClick={() => void handleTagArchiveAction(tag.id, "restore")}
                                className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring/50 flex size-9 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50 sm:size-8"
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
                                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:ring-ring/50 flex size-9 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none sm:size-8"
                              >
                                <LuTrash2 className="size-4" />
                              </button>
                            </div>
                          </div>
                          {isExpanded ? (
                            tagStashes.length > 0 ? (
                              <ul className="pb-2">
                                {tagStashes.map((stash) => (
                                  <li key={stash.id} className="min-w-0 py-1.5 pr-2 pl-11 sm:pl-13">
                                    <a
                                      href={stash.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-foreground focus-visible:ring-ring/50 group inline-flex max-w-full items-center gap-1.5 rounded-sm text-sm font-medium hover:underline focus-visible:ring-2 focus-visible:outline-none"
                                    >
                                      <span className="truncate">{getStashTitle(stash)}</span>
                                      <LuExternalLink className="text-muted-foreground size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none" />
                                    </a>
                                    <p className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs">
                                      <span className="min-w-0 truncate">
                                        {stash.hostname || getHostname(stash.url)}
                                      </span>
                                      {stash.archivedAt ? (
                                        <>
                                          <span
                                            aria-hidden="true"
                                            className="text-muted-foreground"
                                          >
                                            ·
                                          </span>
                                          <span className="text-xs font-medium">Kept archived</span>
                                        </>
                                      ) : null}
                                    </p>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-muted-foreground py-2 pr-2 pl-11 text-xs sm:pl-13">
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
                      className="text-muted-foreground text-xs font-medium"
                    >
                      Archived links
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {archivedLinkGroups.map(({ tag, stashes }) => (
                      <div key={tag.id}>
                        <div className="text-muted-foreground mb-1.5 flex items-center justify-between gap-3 px-2 text-xs font-medium">
                          <span className="truncate"># {getTagLabel(tag)}</span>
                          <span className="text-muted-foreground tabular-nums">
                            {stashes.length}
                          </span>
                        </div>
                        <ul className="space-y-0.5">
                          {stashes.map((stash) => (
                            <li
                              key={stash.id}
                              className="group hover:bg-muted flex min-h-11 items-center gap-2 rounded-md px-2 py-1.5"
                            >
                              <div className="min-w-0 flex-1">
                                <a
                                  href={stash.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-foreground focus-visible:ring-ring/50 group inline-flex max-w-full items-center gap-1.5 rounded-sm text-sm font-medium focus-visible:ring-2 focus-visible:outline-none"
                                >
                                  <span className="truncate">{getStashTitle(stash)}</span>
                                  <LuExternalLink className="text-muted-foreground size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                                </a>
                                <p className="text-muted-foreground mt-0.5 truncate text-xs">
                                  {stash.hostname || getHostname(stash.url)}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-0.5 [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-focus-within:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100">
                                <button
                                  type="button"
                                  aria-label={`Restore ${getStashTitle(stash)}`}
                                  title="Restore"
                                  disabled={isSetStashArchivedPending}
                                  onClick={() => void handleStashArchiveAction(stash.id, "restore")}
                                  className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-ring/50 flex size-9 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50 sm:size-8"
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
                                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:ring-ring/50 flex size-9 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none sm:size-8"
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
      </div>
    </main>
  );
}
