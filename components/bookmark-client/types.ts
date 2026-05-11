import { Bookmark, Tag } from "@/lib/stash-client";

export interface BookmarkClientProps {
  initialBookmarks: Bookmark[];
  initialTags: Tag[];
  userEmail: string;
  userInitial: string;
  userName: string;
}

export interface EditBookmarkState {
  bookmarkId: string;
  url: string;
  title: string;
  description: string;
  tagId: string;
}

export interface TagEditorState {
  mode: "create" | "edit";
  tagId?: string;
  name: string;
}

export interface ConfirmationState {
  kind: "bookmark" | "tag";
  id: string;
  title: string;
  description: string;
  confirmLabel: string;
}
