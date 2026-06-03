"use client";

import { QueryStatus } from "@/components/stashClient/ui";
import { Button } from "@/components/ui/button";
import { useStashQueries } from "@/hooks/useStashQueries";
import { getDefaultTagId, getTagLabel } from "@/lib/stash-client";
import { useStashStore } from "@/store/stashStore";
import { useMemo } from "react";
import { LuPlus, LuTag, LuX } from "react-icons/lu";

export function TagsPage() {
  const setActiveTagId = useStashStore((s) => s.setActiveTagId);
  const setComposerTagId = useStashStore((s) => s.setComposerTagId);
  const setIsTagsPageOpen = useStashStore((s) => s.setIsTagsPageOpen);
  const setTagEditor = useStashStore((s) => s.setTagEditor);

  const { tags, stashes, tagsQuery } = useStashQueries();

  const defaultTagId = getDefaultTagId(tags);

  const stashCountByTag = useMemo(() => {
    const counts = new Map<string, number>();
    for (const stash of stashes) {
      counts.set(stash.tagId, (counts.get(stash.tagId) ?? 0) + 1);
    }
    return counts;
  }, [stashes]);

  const customTags = tags.filter((t) => t.id !== defaultTagId);

  return (
    <main className="flex flex-1 flex-col overflow-y-auto">
      <header className="border-border/40 bg-background/80 sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3 backdrop-blur-md sm:px-8 sm:py-3">
        <h1 className="text-foreground text-base font-medium tracking-tight">Tags</h1>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-muted hover:text-foreground h-8 w-8 rounded-full"
            onClick={() => setTagEditor({ mode: "create", name: "" })}
            aria-label="New Tag"
          >
            <LuPlus size={18} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-muted hover:text-foreground h-8 w-8 rounded-full"
            onClick={() => setIsTagsPageOpen(false)}
            aria-label="Close Tags Page"
          >
            <LuX size={18} />
          </Button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-3 pt-4 pb-20 sm:px-6">
        {tagsQuery.isFetching && !tags.length ? (
          <QueryStatus>Loading tags...</QueryStatus>
        ) : customTags.length === 0 ? (
          <QueryStatus>
            You haven&apos;t created any custom tags yet. Click the &quot;+&quot; button in the
            header to get started.
          </QueryStatus>
        ) : (
          <div>
            <div className="text-muted-foreground/50 mb-2 px-2 text-xs font-semibold tracking-wider uppercase">
              {customTags.length} {customTags.length === 1 ? "tag" : "tags"}
            </div>
            <ul className="flex flex-col gap-0.5">
              {customTags.map((tag) => {
                const label = getTagLabel(tag);
                const count = stashCountByTag.get(tag.id) ?? 0;

                return (
                  <li key={tag.id} className="py-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTagId(tag.id);
                        setComposerTagId(tag.id);
                        setIsTagsPageOpen(false);
                      }}
                      className="group hover:bg-muted flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition duration-150"
                    >
                      <LuTag className="text-muted-foreground/50 group-hover:text-foreground/70 size-4 shrink-0 transition-colors" />
                      <span className="text-foreground flex-1 truncate text-left font-medium">
                        {label}
                      </span>
                      {count > 0 && (
                        <span className="text-muted-foreground/60 group-hover:text-muted-foreground/80 text-xs font-semibold transition-colors">
                          {count}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
