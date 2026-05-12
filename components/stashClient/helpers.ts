import { Stash } from "@/lib/stash-client";

export function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function getUrlPath(url: string) {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url;
  }
}

export function getStashTitle(stash: Stash) {
  return stash.title?.trim() || getHostname(stash.url);
}

export function getFaviconUrl(hostname: string) {
  return `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(hostname)}`;
}
