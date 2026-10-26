import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function Page() {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-line bg-card p-8">
      <h1 className="font-display text-3xl">Iniciar sesión</h1>
      <p className="mb-6 mt-1 text-muted">Entra para crear órdenes y ver tu historial.</p>
      <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-line" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
