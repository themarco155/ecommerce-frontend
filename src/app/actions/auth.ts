"use server";

import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { saveSession } from "@/lib/session";
import type { FormState, User } from "@/lib/types";

type AuthData = {
  user: User;
  authorization: { token: string; type: string; expires_in: number };
};

/** Solo permitimos redirigir a rutas internas (evita "open redirect"). */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/products";
}

function toState(e: unknown, values: Record<string, string>): FormState {
  if (e instanceof ApiError) return { ok: false, message: e.message, errors: e.errors, values };
  return { ok: false, message: "Ocurrió un error inesperado. Intenta de nuevo.", values };
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, message: "Escribe tu correo y contraseña.", values: { email } };
  }

  try {
    const res = await api<AuthData>("/login", { method: "POST", body: { email, password } });
    const { user, authorization } = res.data;
    await saveSession(authorization.token, authorization.expires_in, user.name);
  } catch (e) {
    return toState(e, { email });
  }

  redirect(safeNext(formData.get("next")));
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const body = {
    name: String(formData.get("name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    password_confirmation: String(formData.get("password_confirmation") ?? ""),
  };

  const values = { name: body.name, email: body.email };

  if (body.password.length < 8) {
    return { ok: false, values, errors: { password: ["La contraseña debe tener al menos 8 caracteres."] } };
  }
  if (body.password !== body.password_confirmation) {
    return { ok: false, values, errors: { password_confirmation: ["Las contraseñas no coinciden."] } };
  }

  try {
    const res = await api<AuthData>("/register", { method: "POST", body });
    const { user, authorization } = res.data;
    await saveSession(authorization.token, authorization.expires_in, user.name);
  } catch (e) {
    return toState(e, values);
  }

  redirect(safeNext(formData.get("next")));
}
