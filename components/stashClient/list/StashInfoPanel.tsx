import { formatRelativeDate, getHostname } from "@/lib/link-utils";
import { useStashQueries } from "@/hooks/useStashQueries";
import { Stash, getTagLabel } from "@/lib/stash-client";
import Highlighter from "react-highlight-words";

export function StashInfoPanel({
  stash,
  searchWords = []
}: {
  stash: Stash;
  searchWords?: string[];
}) {
  const { tags } = useStashQueries();
  const tag = tags.find((t) => t.id === stash.tagId);

  return (
    <div className="space-y-3 p-4">
      <div className="space-y-1">
        <p className="text-muted-foreground text-xs font-medium">URL</p>
        <p className="text-foreground/80 text-sm leading-relaxed break-all">
          <Highlighter
            searchWords={searchWords}
            autoEscape={true}
            textToHighlight={stash.url}
            highlightClassName="bg-primary/20 text-foreground font-medium p-0"
          />
        </p>
      </div>

      {stash.title?.trim() && stash.title.trim() !== getHostname(stash.url) ? (
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium">Title</p>
          <p className="text-foreground text-sm wrap-anywhere">
            <Highlighter
              searchWords={searchWords}
              autoEscape={true}
              textToHighlight={stash.title.trim()}
              highlightClassName="bg-primary/20 text-foreground font-medium p-0"
            />
          </p>
        </div>
      ) : null}

      {stash.description?.trim() ? (
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium">Description</p>
          <p className="text-muted-foreground text-sm leading-relaxed wrap-anywhere">
            <Highlighter
              searchWords={searchWords}
              autoEscape={true}
              textToHighlight={stash.description.trim()}
              highlightClassName="bg-primary/20 text-foreground font-medium p-0"
            />
          </p>
        </div>
      ) : null}

      <div className="border-border grid grid-cols-2 gap-3 border-t pt-3">
        {tag ? (
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium">Tag</p>
            <p className="text-foreground text-sm wrap-anywhere">{getTagLabel(tag)}</p>
          </div>
        ) : null}
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium">Added</p>
          <p className="text-foreground text-sm wrap-anywhere">
            {formatRelativeDate(stash.createdAt)}
          </p>
        </div>
        {stash.updatedAt !== stash.createdAt ? (
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium">Updated</p>
            <p className="text-foreground text-sm wrap-anywhere">
              {formatRelativeDate(stash.updatedAt)}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
