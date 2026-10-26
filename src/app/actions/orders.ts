"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { clearSession, getToken } from "@/lib/session";
import type { Order, Payment } from "@/lib/types";

export type CartLine = { product_id: number; quantity: number };

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; message: string };

function fail(e: unknown): { ok: false; message: string } {
  if (e instanceof ApiError) {
    const detail = e.errors ? Object.values(e.errors).flat().join(" ") : "";
    return { ok: false, message: detail || e.message };
  }
  return { ok: false, message: "Ocurrió un error inesperado. Intenta de nuevo." };
}

async function tokenOrLogin(next: string) {
  const token = await getToken();
  if (!token) redirect(`/login?next=${encodeURIComponent(next)}`);
  return token;
}

/** Crea la orden en la API con los productos del carrito. */
export async function createOrderAction(items: CartLine[]): Promise<ActionResult<{ id: number }>> {
  const token = await tokenOrLogin("/cart");

  // Validación básica antes de llamar a la API
  const clean = items
    .filter((i) => Number.isInteger(i.product_id) && Number.isInteger(i.quantity) && i.quantity > 0)
    .map(({ product_id, quantity }) => ({ product_id, quantity }));
  if (clean.length === 0) return { ok: false, message: "Tu carrito está vacío." };

  let order: Order;
  try {
    const res = await api<Order>("/orders", { method: "POST", token, body: { items: clean } });
    order = res.data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      await clearSession();
      redirect("/login?next=/cart&expired=1");
    }
    return fail(e);
  }

  // El stock cambió → el catálogo en caché queda viejo. Lo invalidamos de inmediato.
  revalidateTag("products", { expire: 0 });
  // El historial del usuario tiene una orden nueva.
  revalidatePath("/orders");

  return { ok: true, data: { id: order.id } };
}

/** Paga la orden llamando a POST /orders/{id}/pay (Stripe PaymentIntent en la API). */
export async function payOrderAction(
  orderId: number,
  paymentMethod: string,
): Promise<ActionResult> {
  const token = await tokenOrLogin(`/checkout/${orderId}`);

  if (!/^pm_[A-Za-z0-9_]+$/.test(paymentMethod)) {
    return { ok: false, message: "Método de pago no válido." };
  }

  try {
    const res = await api<{ order: Order; payment: Payment }>(`/orders/${orderId}/pay`, {
      method: "POST",
      token,
      body: { payment_method: paymentMethod },
    });
    if (!res.success) {
      return { ok: false, message: res.message ?? "El pago no se completó." };
    }
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      await clearSession();
      redirect(`/login?next=/checkout/${orderId}&expired=1`);
    }
    return fail(e);
  }

  // La orden pasó a "paid": refrescamos historial, detalle y checkout.
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath(`/checkout/${orderId}`);

  redirect(`/checkout/${orderId}/success`);
}
