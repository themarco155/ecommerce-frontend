import { ProductGridSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <>
      <div className="mb-10 h-32 max-w-2xl animate-pulse rounded-2xl bg-line" />
      <ProductGridSkeleton />
    </>
  );
}
