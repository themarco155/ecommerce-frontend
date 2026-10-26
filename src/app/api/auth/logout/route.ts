import { NextResponse, type NextRequest } from "next/server";
import { api } from "@/lib/api";
import { clearSession, getToken } from "@/lib/session";

/**
 * Route Handler de cierre de sesión:
 * 1. Invalida el JWT en la API (POST /logout).
 * 2. Borra la cookie httpOnly del navegador.
 */
export async function POST(request: NextRequest) {
  const token = await getToken();
  if (token) {
    // Si el token ya venció, igual borramos la cookie.
    await api("/logout", { method: "POST", token }).catch(() => null);
  }
  await clearSession();
  return NextResponse.redirect(new URL("/products", request.url), { status: 303 });
}
