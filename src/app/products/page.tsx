import type { Metadata } from "next";
import { Suspense } from "react";
import { Pagination } from "@/components/pagination";
import { ProductCard } from "@/components/product-card";
import { ProductGridSkeleton } from "@/components/skeletons";
import { getProducts } from "@/lib/data";

export const metadata: Metadata = { title: "Catálogo" };

export default function ProductsPage({ searchParams }: PageProps<"/products">) {
  return (
    <>
      <section className="mb-10 max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">Catálogo</p>
        <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">Todo lo que necesitas, en un solo lugar.</h1>
        <p className="mt-3 text-muted">Elige tus productos, crea tu orden y paga de forma segura con Stripe.</p>
      </section>

      {/* Sección pesada: la lista se transmite (streaming) mientras se ve el esqueleto */}
      <Suspense fallback={<ProductGridSkeleton />}>
        <ProductList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ProductList({ searchParams }: Pick<PageProps<"/products">, "searchParams">) {
  const { page } = await searchParams;
  const current = Math.max(1, Number(page) || 1);
  const products = await getProducts(current);

  if (products.data.length === 0) {
    return <p className="text-muted">No hay productos disponibles por ahora.</p>;
  }

  return (
    <>
      <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {products.data.map((p, i) => (
          <ProductCard key={p.id} product={p} priority={i < 3} />
        ))}
      </div>
      <Pagination base="/products" page={products.current_page} last={products.last_page} />
    </>
  );
}
