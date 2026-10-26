"use client";

import Link from "next/link";
import { useEffect } from "react";

export function ErrorView({ error, retry, title }: { error: unknown; retry: () => void; title: string }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest = error instanceof Error && "digest" in error ? String(error.digest) : null;

  return (
    <div role="alert" className="mx-auto max-w-lg rounded-3xl border border-line bg-card p-8 text-center">
      <p className="text-4xl" aria-hidden>⚠️</p>
      <h1 className="mt-3 font-display text-2xl">{title}</h1>
      <p className="mt-2 text-muted">
        No pudimos cargar esta sección. Puede que la API no esté disponible en este momento.
      </p>
      {digest && <p className="mt-2 text-xs text-muted">Código: {digest}</p>}
      <div className="mt-6 flex justify-center gap-3">
        <button onClick={() => retry()} className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-paper hover:bg-accent">
          Reintentar
        </button>
        <Link href="/products" className="rounded-full border border-line px-5 py-2 text-sm hover:border-ink">
          Ir al catálogo
        </Link>
      </div>
    </div>
  );
}
