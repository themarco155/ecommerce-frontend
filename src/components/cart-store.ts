"use client";

import { useSyncExternalStore } from "react";

export type CartItem = {
  id: number;
  name: string;
  price: number;
  stock: number;
  quantity: number;
};

/**
 * Carrito en estado local del navegador (localStorage).
 * Usamos useSyncExternalStore para que todos los componentes
 * (badge del menú, página del carrito, botones) vean el mismo estado.
 */
const KEY = "cart:v1";
const EMPTY: CartItem[] = [];
let items: CartItem[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    items = raw ? (JSON.parse(raw) as CartItem[]) : EMPTY;
  } catch {
    items = EMPTY;
  }
}

function save(next: CartItem[]) {
  items = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* modo privado o storage bloqueado: el carrito sigue en memoria */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Sincroniza entre pestañas
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      loaded = false;
      load();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  load();
  return items;
}

export function useCart() {
  const cart = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
  const count = cart.reduce((n, i) => n + i.quantity, 0);
  const total = cart.reduce((n, i) => n + i.quantity * i.price, 0);
  return { items: cart, count, total };
}

export const cartActions = {
  add(product: Omit<CartItem, "quantity">, quantity = 1) {
    load();
    const found = items.find((i) => i.id === product.id);
    if (found) {
      const q = Math.min(found.quantity + quantity, product.stock);
      save(items.map((i) => (i.id === product.id ? { ...i, ...product, quantity: q } : i)));
    } else {
      save([...items, { ...product, quantity: Math.min(quantity, product.stock) }]);
    }
  },
  setQuantity(id: number, quantity: number) {
    load();
    if (quantity <= 0) return cartActions.remove(id);
    save(items.map((i) => (i.id === id ? { ...i, quantity: Math.min(quantity, i.stock) } : i)));
  },
  remove(id: number) {
    load();
    save(items.filter((i) => i.id !== id));
  },
  clear() {
    save(EMPTY);
  },
};
