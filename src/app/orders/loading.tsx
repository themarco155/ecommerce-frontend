import { ListSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <>
      <div className="mb-8 h-10 w-56 animate-pulse rounded bg-line" />
      <ListSkeleton />
    </>
  );
}
