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
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <header className="mx-auto flex h-13 w-full max-w-2xl shrink-0 items-center justify-between gap-3 px-3 sm:px-5">
        <h1 className="text-foreground min-w-0 truncate text-base font-medium tracking-tight">
          Tags
        </h1>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-muted hover:text-foreground size-8 rounded-md"
            onClick={() => setTagEditor({ mode: "create", name: "" })}
            aria-label="New tag"
          >
            <LuPlus size={18} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-muted hover:text-foreground size-8 rounded-md"
            onClick={() => setActiveView("stash")}
            aria-label="Close tags"
          >
            <LuX size={18} />
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-2xl px-3 pt-2 pb-4 sm:px-5">
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
              <div className="relative mb-3 flex items-center">
                <LuSearch className="text-muted-foreground pointer-events-none absolute left-3 size-4" />
                <Input
                  type="text"
                  aria-label="Search tags"
                  placeholder="Search tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoComplete="off"
                  className="border-border bg-card focus:bg-background text-foreground placeholder:text-muted-foreground h-10 w-full rounded-md pr-9 pl-9 sm:h-9"
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Clear tag search"
                    onClick={() => setSearchQuery("")}
                    className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring/50 absolute right-1 flex size-8 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <LuX size={14} />
                  </button>
                )}
              </div>

              <div className="text-muted-foreground mb-1.5 px-2 text-xs font-medium">
                {filteredTags.length} {filteredTags.length === 1 ? "tag" : "tags"}
              </div>
              {filteredTags.length === 0 ? (
                <QueryStatus>No tags matching &quot;{searchQuery}&quot;</QueryStatus>
              ) : (
                <ul className="flex flex-col">
                  {filteredTags.map((tag) => {
                    const label = getTagLabel(tag);
                    const count = stashCountByTag.get(tag.id) ?? 0;

                    return (
                      <li key={tag.id} className="min-w-0">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTagId(tag.id);
                            setComposerTagId(tag.id);
                            setActiveView("stash");
                          }}
                          className="group hover:bg-muted focus-visible:ring-ring/50 flex min-h-10 w-full min-w-0 items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
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
      </div>
    </main>
  );
}
