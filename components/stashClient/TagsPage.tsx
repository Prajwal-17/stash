"use client";

import { QueryStatus } from "@/components/shared/QueryStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStashQueries } from "@/hooks/useStashQueries";
import { getDefaultTagId, getTagLabel } from "@/lib/stash-client";
import { useStashStore } from "@/store/stashStore";
import { useMemo, useState } from "react";
import { LuPlus, LuSearch, LuTag, LuX } from "react-icons/lu";

export function TagsPage() {
  const setActiveTagId = useStashStore((s) => s.setActiveTagId);
  const setComposerTagId = useStashStore((s) => s.setComposerTagId);
  const setActiveView = useStashStore((s) => s.setActiveView);
  const setTagEditor = useStashStore((s) => s.setTagEditor);

  const { tags, stashes, tagsQuery } = useStashQueries();
  const [searchQuery, setSearchQuery] = useState("");

  const defaultTagId = getDefaultTagId(tags);

  const stashCountByTag = useMemo(() => {
    const counts = new Map<string, number>();
    for (const stash of stashes) {
      counts.set(stash.tagId, (counts.get(stash.tagId) ?? 0) + 1);
    }
    return counts;
  }, [stashes]);

  const customTags = useMemo(() => {
    return tags.filter((t) => t.id !== defaultTagId);
  }, [tags, defaultTagId]);

  const filteredTags = useMemo(() => {
    return customTags.filter((tag) =>
      getTagLabel(tag).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [customTags, searchQuery]);

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain">
      <header className="border-border bg-background/95 sticky top-0 z-10 flex min-h-20 shrink-0 items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
        <h1 className="text-foreground min-w-0 truncate text-xl font-semibold tracking-tight">
          Tags
        </h1>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-muted hover:text-foreground size-10 rounded-lg"
            onClick={() => setTagEditor({ mode: "create", name: "" })}
            aria-label="New tag"
          >
            <LuPlus size={18} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-muted hover:text-foreground size-10 rounded-lg"
            onClick={() => setActiveView("stash")}
            aria-label="Close tags"
          >
            <LuX size={18} />
          </Button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-4 pt-6 pb-6 sm:px-6 lg:px-8">
        {tagsQuery.isError && !tags.length ? (
          <QueryStatus tone="error">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>Could not load tags.</span>
              <Button type="button" variant="ghost" size="sm" onClick={() => tagsQuery.refetch()}>
                Retry
              </Button>
            </div>
          </QueryStatus>
        ) : tagsQuery.isFetching && !tags.length ? (
          <QueryStatus>Loading tags...</QueryStatus>
        ) : customTags.length === 0 ? (
          <QueryStatus>
            You haven&apos;t created any custom tags yet. Click the &quot;+&quot; button in the
            header to get started.
          </QueryStatus>
        ) : (
          <div>
            <div className="relative mb-4 flex items-center">
              <LuSearch className="text-muted-foreground pointer-events-none absolute left-3 size-4" />
              <Input
                type="text"
                aria-label="Search tags"
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
                className="border-border bg-card focus:bg-background text-foreground placeholder:text-muted-foreground h-11 w-full rounded-lg pr-11 pl-9"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Clear tag search"
                  onClick={() => setSearchQuery("")}
                  className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring/50 absolute right-1 flex size-9 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <LuX size={14} />
                </button>
              )}
            </div>

            <div className="text-muted-foreground mb-2 px-2 text-xs font-medium">
              {filteredTags.length} {filteredTags.length === 1 ? "tag" : "tags"}
            </div>
            {filteredTags.length === 0 ? (
              <QueryStatus>No tags matching &quot;{searchQuery}&quot;</QueryStatus>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {filteredTags.map((tag) => {
                  const label = getTagLabel(tag);
                  const count = stashCountByTag.get(tag.id) ?? 0;

                  return (
                    <li key={tag.id} className="py-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTagId(tag.id);
                          setComposerTagId(tag.id);
                          setActiveView("stash");
                        }}
                        className="group hover:bg-muted focus-visible:ring-ring/50 flex min-h-12 w-full min-w-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
                      >
                        <LuTag className="text-muted-foreground group-hover:text-foreground/70 size-4 shrink-0 transition-colors" />
                        <span className="text-foreground min-w-0 flex-1 truncate text-left font-medium">
                          {label}
                        </span>
                        {count > 0 && (
                          <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                            {count}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
