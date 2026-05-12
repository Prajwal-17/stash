import { Stash, Tag } from "@/lib/stash-client";

export interface StashClientProps {
  initialStashes: Stash[];
  initialTags: Tag[];
  userEmail: string;
  userInitial: string;
  userName: string;
}

export interface EditStashState {
  stashId: string;
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
  kind: "stash" | "tag";
  id: string;
  title: string;
  description: string;
  confirmLabel: string;
}
