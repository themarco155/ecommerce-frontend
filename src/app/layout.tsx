import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CartBadge } from "@/components/cart-badge";
import { UserMenu } from "@/components/user-menu";
import { WebVitals } from "@/components/web-vitals";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Kodigo Shop", template: "%s · Kodigo Shop" },
  description: "Tienda en línea hecha con Next.js que consume la API de e-commerce en Laravel.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <WebVitals />
        <header className="border-b border-line bg-paper/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/products" className="font-display text-2xl tracking-tight">
              Kodigo<span className="text-accent">.</span>Shop
            </Link>
            {/* Altura fija (sin saltos de línea) para que el menú no mueva la página al cargar: CLS = 0 */}
            <nav className="flex h-10 items-center gap-1 overflow-x-auto whitespace-nowrap">
              <Link href="/products" className="px-3 py-2 text-sm hover:underline">Catálogo</Link>
              <Suspense fallback={<div className="h-9 w-40" />}>
                <UserMenu />
              </Suspense>
              <CartBadge />
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">{children}</main>
        <footer className="border-t border-line py-6 text-center text-sm text-muted">
          Proyecto Kodigo · Next.js + API Laravel 12 + Stripe (modo prueba)
        </footer>
      </body>
    </html>
  );
}
