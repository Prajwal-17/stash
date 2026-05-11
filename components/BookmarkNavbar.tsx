"use client";

import { TagEditorState } from "@/components/bookmark-client/types";
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
import { Tag, getTagLabel } from "@/lib/stash-client";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  LuChevronDown,
  LuLoaderCircle,
  LuLogOut,
  LuPlus,
} from "react-icons/lu";

export interface BookmarkNavbarProps {
  tags: Tag[];
  activeTag: Tag | null;
  setActiveTagId: (id: string | null) => void;
  setComposerTagId: (id: string | null) => void;
  bookmarkCountByTag: Map<string, number>;
  visibleBookmarksCount: number;
  userInitial: string;
  userName: string;
  userEmail: string;
  handleLogout: () => Promise<void>;
  isLoggingOut: boolean;
  setTagEditor: (editor: TagEditorState | null) => void;
}

export function BookmarkNavbar({
  tags,
  activeTag,
  setActiveTagId,
  setComposerTagId,
  bookmarkCountByTag,
  visibleBookmarksCount,
  userInitial,
  userName,
  userEmail,
  handleLogout,
  isLoggingOut,
  setTagEditor,
}: BookmarkNavbarProps) {
  const [open, setOpen] = useState(false);

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

  const activeLabel = activeTag ? getTagLabel(activeTag) : "Inbox";

  return (
    <div className="flex w-full items-start justify-between gap-3">
      <div className="flex flex-col items-start gap-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
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
            className="w-[calc(100vw-2rem)] rounded-md p-0 sm:w-[300px]"
            align="start"
          >
            <Command>
              <CommandInput placeholder="Search tags..." />
              <CommandList className="max-h-[220px] overflow-y-auto">
                <CommandEmpty>No tags found.</CommandEmpty>
                <CommandGroup>
                  {tags.map((tag) => {
                    const label = getTagLabel(tag);
                    const count = bookmarkCountByTag.get(tag.id) ?? 0;
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
          {visibleBookmarksCount}{" "}
          {visibleBookmarksCount === 1 ? "link" : "links"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="border-border bg-muted text-foreground hover:bg-accent flex size-10 items-center justify-center rounded-full border text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoggingOut}
              aria-disabled={isLoggingOut}
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
