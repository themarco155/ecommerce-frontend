const usd = new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" });

export const money = (value: string | number) => usd.format(Number(value));

export const date = (value: string) =>
  new Intl.DateTimeFormat("es-SV", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );

export const statusLabel: Record<string, string> = {
  pending: "Pendiente de pago",
  paid: "Pagada",
  cancelled: "Cancelada",
};
