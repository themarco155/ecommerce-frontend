import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/add-to-cart";
import { ProductImage } from "@/components/product-image";
import { getProduct } from "@/lib/data";
import { money } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/products/[id]">): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  return { title: product?.name ?? "Producto", description: product?.description ?? undefined };
}

export default async function ProductDetail({ params }: PageProps<"/products/[id]">) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product || !product.active) notFound();

  return (
    <>
      <Link href="/products" className="text-sm text-muted hover:text-ink">← Volver al catálogo</Link>
      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <ProductImage name={product.name} url={product.image_url} id={product.id} priority />
        <div className="flex flex-col gap-5">
          <h1 className="font-display text-4xl leading-tight">{product.name}</h1>
          <p className="font-display text-3xl text-accent">{money(product.price)}</p>
          <p className="leading-relaxed text-muted">{product.description ?? "Sin descripción."}</p>
          <p className="text-sm">
            {product.stock > 0 ? (
              <><span className="font-semibold">{product.stock}</span> unidades disponibles</>
            ) : (
              <span className="font-semibold text-accent">Agotado</span>
            )}
          </p>
          <div>
            <AddToCart id={product.id} name={product.name} price={product.price} stock={product.stock} size="lg" />
          </div>
        </div>
      </div>
    </>
  );
}
