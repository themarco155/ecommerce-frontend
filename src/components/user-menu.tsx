import Link from "next/link";
import { getUserName } from "@/lib/session";

/** Lee la cookie de sesión → va dentro de <Suspense> en el layout. */
export async function UserMenu() {
  const name = await getUserName();

  if (!name) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Link href="/login" className="px-3 py-2 hover:underline">Iniciar sesión</Link>
        <Link href="/register" className="rounded-full bg-ink px-4 py-2 font-medium text-paper hover:bg-accent">Crear cuenta</Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <Link href="/orders" className="px-3 py-2 hover:underline">Mis compras</Link>
      <span className="hidden text-muted sm:inline">Hola, {name.split(" ")[0]}</span>
      <form action="/api/auth/logout" method="post">
        <button className="px-3 py-2 text-muted hover:text-ink hover:underline">Salir</button>
      </form>
    </div>
  );
}
