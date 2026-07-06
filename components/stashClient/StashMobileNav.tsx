"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useStashActions } from "@/hooks/useStashActions";
import { useStashQueries } from "@/hooks/useStashQueries";
import { getDefaultTagId, Tag } from "@/lib/stash-client";
import { cn } from "@/lib/utils";
import { useStashStore } from "@/store/stashStore";
import {
  LuArchive,
  LuInbox,
  LuLayoutGrid,
  LuLoaderCircle,
  LuLogOut,
  LuSearch,
  LuSettings,
  LuBookOpen
} from "react-icons/lu";

interface StashMobileNavProps {
  initialTags: Tag[];
  userEmail: string;
  userInitial: string;
  userName: string;
}

export function StashMobileNav({
  userEmail: propEmail,
  userInitial: propInitial,
  userName: propName
}: StashMobileNavProps) {
  const activeTagId = useStashStore((s) => s.activeTagId);
  const setActiveTagId = useStashStore((s) => s.setActiveTagId);
  const setComposerTagId = useStashStore((s) => s.setComposerTagId);
  const isSearchOpen = useStashStore((s) => s.isSearchOpen);
  const setIsSearchOpen = useStashStore((s) => s.setIsSearchOpen);
  const isTagsPageOpen = useStashStore((s) => s.isTagsPageOpen);
  const setIsTagsPageOpen = useStashStore((s) => s.setIsTagsPageOpen);
  const isReadingListView = useStashStore((s) => s.isReadingListView);
  const setIsReadingListView = useStashStore((s) => s.setIsReadingListView);
  const isLoggingOut = useStashStore((s) => s.isLoggingOut);

  const storeInitial = useStashStore((s) => s.userInitial);
  const storeName = useStashStore((s) => s.userName);
  const storeEmail = useStashStore((s) => s.userEmail);

  const userInitial = storeInitial !== "U" ? storeInitial : propInitial;
  const userName = storeName !== "" ? storeName : propName;
  const userEmail = storeEmail !== "" ? storeEmail : propEmail;

  const { tags } = useStashQueries();
  const defaultTagId = getDefaultTagId(tags);

  const { handleLogout } = useStashActions();

  return (
    <div className="mobile-nav">
      <button
        type="button"
        onClick={() => {
          setIsSearchOpen(false);
          setIsReadingListView(false);
          setActiveTagId(defaultTagId);
          setComposerTagId(defaultTagId);
        }}
        className={cn(
          "flex h-full w-14 flex-col items-center justify-center gap-1",
          !isSearchOpen && !isTagsPageOpen && !isReadingListView && activeTagId === defaultTagId
            ? "text-active"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LuInbox size={20} />
        <span className="text-[10px] font-medium">Inbox</span>
      </button>

      <button
        type="button"
        onClick={() => {
          setIsSearchOpen(true);
        }}
        className={cn(
          "flex h-full w-14 flex-col items-center justify-center gap-1",
          isSearchOpen ? "text-active" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LuSearch size={20} />
        <span className="text-[10px] font-medium">Search</span>
      </button>

      <button
        type="button"
        onClick={() => {
          setIsTagsPageOpen(true);
        }}
        className={cn(
          "flex h-full w-14 flex-col items-center justify-center gap-1",
          !isSearchOpen && isTagsPageOpen
            ? "text-active"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LuLayoutGrid size={20} />
        <span className="text-[10px] font-medium">Tags</span>
      </button>

      <button
        type="button"
        onClick={() => setIsReadingListView(true)}
        className={cn(
          "flex h-full w-14 flex-col items-center justify-center gap-1",
          isReadingListView ? "text-active" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LuBookOpen size={20} />
        <span className="text-[10px] font-medium">Read</span>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger id="mobile-profile-dropdown-trigger" asChild>
          <button
            id="mobile-profile-dropdown-trigger"
            type="button"
            className="text-muted-foreground hover:text-foreground flex h-full w-14 flex-col items-center justify-center gap-1"
          >
            <div className="border-border/50 bg-muted text-foreground flex size-5 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold">
              {userInitial}
            </div>
            <span className="text-[10px] font-medium">Profile</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-50" align="end" side="top">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-foreground text-sm leading-none font-medium">{userName}</p>
              <p className="text-muted-foreground text-xs leading-none">{userEmail}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-muted-foreground focus:bg-accent focus:text-foreground">
            Settings
            <LuSettings size={16} className="ml-auto" />
          </DropdownMenuItem>
          <DropdownMenuItem className="text-muted-foreground focus:bg-accent focus:text-foreground">
            Archive
            <LuArchive size={16} className="ml-auto" />
          </DropdownMenuItem>
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
  );
}
