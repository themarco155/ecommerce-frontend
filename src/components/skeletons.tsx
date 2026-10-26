export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Cargando productos">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="aspect-[4/3] w-full animate-pulse rounded-2xl bg-line" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-line" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-line" />
          <div className="h-9 w-40 animate-pulse rounded-full bg-line" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Cargando">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-line" />
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <>
    {/* Mismo espacio que el enlace "Volver" para evitar saltos de diseño (CLS) */}
    <div className="h-5 w-36 animate-pulse rounded bg-line" />
    <div className="mt-6 grid gap-10 md:grid-cols-2" aria-busy="true">
      <div className="aspect-[4/3] w-full animate-pulse rounded-2xl bg-line" />
      <div className="flex flex-col gap-4">
        <div className="h-10 w-3/4 animate-pulse rounded bg-line" />
        <div className="h-6 w-1/4 animate-pulse rounded bg-line" />
        <div className="h-24 w-full animate-pulse rounded bg-line" />
        <div className="h-12 w-48 animate-pulse rounded-full bg-line" />
      </div>
    </div>
    </>
  );
}
