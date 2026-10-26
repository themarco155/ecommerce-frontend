"use client";

import { useState } from "react";
import { cartActions, useCart } from "./cart-store";

type Props = { id: number; name: string; price: string; stock: number; size?: "sm" | "lg" };

export function AddToCart({ id, name, price, stock, size = "sm" }: Props) {
  const { items } = useCart();
  const [added, setAdded] = useState(false);
  const inCart = items.find((i) => i.id === id)?.quantity ?? 0;
  const soldOut = stock <= 0 || inCart >= stock;

  function add() {
    cartActions.add({ id, name, price: Number(price), stock });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  const pad = size === "lg" ? "px-6 py-3 text-base" : "px-4 py-2 text-sm";
  return (
    <button
      type="button"
      onClick={add}
      disabled={soldOut}
      className={`${pad} rounded-full bg-ink font-medium text-paper transition hover:bg-accent disabled:cursor-not-allowed disabled:bg-line disabled:text-muted`}
    >
      {stock <= 0 ? "Agotado" : inCart >= stock ? "Máximo en carrito" : added ? "¡Agregado!" : "Agregar al carrito"}
    </button>
  );
}
