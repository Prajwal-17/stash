import { getHostname } from "@/lib/link-utils";
import type { Stash } from "@/lib/stash-client";

export function getStashTitle(stash: Stash) {
  return stash.title?.trim() || getHostname(stash.url);
}
