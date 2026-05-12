import {
  Stash,
  fetchStashes,
  fetchTags,
  stashQueryKeys,
  Tag,
} from "@/lib/stash-client";
import { useStashStore } from "@/store/stashStore";
import { useQuery } from "@tanstack/react-query";

export function useStashQueries() {
  const initialStashes = useStashStore((s) => s.initialStashes);
  const initialTags = useStashStore((s) => s.initialTags);

  const tagsQuery = useQuery({
    queryKey: stashQueryKeys.tags,
    queryFn: fetchTags,
    initialData: initialTags.length ? initialTags : undefined,
  });

  const stashesQuery = useQuery({
    queryKey: stashQueryKeys.stashes,
    queryFn: fetchStashes,
    initialData: initialStashes.length ? initialStashes : undefined,
  });

  return {
    tagsQuery,
    stashesQuery,
    tags: (tagsQuery.data ?? []) as Tag[],
    stashes: (stashesQuery.data ?? []) as Stash[],
  };
}
