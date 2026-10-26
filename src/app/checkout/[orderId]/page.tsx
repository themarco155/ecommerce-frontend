import type { Metadata } from "next";
import Link from "next/link";
import { OrderSummary } from "@/components/order-summary";
import { PaymentForm } from "@/components/payment-form";
import { StatusBadge } from "@/components/status-badge";
import { getOrder } from "@/lib/data";

export const metadata: Metadata = { title: "Pago" };

export default async function CheckoutPage({ params }: PageProps<"/checkout/[orderId]">) {
  const { orderId } = await params;
  const order = await getOrder(orderId, `/checkout/${orderId}`);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center gap-4">
        <h1 className="font-display text-4xl">Pagar orden #{order.id}</h1>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">Resumen</h2>
          <OrderSummary order={order} />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">Pago</h2>
          {order.status === "pending" ? (
            <PaymentForm orderId={order.id} total={order.total} stripeKey={process.env.NEXT_PUBLIC_STRIPE_KEY ?? ""} />
          ) : (
            <div className="rounded-3xl border border-line bg-card p-6">
              <p>Esta orden ya está <strong>{order.status === "paid" ? "pagada" : "cancelada"}</strong>.</p>
              <Link href={`/orders/${order.id}`} className="mt-4 inline-block underline">Ver detalle</Link>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
