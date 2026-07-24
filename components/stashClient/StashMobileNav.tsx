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
  LuBookOpen,
  LuInbox,
  LuLayoutGrid,
  LuLoaderCircle,
  LuLogOut,
  LuSearch
} from "react-icons/lu";

interface StashMobileNavProps {
  initialTags: Tag[];
  userEmail: string;
  userInitial: string;
  userName: string;
}

export function StashMobileNav({
  initialTags,
  userEmail: propEmail,
  userInitial: propInitial,
  userName: propName
}: StashMobileNavProps) {
  const activeTagId = useStashStore((s) => s.activeTagId);
  const setActiveTagId = useStashStore((s) => s.setActiveTagId);
  const setComposerTagId = useStashStore((s) => s.setComposerTagId);
  const activeView = useStashStore((s) => s.activeView);
  const setActiveView = useStashStore((s) => s.setActiveView);
  const isLoggingOut = useStashStore((s) => s.isLoggingOut);

  const storeInitial = useStashStore((s) => s.userInitial);
  const storeName = useStashStore((s) => s.userName);
  const storeEmail = useStashStore((s) => s.userEmail);

  const userInitial = storeInitial !== "U" ? storeInitial : propInitial;
  const userName = storeName !== "" ? storeName : propName;
  const userEmail = storeEmail !== "" ? storeEmail : propEmail;

  const { tags: queriedTags } = useStashQueries();
  const tags = queriedTags.length ? queriedTags : initialTags;
  const defaultTagId = getDefaultTagId(tags);
  const resolvedActiveTagId =
    activeTagId && tags.some((tag) => tag.id === activeTagId) ? activeTagId : defaultTagId;

  const { handleLogout } = useStashActions();

  return (
    <div className="border-border/40 bg-background/90 flex h-[calc(3.5rem+env(safe-area-inset-bottom))] items-start justify-around border-t px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
      <button
        type="button"
        onClick={() => {
          setActiveView("stash");
          setActiveTagId(defaultTagId);
          setComposerTagId(defaultTagId);
        }}
        aria-current={
          activeView === "stash" && resolvedActiveTagId === defaultTagId ? "page" : undefined
        }
        className={cn(
          "focus-visible:ring-ring/50 flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none",
          activeView === "stash" && resolvedActiveTagId === defaultTagId
            ? "text-active"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LuInbox size={20} />
        <span className="text-[10px] font-medium">Inbox</span>
      </button>

      <button
        type="button"
        data-search-trigger
        onClick={() => setActiveView("search")}
        aria-current={activeView === "search" ? "page" : undefined}
        className={cn(
          "focus-visible:ring-ring/50 flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none",
          activeView === "search" ? "text-active" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LuSearch size={20} />
        <span className="text-[10px] font-medium">Search</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveView("tags")}
        aria-current={activeView === "tags" ? "page" : undefined}
        className={cn(
          "focus-visible:ring-ring/50 flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none",
          activeView === "tags" ? "text-active" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LuLayoutGrid size={20} />
        <span className="text-[10px] font-medium">Tags</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveView("reading-list")}
        aria-current={activeView === "reading-list" ? "page" : undefined}
        className={cn(
          "focus-visible:ring-ring/50 flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none",
          activeView === "reading-list"
            ? "text-active"
            : "text-muted-foreground hover:text-foreground"
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
            disabled={isLoggingOut}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
          >
            <div className="border-border/50 bg-muted text-foreground flex size-5 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold">
              {userInitial}
            </div>
            <span className="text-[10px] font-medium">Profile</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-50 max-w-[calc(100vw-1rem)]" align="end" side="top">
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
  );
}
