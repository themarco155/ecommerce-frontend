import type { Metadata } from "next";
import Link from "next/link";
import { OrderSummary } from "@/components/order-summary";
import { getOrder } from "@/lib/data";
import { money } from "@/lib/format";

export const metadata: Metadata = { title: "¡Compra confirmada!" };

export default async function SuccessPage({ params }: PageProps<"/checkout/[orderId]/success">) {
  const { orderId } = await params;
  const order = await getOrder(orderId, `/checkout/${orderId}/success`);
  const paid = order.status === "paid";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl ${paid ? "bg-emerald-100" : "bg-amber-100"}`} aria-hidden>
          {paid ? "✓" : "…"}
        </div>
        <h1 className="mt-4 font-display text-4xl">{paid ? "¡Gracias por tu compra!" : "Pago en proceso"}</h1>
        <p className="mt-2 text-muted">
          {paid
            ? `Tu orden #${order.id} fue pagada por ${money(order.total)}.`
            : `La orden #${order.id} todavía no aparece como pagada.`}
        </p>
        {order.payment && (
          <p className="mt-1 text-xs text-muted">
            Stripe: {order.payment.stripe_payment_intent_id} · estado {order.payment.status}
          </p>
        )}
      </div>
      <OrderSummary order={order} />
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/orders" className="rounded-full bg-ink px-5 py-2 text-sm text-paper hover:bg-accent">Ver mis compras</Link>
        <Link href="/products" className="rounded-full border border-line px-5 py-2 text-sm hover:border-ink">Seguir comprando</Link>
      </div>
    </div>
  );
}
