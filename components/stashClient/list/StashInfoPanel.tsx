import {
  formatRelativeDate,
  getHostname,
} from "@/components/stashClient/helpers";
import { useStashQueries } from "@/hooks/useStashQueries";
import { Stash, getTagLabel } from "@/lib/stash-client";
import Highlighter from "react-highlight-words";

export function StashInfoPanel({
  stash,
  searchWords = [],
}: {
  stash: Stash;
  searchWords?: string[];
}) {
  const { tags } = useStashQueries();
  const tag = tags.find((t) => t.id === stash.tagId);

  return (
    <div className="space-y-3 p-4">
      <div className="space-y-1">
        <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.15em] uppercase">
          URL
        </p>
        <p className="text-foreground/80 font-mono text-xs leading-relaxed break-all">
          <Highlighter
            searchWords={searchWords}
            autoEscape={true}
            textToHighlight={stash.url}
            highlightClassName="bg-white/15 text-foreground font-medium p-0"
          />
        </p>
      </div>

      {stash.title?.trim() && stash.title.trim() !== getHostname(stash.url) ? (
        <div className="space-y-1">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.15em] uppercase">
            Title
          </p>
          <p className="text-foreground/80 text-xs">
            <Highlighter
              searchWords={searchWords}
              autoEscape={true}
              textToHighlight={stash.title.trim()}
              highlightClassName="bg-white/15 text-foreground font-medium p-0"
            />
          </p>
        </div>
      ) : null}

      {stash.description?.trim() ? (
        <div className="space-y-1">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.15em] uppercase">
            Description
          </p>
          <p className="text-foreground/70 text-xs leading-relaxed">
            <Highlighter
              searchWords={searchWords}
              autoEscape={true}
              textToHighlight={stash.description.trim()}
              highlightClassName="bg-white/15 text-foreground font-medium p-0"
            />
          </p>
        </div>
      ) : null}

      <div className="border-border/50 grid grid-cols-2 gap-3 border-t pt-3">
        {tag ? (
          <div className="space-y-1">
            <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.15em] uppercase">
              Tag
            </p>
            <p className="text-foreground/80 text-xs">{getTagLabel(tag)}</p>
          </div>
        ) : null}
        <div className="space-y-1">
          <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.15em] uppercase">
            Added
          </p>
          <p className="text-foreground/80 text-xs">
            {formatRelativeDate(stash.createdAt)}
          </p>
        </div>
        {stash.updatedAt !== stash.createdAt ? (
          <div className="space-y-1">
            <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.15em] uppercase">
              Updated
            </p>
            <p className="text-foreground/80 text-xs">
              {formatRelativeDate(stash.updatedAt)}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
