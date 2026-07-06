import { ReadingListView } from "@/components/readingList/ReadingListView";

export default function ReadingListPage() {
  return (
    <div className="bg-background text-foreground flex h-dvh w-full justify-center overflow-hidden pb-[env(safe-area-inset-bottom)]">
      <ReadingListView standalone />
    </div>
  );
}
