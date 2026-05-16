"use client";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useStashActions } from "@/hooks/useStashActions";
import { useStashQueries } from "@/hooks/useStashQueries";
import { getDefaultTagId, getTagLabel, Stash, Tag } from "@/lib/stash-client";
import { cn } from "@/lib/utils";
import { useStashStore } from "@/store/stashStore";
import { useEffect, useMemo, useState } from "react";
import {
  LuChevronDown,
  LuLoaderCircle,
  LuLogOut,
  LuPlus,
  LuSearch,
  LuX,
} from "react-icons/lu";

interface StashNavbarProps {
  initialTags: Tag[];
  initialStashes: Stash[];
  userEmail: string;
  userInitial: string;
  userName: string;
}

export function StashNavbar({
  initialTags,
  initialStashes,
  userEmail: propEmail,
  userInitial: propInitial,
  userName: propName,
}: StashNavbarProps) {
  const [open, setOpen] = useState(false);

  const activeTagId = useStashStore((s) => s.activeTagId);
  const setActiveTagId = useStashStore((s) => s.setActiveTagId);
  const setComposerTagId = useStashStore((s) => s.setComposerTagId);
  const isLoggingOut = useStashStore((s) => s.isLoggingOut);
  const setTagEditor = useStashStore((s) => s.setTagEditor);
  const storeInitial = useStashStore((s) => s.userInitial);
  const storeName = useStashStore((s) => s.userName);
  const storeEmail = useStashStore((s) => s.userEmail);
  const isSearchOpen = useStashStore((s) => s.isSearchOpen);
  const setIsSearchOpen = useStashStore((s) => s.setIsSearchOpen);
  const searchQuery = useStashStore((s) => s.searchQuery);
  const setSearchQuery = useStashStore((s) => s.setSearchQuery);

  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Debounce local input to store
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 200);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchQuery]);

  const userInitial = storeInitial !== "U" ? storeInitial : propInitial;
  const userName = storeName !== "" ? storeName : propName;
  const userEmail = storeEmail !== "" ? storeEmail : propEmail;

  const { tags: queriedTags, stashes: queriedStashes } = useStashQueries();
  const tags = queriedTags.length > 0 ? queriedTags : initialTags;
  const stashes = queriedStashes.length > 0 ? queriedStashes : initialStashes;

  const { handleLogout } = useStashActions();

  const resolvedActiveTagId =
    activeTagId && tags.some((tag) => tag.id === activeTagId)
      ? activeTagId
      : getDefaultTagId(tags);

  const activeTag = useMemo(
    () => tags.find((tag) => tag.id === resolvedActiveTagId) ?? null,
    [resolvedActiveTagId, tags],
  );

  const stashCountByTag = useMemo(() => {
    const counts = new Map<string, number>();
    for (const stash of stashes) {
      counts.set(stash.tagId, (counts.get(stash.tagId) ?? 0) + 1);
    }
    return counts;
  }, [stashes]);

  const visibleStashesCount = useMemo(() => {
    if (!resolvedActiveTagId) return stashes.length;
    return stashes.filter((b) => b.tagId === resolvedActiveTagId).length;
  }, [stashes, resolvedActiveTagId]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA"].includes(e.target.tagName)
      ) {
        return;
      }
      if (e.key === "p" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // "Ctrl + F" to open search
  useEffect(() => {
    const handleSearchShortcut = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA"].includes(e.target.tagName)
      ) {
        return;
      }
      if (e.key === "f" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleSearchShortcut);
    return () => document.removeEventListener("keydown", handleSearchShortcut);
  }, [setIsSearchOpen]);

  const activeLabel = activeTag ? getTagLabel(activeTag) : "Inbox";

  if (isSearchOpen) {
    return (
      <div className="animate-in fade-in flex w-full items-center gap-3 duration-200">
        <div className="group relative flex-1 shadow-sm">
          <LuSearch
            className="text-muted-foreground group-focus-within:text-foreground absolute top-1/2 left-3.5 -translate-y-1/2 transition-colors"
            size={18}
          />
          <input
            autoFocus
            type="text"
            placeholder="Search stashes, titles, or descriptions..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="border-border/50 bg-muted/40 focus:bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:ring-ring/20 w-full rounded-full border py-2.5 pr-12 pl-10 text-base shadow-inner transition-all outline-none focus:ring-4"
          />
          <button
            type="button"
            className="text-muted-foreground hover:bg-muted hover:text-foreground absolute top-1/2 right-2.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-full transition-colors"
            onClick={() => {
              setIsSearchOpen(false);
              setLocalSearch("");
              setSearchQuery("");
            }}
          >
            <LuX size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full items-start justify-between gap-3">
      <div className="flex flex-col items-start gap-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              suppressHydrationWarning
              className="group flex items-center gap-1.5 focus:outline-none"
            >
              <span className="text-foreground truncate text-lg font-medium">
                {activeLabel}
              </span>
              <LuChevronDown
                className={cn(
                  "text-muted-foreground group-hover:text-muted-foreground mt-0.5 shrink-0 transition-transform duration-200",
                  open && "text-muted-foreground rotate-180",
                )}
                size={16}
              />
              <Kbd className="ml-1 hidden sm:inline-flex">
                <span className="text-[10px]">⌘</span>P
              </Kbd>
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[calc(100vw-2rem)] rounded-md p-0 sm:w-75"
            align="start"
          >
            <Command>
              <CommandInput placeholder="Search tags..." />
              <CommandList className="max-h-55 overflow-y-auto">
                <CommandEmpty>No tags found.</CommandEmpty>
                <CommandGroup>
                  {tags.map((tag) => {
                    const label = getTagLabel(tag);
                    const count = stashCountByTag.get(tag.id) ?? 0;
                    return (
                      <CommandItem
                        key={tag.id}
                        value={label}
                        onSelect={() => {
                          setActiveTagId(tag.id);
                          setComposerTagId(tag.id);
                          setOpen(false);
                        }}
                        className="flex justify-between"
                      >
                        <span className="truncate">{label}</span>
                        <span className="text-xs opacity-60">{count}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
              <div className="border-border border-t p-1">
                <button
                  type="button"
                  onClick={() => {
                    setTagEditor({ mode: "create", name: "" });
                    setOpen(false);
                  }}
                  className="hover:bg-accent hover:text-accent-foreground text-muted-foreground flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm font-medium transition-colors outline-none"
                >
                  <LuPlus size={16} />
                  Add Tag
                </button>
              </div>
            </Command>
          </PopoverContent>
        </Popover>
        <p className="text-muted-foreground text-xs">
          {visibleStashesCount} {visibleStashesCount === 1 ? "link" : "links"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground flex size-9 items-center justify-center transition-colors"
          onClick={() => setIsSearchOpen(true)}
        >
          <LuSearch size={19} />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              suppressHydrationWarning
              className="border-border bg-muted text-foreground hover:bg-accent flex size-10 items-center justify-center rounded-full border text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoggingOut}
            >
              {userInitial}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-foreground text-sm leading-none font-medium">
                  {userName}
                </p>
                <p className="text-muted-foreground text-xs leading-none">
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
