"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createOrderAction } from "@/app/actions/orders";
import { money } from "@/lib/format";
import { cartActions, useCart } from "./cart-store";

export function CartView() {
  const { items, total } = useCart();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line p-10 text-center">
        <p className="text-muted">Tu carrito está vacío.</p>
        <Link href="/products" className="mt-4 inline-block rounded-full bg-ink px-5 py-2 text-sm text-paper">Ver catálogo</Link>
      </div>
    );
  }

  function checkout() {
    setError(null);
    startTransition(async () => {
      const result = await createOrderAction(items.map((i) => ({ product_id: i.id, quantity: i.quantity })));
      if (result.ok) {
        cartActions.clear(); // la orden ya existe en la API, vaciamos el carrito local
        router.push(`/checkout/${result.data.id}`);
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
      <ul className="divide-y divide-line rounded-3xl border border-line bg-card">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center gap-4 p-5">
            <div className="min-w-0 flex-1">
              <Link href={`/products/${item.id}`} className="font-medium hover:underline">{item.name}</Link>
              <p className="text-sm text-muted">{money(item.price)} c/u</p>
            </div>
            <div className="flex items-center rounded-full border border-line">
              <button aria-label="Quitar uno" onClick={() => cartActions.setQuantity(item.id, item.quantity - 1)} className="px-3 py-1.5">−</button>
              <span className="w-8 text-center tabular-nums" aria-live="polite">{item.quantity}</span>
              <button
                aria-label="Agregar uno"
                disabled={item.quantity >= item.stock}
                onClick={() => cartActions.setQuantity(item.id, item.quantity + 1)}
                className="px-3 py-1.5 disabled:text-line"
              >+</button>
            </div>
            <p className="w-24 text-right font-medium tabular-nums">{money(item.price * item.quantity)}</p>
            <button onClick={() => cartActions.remove(item.id)} className="text-sm text-muted hover:text-accent">Quitar</button>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-3xl border border-line bg-card p-6">
        <h2 className="font-display text-2xl">Resumen</h2>
        <dl className="mt-4 flex justify-between text-lg">
          <dt>Total</dt>
          <dd className="font-semibold tabular-nums">{money(total)}</dd>
        </dl>
        <p className="mt-1 text-xs text-muted">El total final lo calcula la API con los precios actuales.</p>
        {error && <p role="alert" className="mt-4 rounded-xl bg-orange-50 px-4 py-3 text-sm text-accent">{error}</p>}
        <button
          onClick={checkout}
          disabled={pending}
          className="mt-5 w-full rounded-full bg-ink px-6 py-3 font-medium text-paper hover:bg-accent disabled:opacity-60"
        >
          {pending ? "Creando orden…" : "Crear orden y pagar"}
        </button>
        <button onClick={() => cartActions.clear()} className="mt-3 w-full text-sm text-muted hover:text-ink">Vaciar carrito</button>
      </aside>
    </div>
  );
}
