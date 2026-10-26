import Link from "next/link";
import { money } from "@/lib/format";
import type { Product } from "@/lib/types";
import { AddToCart } from "./add-to-cart";
import { ProductImage } from "./product-image";

export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  return (
    <article className="group flex flex-col gap-3">
      <Link href={`/products/${product.id}`} className="block overflow-hidden rounded-2xl">
        <div className="transition duration-300 group-hover:scale-[1.02]">
          <ProductImage name={product.name} url={product.image_url} id={product.id} priority={priority} />
        </div>
      </Link>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-medium leading-snug">
            <Link href={`/products/${product.id}`} className="hover:underline">{product.name}</Link>
          </h2>
          <p className="text-sm text-muted">{product.stock > 0 ? `${product.stock} disponibles` : "Agotado"}</p>
        </div>
        <p className="font-display text-xl">{money(product.price)}</p>
      </div>
      <AddToCart id={product.id} name={product.name} price={product.price} stock={product.stock} />
    </article>
  );
}
