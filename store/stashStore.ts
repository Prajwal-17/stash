import {
  ConfirmationState,
  EditStashState,
  TagEditorState,
} from "@/components/stashClient/types";
import { Stash, Tag } from "@/lib/stash-client";
import { create } from "zustand";

interface StashStore {
  activeTagId: string | null;
  composerTagId: string | null;
  setActiveTagId: (id: string | null) => void;
  setComposerTagId: (id: string | null) => void;

  urlInput: string;
  setUrlInput: (val: string) => void;
  notice: { type: "error" | "success"; message: string } | null;
  setNotice: (n: StashStore["notice"]) => void;

  // stash editor
  stashEditor: EditStashState | null;
  setStashEditor: (state: EditStashState | null) => void;

  // tag editor
  tagEditor: TagEditorState | null;
  setTagEditor: (state: TagEditorState | null) => void;

  // delete dialog
  confirmation: ConfirmationState | null;
  setConfirmation: (state: ConfirmationState | null) => void;

  // drawer(mobile)
  drawerStash: Stash | null;
  setDrawerStash: (stash: Stash | null) => void;

  // preview (desktop info panel)
  previewStash: Stash | null;
  setPreviewStash: (stash: Stash | null) => void;

  // keyboard navigation
  focusedStashIndex: number;
  setFocusedStashIndex: (index: number) => void;

  copiedStashId: string | null;
  setCopiedStashId: (id: string | null) => void;

  isLoggingOut: boolean;
  setIsLoggingOut: (val: boolean) => void;

  userEmail: string;
  userInitial: string;
  userName: string;
  setUserInfo: (info: { email: string; initial: string; name: string }) => void;

  initialStashes: Stash[];
  initialTags: Tag[];
  setInitialData: (data: { stashes: Stash[]; tags: Tag[] }) => void;
}

export const useStashStore = create<StashStore>((set) => ({
  activeTagId: null,
  composerTagId: null,
  setActiveTagId: (id) => set({ activeTagId: id }),
  setComposerTagId: (id) => set({ composerTagId: id }),

  urlInput: "",
  setUrlInput: (val) => set({ urlInput: val }),
  notice: null,
  setNotice: (n) => set({ notice: n }),

  stashEditor: null,
  setStashEditor: (state) => set({ stashEditor: state }),

  tagEditor: null,
  setTagEditor: (state) => set({ tagEditor: state }),

  confirmation: null,
  setConfirmation: (state) => set({ confirmation: state }),

  drawerStash: null,
  setDrawerStash: (stash) => set({ drawerStash: stash }),

  previewStash: null,
  setPreviewStash: (stash) => set({ previewStash: stash }),

  focusedStashIndex: -1,
  setFocusedStashIndex: (index) => set({ focusedStashIndex: index }),

  copiedStashId: null,
  setCopiedStashId: (id) => set({ copiedStashId: id }),

  isLoggingOut: false,
  setIsLoggingOut: (val) => set({ isLoggingOut: val }),

  userEmail: "",
  userInitial: "U",
  userName: "",
  setUserInfo: ({ email, initial, name }) =>
    set({ userEmail: email, userInitial: initial, userName: name }),

  initialStashes: [],
  initialTags: [],
  setInitialData: ({ stashes, tags }) =>
    set({ initialStashes: stashes, initialTags: tags }),
}));
