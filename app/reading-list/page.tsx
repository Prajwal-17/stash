import { ReadingListView } from "@/components/readingList/ReadingListView";

export default function ReadingListPage() {
  return (
    <div className="bg-background text-foreground flex h-dvh min-h-svh w-full justify-center overflow-hidden">
      <ReadingListView standalone />
    </div>
  );
}
