import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Pagination } from "@/components/pagination";
import { ListSkeleton } from "@/components/skeletons";
import { StatusBadge } from "@/components/status-badge";
import { getOrders } from "@/lib/data";
import { date, money } from "@/lib/format";

export const metadata: Metadata = { title: "Mis compras" };

export default function OrdersPage({ searchParams }: PageProps<"/orders">) {
  return (
    <>
      <h1 className="mb-2 font-display text-4xl">Mis compras</h1>
      <p className="mb-8 text-muted">Historial de tus órdenes y su estado de pago.</p>
      <Suspense fallback={<ListSkeleton />}>
        <OrderList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function OrderList({ searchParams }: Pick<PageProps<"/orders">, "searchParams">) {
  const { page } = await searchParams;
  const orders = await getOrders(Math.max(1, Number(page) || 1));

  if (orders.data.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line p-10 text-center">
        <p className="text-muted">Todavía no tienes compras.</p>
        <Link href="/products" className="mt-4 inline-block rounded-full bg-ink px-5 py-2 text-sm text-paper">Ir al catálogo</Link>
      </div>
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {orders.data.map((order) => (
          <li key={order.id}>
            <Link
              href={order.status === "pending" ? `/checkout/${order.id}` : `/orders/${order.id}`}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-card px-5 py-4 hover:border-ink"
            >
              <span className="font-display text-xl">#{order.id}</span>
              <span className="flex-1 text-sm text-muted">
                {date(order.created_at)} · {order.items?.reduce((n, i) => n + i.quantity, 0) ?? 0} artículos
              </span>
              <StatusBadge status={order.status} />
              <span className="w-24 text-right font-semibold tabular-nums">{money(order.total)}</span>
            </Link>
          </li>
        ))}
      </ul>
      <Pagination base="/orders" page={orders.current_page} last={orders.last_page} />
    </>
  );
}
