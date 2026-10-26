import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function Page() {
  return (
    <div className="mx-auto max-w-md rounded-3xl border border-line bg-card p-8">
      <h1 className="font-display text-3xl">Crear cuenta</h1>
      <p className="mb-6 mt-1 text-muted">Regístrate para comprar en la tienda.</p>
      <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-line" />}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
