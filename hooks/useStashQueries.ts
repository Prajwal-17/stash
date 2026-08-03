import { Stash, fetchStashes, fetchTags, stashQueryKeys, Tag } from "@/lib/stash-client";
import { useStashStore } from "@/store/stashStore";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useStashQueries() {
  const initialStashes = useStashStore((s) => s.initialStashes);
  const initialTags = useStashStore((s) => s.initialTags);

  const tagsQuery = useQuery({
    queryKey: stashQueryKeys.tags,
    queryFn: fetchTags,
    initialData: initialTags.length ? initialTags : undefined
  });

  const stashesQuery = useQuery({
    queryKey: stashQueryKeys.stashes,
    queryFn: fetchStashes,
    initialData: initialStashes.length ? initialStashes : undefined
  });

  const rawTags = useMemo(() => (tagsQuery.data ?? []) as Tag[], [tagsQuery.data]);
  const rawStashes = useMemo(() => (stashesQuery.data ?? []) as Stash[], [stashesQuery.data]);

  const tags = useMemo(() => rawTags.filter((tag) => !tag.archivedAt), [rawTags]);
  const activeTagIds = useMemo(() => new Set(tags.map((tag) => tag.id)), [tags]);
  const stashes = useMemo(
    () => rawStashes.filter((stash) => !stash.archivedAt && activeTagIds.has(stash.tagId)),
    [activeTagIds, rawStashes]
  );

  return {
    tagsQuery,
    stashesQuery,
    rawTags,
    rawStashes,
    tags,
    stashes
  };
}
