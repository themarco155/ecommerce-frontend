import type { Metadata } from "next";
import Link from "next/link";
import { OrderSummary } from "@/components/order-summary";
import { StatusBadge } from "@/components/status-badge";
import { getOrder } from "@/lib/data";
import { date } from "@/lib/format";

export const metadata: Metadata = { title: "Detalle de orden" };

export default async function OrderDetail({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const order = await getOrder(id);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/orders" className="text-sm text-muted hover:text-ink">← Mis compras</Link>
      <div className="mb-6 mt-4 flex flex-wrap items-center gap-4">
        <h1 className="font-display text-4xl">Orden #{order.id}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="mb-6 text-muted">Creada el {date(order.created_at)}</p>
      <OrderSummary order={order} />
      {order.payment && (
        <p className="mt-4 text-sm text-muted">
          Pago Stripe {order.payment.stripe_payment_intent_id} · {order.payment.status}
        </p>
      )}
      {order.status === "pending" && (
        <Link href={`/checkout/${order.id}`} className="mt-6 inline-block rounded-full bg-ink px-5 py-2 text-sm text-paper">Pagar ahora</Link>
      )}
    </div>
  );
}
