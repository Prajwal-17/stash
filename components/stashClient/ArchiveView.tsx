"use client";

import { getStashTitle } from "@/components/stashClient/helpers";
import { QueryStatus } from "@/components/shared/QueryStatus";
import { useStashActions } from "@/hooks/useStashActions";
import { useStashQueries } from "@/hooks/useStashQueries";
import { getTagLabel, Stash, Tag } from "@/lib/stash-client";
import { formatRelativeDate, getHostname } from "@/lib/link-utils";
import { useMemo } from "react";
import { LuArchive, LuExternalLink, LuLoaderCircle, LuRotateCcw, LuTrash2 } from "react-icons/lu";

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

  const stashCountByTag = useMemo(() => {
    const counts = new Map<string, number>();
    for (const stash of rawStashes) {
      counts.set(stash.tagId, (counts.get(stash.tagId) ?? 0) + 1);
    }
    return counts;
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
      <header className="border-border/40 bg-background/90 sticky top-0 z-10 flex shrink-0 items-center gap-3 border-b px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <LuArchive className="text-muted-foreground size-4 shrink-0" />
          <h1 className="text-foreground truncate text-base font-medium tracking-tight">Archive</h1>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl space-y-8 px-3 pt-5 pb-24 sm:px-6 md:pb-8">
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
                <div className="mb-3 flex items-baseline justify-between gap-3 px-1">
                  <div>
                    <h2
                      id="archived-tags-heading"
                      className="text-foreground text-sm font-semibold tracking-tight"
                    >
                      Archived tags
                    </h2>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      Restoring a tag brings back its links, except links archived individually.
                    </p>
                  </div>
                  <span className="text-muted-foreground/60 text-xs tabular-nums">
                    {archivedTags.length}
                  </span>
                </div>

                <ul className="border-border/50 bg-card/30 divide-border/50 divide-y overflow-hidden rounded-xl border">
                  {archivedTags.map((tag) => {
                    const count = stashCountByTag.get(tag.id) ?? 0;
                    const label = getTagLabel(tag);
                    return (
                      <li
                        key={tag.id}
                        className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:px-4"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-foreground truncate text-sm font-medium">
                            <span className="text-muted-foreground/50 mr-1.5">#</span>
                            {label}
                          </p>
                          <p className="text-muted-foreground mt-1 text-xs">
                            Archived {formatRelativeDate(tag.archivedAt!)}
                            <span className="text-muted-foreground/35 mx-1.5">·</span>
                            {count} {count === 1 ? "link" : "links"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
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
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            {archivedLinkGroups.length > 0 ? (
              <section aria-labelledby="archived-links-heading">
                <div className="mb-3 px-1">
                  <h2
                    id="archived-links-heading"
                    className="text-foreground text-sm font-semibold tracking-tight"
                  >
                    Archived links
                  </h2>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    Individually archived links grouped by their original tag.
                  </p>
                </div>

                <div className="space-y-5">
                  {archivedLinkGroups.map(({ tag, stashes }) => (
                    <div key={tag.id}>
                      <div className="text-muted-foreground/70 mb-1.5 flex items-center justify-between gap-3 px-2 text-xs font-semibold">
                        <span className="truncate"># {getTagLabel(tag)}</span>
                        <span className="text-muted-foreground/45 tabular-nums">
                          {stashes.length}
                        </span>
                      </div>
                      <ul className="border-border/50 bg-card/20 divide-border/40 divide-y overflow-hidden rounded-xl border">
                        {stashes.map((stash) => (
                          <li
                            key={stash.id}
                            className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:px-4"
                          >
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
                                <span className="text-muted-foreground/35 mx-1.5">·</span>
                                Archived {formatRelativeDate(stash.archivedAt!)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
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
