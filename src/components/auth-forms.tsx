"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { loginAction, registerAction } from "@/app/actions/auth";
import { Field } from "./field";

function Submit({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button
      disabled={pending}
      className="mt-2 rounded-full bg-ink px-6 py-3 font-medium text-paper hover:bg-accent disabled:opacity-60"
    >
      {pending ? "Procesando…" : children}
    </button>
  );
}

function Message({ text }: { text?: string }) {
  if (!text) return null;
  return <p role="alert" className="rounded-xl bg-orange-50 px-4 py-3 text-sm text-accent">{text}</p>;
}

export function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/products";
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <form action={action} className="flex flex-col gap-4">
      {params.get("expired") && <Message text="Tu sesión venció. Inicia sesión de nuevo." />}
      <Message text={state?.message} />
      <input type="hidden" name="next" value={next} />
      <Field label="Correo" name="email" type="email" autoComplete="email" required defaultValue={state?.values?.email} error={state?.errors?.email} />
      <Field label="Contraseña" name="password" type="password" autoComplete="current-password" required error={state?.errors?.password} />
      <Submit pending={pending}>Iniciar sesión</Submit>
      <p className="text-sm text-muted">
        ¿No tienes cuenta?{" "}
        <Link href={`/register?next=${encodeURIComponent(next)}`} className="text-ink underline">Regístrate</Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/products";
  const [state, action, pending] = useActionState(registerAction, null);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Message text={state?.errors ? undefined : state?.message} />
      <input type="hidden" name="next" value={next} />
      <Field label="Nombre" name="name" autoComplete="name" required defaultValue={state?.values?.name} error={state?.errors?.name} />
      <Field label="Correo" name="email" type="email" autoComplete="email" required defaultValue={state?.values?.email} error={state?.errors?.email} />
      <Field label="Contraseña" name="password" type="password" autoComplete="new-password" minLength={8} required error={state?.errors?.password} />
      <Field label="Confirmar contraseña" name="password_confirmation" type="password" autoComplete="new-password" minLength={8} required error={state?.errors?.password_confirmation} />
      <Submit pending={pending}>Crear cuenta</Submit>
      <p className="text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-ink underline">Inicia sesión</Link>
      </p>
    </form>
  );
}
