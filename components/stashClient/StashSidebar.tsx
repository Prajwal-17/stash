"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useStashActions } from "@/hooks/useStashActions";
import { useStashQueries } from "@/hooks/useStashQueries";
import { getDefaultTagId, getTagLabel, Tag } from "@/lib/stash-client";
import { cn } from "@/lib/utils";
import { useStashStore } from "@/store/stashStore";
import { useMemo, useState } from "react";
import {
  LuBookOpen,
  LuChevronDown,
  LuChevronRight,
  LuInbox,
  LuLayoutGrid,
  LuLoaderCircle,
  LuLogOut,
  LuPlus,
  LuSearch,
  LuX
} from "react-icons/lu";

interface StashSidebarProps {
  initialTags: Tag[];
  userEmail: string;
  userInitial: string;
  userName: string;
}

export function StashSidebar({
  initialTags,
  userEmail: propEmail,
  userInitial: propInitial,
  userName: propName
}: StashSidebarProps) {
  const activeTagId = useStashStore((s) => s.activeTagId);
  const setActiveTagId = useStashStore((s) => s.setActiveTagId);
  const setComposerTagId = useStashStore((s) => s.setComposerTagId);
  const isLoggingOut = useStashStore((s) => s.isLoggingOut);
  const setTagEditor = useStashStore((s) => s.setTagEditor);
  const storeInitial = useStashStore((s) => s.userInitial);
  const storeName = useStashStore((s) => s.userName);
  const storeEmail = useStashStore((s) => s.userEmail);
  const activeView = useStashStore((s) => s.activeView);
  const setActiveView = useStashStore((s) => s.setActiveView);

  const [isTagsOpen, setIsTagsOpen] = useState(true);
  const [tagSearchQuery, setTagSearchQuery] = useState("");

  const userInitial = storeInitial !== "U" ? storeInitial : propInitial;
  const userName = storeName !== "" ? storeName : propName;
  const userEmail = storeEmail !== "" ? storeEmail : propEmail;

  const { tags: queriedTags, stashes } = useStashQueries();
  const tags = queriedTags.length > 0 ? queriedTags : initialTags;

  const { handleLogout } = useStashActions();

  const resolvedActiveTagId =
    activeTagId && tags.some((tag) => tag.id === activeTagId) ? activeTagId : getDefaultTagId(tags);

  const stashCountByTag = useMemo(() => {
    const counts = new Map<string, number>();
    for (const stash of stashes) {
      counts.set(stash.tagId, (counts.get(stash.tagId) ?? 0) + 1);
    }
    return counts;
  }, [stashes]);

  const defaultTagId = getDefaultTagId(tags);
  const defaultTagCount = stashCountByTag.get(defaultTagId) ?? 0;

  return (
    <div className="bg-background/50 flex h-full w-full flex-col">
      <div className="flex items-center gap-2 px-4 py-5">
        <span className="text-foreground text-lg font-bold tracking-tight">Stash</span>
      </div>

      <div className="flex flex-col gap-0.5 px-3">
        <button
          type="button"
          data-search-trigger
          onClick={() => setActiveView("search")}
          className={cn(
            "hover:bg-muted/50 focus-visible:ring-ring/50 flex min-h-8 w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
            activeView === "search" ? "bg-muted text-foreground" : "text-muted-foreground"
          )}
        >
          <LuSearch size={16} />
          <span className="flex-1 text-left">Search</span>
          <Kbd className="border-border/50 bg-background/50 text-muted-foreground/80 h-4.5 px-1.5 font-sans text-[9px]">
            Ctrl+F
          </Kbd>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveView("stash");
            setActiveTagId(defaultTagId);
            setComposerTagId(defaultTagId);
          }}
          className={cn(
            "hover:bg-muted/50 focus-visible:ring-ring/50 flex min-h-8 w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
            activeView === "stash" && resolvedActiveTagId === defaultTagId
              ? "bg-active-bg text-active-fg"
              : "text-muted-foreground"
          )}
        >
          <LuInbox size={16} />
          <span className="flex-1 text-left">Inbox</span>
          {defaultTagCount > 0 && (
            <span className="text-muted-foreground/60 text-xs font-semibold">
              {defaultTagCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveView("reading-list")}
          className={cn(
            "hover:bg-muted/50 focus-visible:ring-ring/50 flex min-h-8 w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
            activeView === "reading-list" ? "bg-active-bg text-active-fg" : "text-muted-foreground"
          )}
        >
          <LuBookOpen size={16} />
          <span className="flex-1 text-left">Reading List</span>
        </button>
      </div>

      <div className="mt-6 flex flex-1 flex-col overflow-hidden">
        <div className="group flex items-center justify-between px-5 py-1">
          <button
            type="button"
            onClick={() => setIsTagsOpen(!isTagsOpen)}
            className="text-muted-foreground/70 hover:text-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase"
          >
            Tags
            {isTagsOpen ? <LuChevronDown size={14} /> : <LuChevronRight size={14} />}
          </button>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setActiveView("tags")}
                aria-label="View all tags"
                className={cn(
                  "text-muted-foreground/50 hover:bg-muted hover:text-foreground focus-visible:ring-ring/50 flex size-7 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  activeView === "tags" && "bg-muted text-foreground"
                )}
              >
                <LuLayoutGrid size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              View all tags
            </TooltipContent>
          </Tooltip>
        </div>

        {isTagsOpen && (
          <div className="flex flex-1 flex-col overflow-hidden px-3 py-1">
            {tags.filter((t) => t.id !== defaultTagId).length > 5 && (
              <div className="relative mb-2 flex shrink-0 items-center">
                <LuSearch className="text-muted-foreground/45 pointer-events-none absolute left-2.5 size-3" />
                <input
                  type="text"
                  aria-label="Filter tags"
                  placeholder="Filter tags..."
                  value={tagSearchQuery}
                  onChange={(e) => setTagSearchQuery(e.target.value)}
                  className="border-border/60 bg-muted/20 focus:bg-background text-foreground placeholder:text-muted-foreground/40 focus:border-ring/30 w-full rounded-md border py-1 pr-6 pl-7 text-[11px] transition-colors outline-none"
                />
                {tagSearchQuery && (
                  <button
                    type="button"
                    aria-label="Clear tag filter"
                    onClick={() => setTagSearchQuery("")}
                    className="text-muted-foreground/40 hover:text-foreground focus-visible:ring-ring/50 absolute right-1.5 flex size-6 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <LuX size={10} />
                  </button>
                )}
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              <div className="flex flex-col gap-0.5">
                {tags
                  .filter((tag) => tag.id !== defaultTagId)
                  .filter((tag) =>
                    getTagLabel(tag).toLowerCase().includes(tagSearchQuery.toLowerCase())
                  )
                  .map((tag) => {
                    const label = getTagLabel(tag);
                    const count = stashCountByTag.get(tag.id) ?? 0;
                    const isActive = activeView === "stash" && resolvedActiveTagId === tag.id;

                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          setActiveView("stash");
                          setActiveTagId(tag.id);
                          setComposerTagId(tag.id);
                        }}
                        className={cn(
                          "hover:bg-muted/50 focus-visible:ring-ring/50 group flex min-h-8 w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
                          isActive ? "bg-active-bg text-active-fg" : "text-muted-foreground"
                        )}
                      >
                        <span className="text-muted-foreground/60">#</span>
                        <span className="flex-1 truncate text-left">{label}</span>
                        {count > 0 && (
                          <span className="text-muted-foreground/40 group-hover:text-muted-foreground/70 text-xs font-semibold transition-colors">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}

                <button
                  type="button"
                  onClick={() => setTagEditor({ mode: "create", name: "" })}
                  className="text-muted-foreground/70 hover:bg-muted/50 hover:text-foreground focus-visible:ring-ring/50 mt-1 flex min-h-8 w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <LuPlus size={16} className="text-muted-foreground/50" />
                  <span className="flex-1 text-left">New tag</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col gap-0.5 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger id="sidebar-profile-dropdown-trigger" asChild>
            <button
              id="sidebar-profile-dropdown-trigger"
              type="button"
              disabled={isLoggingOut}
              className="hover:bg-muted/50 mt-2 flex w-full items-center gap-3 rounded-lg px-2 py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="border-border/50 bg-muted text-foreground flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold">
                {userInitial}
              </div>
              <div className="flex min-w-0 flex-1 flex-col items-start overflow-hidden">
                <span className="text-foreground w-full truncate text-left text-sm font-medium">
                  {userName}
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-57.5 max-w-[calc(100vw-1rem)]" align="start" side="top">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-foreground text-sm leading-tight font-medium wrap-break-word">
                  {userName}
                </p>
                <p className="text-muted-foreground mt-1 text-xs leading-tight break-all">
                  {userEmail}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-muted-foreground focus:bg-accent focus:text-foreground"
              disabled={isLoggingOut}
              onSelect={(e) => {
                e.preventDefault();
                void handleLogout();
              }}
            >
              {isLoggingOut ? (
                <>
                  Logging out...
                  <LuLoaderCircle size={16} className="ml-auto animate-spin" />
                </>
              ) : (
                <>
                  Logout
                  <LuLogOut size={16} className="ml-auto" />
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
