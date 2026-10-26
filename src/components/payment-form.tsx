"use client";

import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { useState, useTransition } from "react";
import { payOrderAction } from "@/app/actions/orders";
import { money } from "@/lib/format";

type Props = { orderId: number; total: string; stripeKey: string };

/**
 * Formulario de pago.
 * - Con NEXT_PUBLIC_STRIPE_KEY: tarjeta real de prueba con Stripe Elements.
 *   Stripe.js crea el PaymentMethod (los datos de la tarjeta nunca pasan por nuestro servidor)
 *   y solo enviamos su id (pm_...) a la API.
 * - Sin clave: usa los PaymentMethods de prueba de Stripe (pm_card_visa, etc.).
 */
export function PaymentForm(props: Props) {
  if (props.stripeKey) return <StripeElementsForm {...props} />;
  return <TestMethodsForm {...props} />;
}

let stripePromise: Promise<Stripe | null> | null = null;

function StripeElementsForm(props: Props) {
  stripePromise ??= loadStripe(props.stripeKey);
  return (
    <Elements stripe={stripePromise}>
      <CardForm {...props} />
    </Elements>
  );
}

function CardForm({ orderId, total }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) return;
    setError(null);

    startTransition(async () => {
      const { paymentMethod, error: stripeError } = await stripe.createPaymentMethod({ type: "card", card });
      if (stripeError || !paymentMethod) {
        setError(stripeError?.message ?? "No se pudo leer la tarjeta.");
        return;
      }
      const result = await payOrderAction(orderId, paymentMethod.id);
      if (result && !result.ok) setError(result.message);
    });
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-line bg-card p-6">
      <label className="text-sm font-medium">Tarjeta</label>
      <div className="mt-2 rounded-xl border border-line px-4 py-4">
        <CardElement options={{ hidePostalCode: true, style: { base: { fontSize: "16px", color: "#1d1b18" } } }} />
      </div>
      <p className="mt-2 text-xs text-muted">Prueba con 4242 4242 4242 4242, cualquier fecha futura y CVC.</p>
      <Feedback error={error} />
      <PayButton pending={pending} disabled={!stripe} total={total} />
    </form>
  );
}

const TEST_METHODS = [
  { id: "pm_card_visa", label: "Visa · aprobada", hint: "4242 4242 4242 4242" },
  { id: "pm_card_mastercard", label: "Mastercard · aprobada", hint: "5555 5555 5555 4444" },
  { id: "pm_card_chargeDeclined", label: "Tarjeta rechazada", hint: "Para probar el manejo de errores" },
];

function TestMethodsForm({ orderId, total }: Props) {
  const [method, setMethod] = useState(TEST_METHODS[0].id);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await payOrderAction(orderId, method);
      if (result && !result.ok) setError(result.message);
    });
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-line bg-card p-6">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-sm font-medium">Método de pago de prueba (Stripe)</legend>
        {TEST_METHODS.map((m) => (
          <label
            key={m.id}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 ${method === m.id ? "border-ink" : "border-line"}`}
          >
            <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} />
            <span className="flex-1">
              <span className="block font-medium">{m.label}</span>
              <span className="block text-xs text-muted">{m.hint} · {m.id}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <Feedback error={error} />
      <PayButton pending={pending} total={total} />
    </form>
  );
}

function Feedback({ error }: { error: string | null }) {
  if (!error) return null;
  return <p role="alert" className="mt-4 rounded-xl bg-orange-50 px-4 py-3 text-sm text-accent">{error}</p>;
}

function PayButton({ pending, disabled, total }: { pending: boolean; disabled?: boolean; total: string }) {
  return (
    <button
      disabled={pending || disabled}
      className="mt-5 w-full rounded-full bg-ink px-6 py-3 font-medium text-paper hover:bg-accent disabled:opacity-60"
    >
      {pending ? "Procesando pago…" : `Pagar ${money(total)}`}
    </button>
  );
}
