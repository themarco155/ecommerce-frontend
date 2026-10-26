import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/orders", "/checkout"];
const GUEST_ONLY = ["/login", "/register"];

/**
 * Proxy (antes "middleware"): corre antes de renderizar.
 * - Sin cookie de sesión → no puede entrar a historial ni checkout.
 * - Con sesión → no tiene sentido ver login/registro.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has("auth_token");

  if (!hasSession && PROTECTED.some((p) => pathname.startsWith(p))) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  if (hasSession && GUEST_ONLY.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/products", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/orders/:path*", "/checkout/:path*", "/login", "/register"],
};
