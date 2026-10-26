import { money } from "@/lib/format";
import type { Order } from "@/lib/types";

export function OrderSummary({ order }: { order: Order }) {
  return (
    <div className="rounded-3xl border border-line bg-card">
      <ul className="divide-y divide-line">
        {order.items?.map((item) => (
          <li key={item.id} className="flex justify-between gap-4 px-5 py-4">
            <span>
              {item.product?.name ?? `Producto #${item.product_id}`}
              <span className="text-muted"> × {item.quantity}</span>
            </span>
            <span className="tabular-nums">{money(item.subtotal)}</span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between border-t border-line px-5 py-4 text-lg font-semibold">
        <span>Total</span>
        <span className="tabular-nums">{money(order.total)}</span>
      </div>
    </div>
  );
}
