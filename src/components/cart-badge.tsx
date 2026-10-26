"use client";

import Link from "next/link";
import { useCart } from "./cart-store";

export function CartBadge() {
  const { count } = useCart();
  return (
    <Link
      href="/cart"
      className="relative inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium hover:border-ink"
      aria-label={`Carrito, ${count} productos`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M6 6h15l-1.5 9h-12z" /><path d="M6 6 5 3H2" /><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" />
      </svg>
      Carrito
      {count > 0 && (
        <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white">{count}</span>
      )}
    </Link>
  );
}
