import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";

export const metadata: Metadata = { title: "Carrito" };

export default function CartPage() {
  return (
    <>
      <h1 className="mb-8 font-display text-4xl">Tu carrito</h1>
      <CartView />
    </>
  );
}
