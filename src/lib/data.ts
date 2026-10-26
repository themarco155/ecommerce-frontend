import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { api, ApiError } from "./api";
import { getToken } from "./session";
import type { Order, Paginated, Product } from "./types";

/* ---------- Lecturas públicas (con caché + etiquetas) ---------- */

export async function getProducts(page = 1) {
  "use cache";
  cacheLife("minutes");
  cacheTag("products");
  const res = await api<Paginated<Product>>(`/products?page=${page}`);
  return res.data;
}

export async function getProduct(id: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("products", `product-${id}`);
  try {
    const res = await api<Product>(`/products/${id}`);
    return res.data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

/* ---------- Lecturas privadas (del usuario, sin caché compartida) ---------- */

async function requireToken(next: string) {
  const token = await getToken();
  if (!token) redirect(`/login?next=${encodeURIComponent(next)}`);
  return token;
}

/** Si el token venció, mandamos al login en vez de mostrar un error. */
function handleAuthError(e: unknown, next: string): never {
  if (e instanceof ApiError && e.status === 401) {
    redirect(`/login?next=${encodeURIComponent(next)}&expired=1`);
  }
  if (e instanceof ApiError && (e.status === 404 || e.status === 403)) notFound();
  throw e;
}

export async function getOrders(page = 1) {
  const token = await requireToken("/orders");
  try {
    const res = await api<Paginated<Order>>(`/orders?page=${page}`, { token, cache: "no-store" });
    return res.data;
  } catch (e) {
    handleAuthError(e, "/orders");
  }
}

export async function getOrder(id: string, next = `/orders/${id}`) {
  const token = await requireToken(next);
  try {
    const res = await api<Order>(`/orders/${id}`, { token, cache: "no-store" });
    return res.data;
  } catch (e) {
    handleAuthError(e, next);
  }
}
