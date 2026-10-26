import { ListSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <>
      <div className="mb-8 h-10 w-72 animate-pulse rounded bg-line" />
      <div className="grid gap-10 lg:grid-cols-2">
        <ListSkeleton rows={3} />
        <div className="h-64 animate-pulse rounded-3xl bg-line" />
      </div>
    </>
  );
}
