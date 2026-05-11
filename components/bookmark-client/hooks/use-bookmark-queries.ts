import {
  Bookmark,
  fetchBookmarks,
  fetchTags,
  stashQueryKeys,
  Tag,
} from "@/lib/stash-client";
import { useQuery } from "@tanstack/react-query";

export function useBookmarkQueries({
  initialBookmarks,
  initialTags,
}: {
  initialBookmarks: Bookmark[];
  initialTags: Tag[];
}) {
  const tagsQuery = useQuery({
    queryKey: stashQueryKeys.tags,
    queryFn: fetchTags,
    initialData: initialTags,
  });

  const bookmarksQuery = useQuery({
    queryKey: stashQueryKeys.bookmarks,
    queryFn: fetchBookmarks,
    initialData: initialBookmarks,
  });

  return {
    tagsQuery,
    bookmarksQuery,
    tags: tagsQuery.data ?? initialTags,
    bookmarks: bookmarksQuery.data ?? initialBookmarks,
  };
}
