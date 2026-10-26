import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <h1 className="font-display text-4xl">No encontrado</h1>
      <p className="mt-2 text-muted">Lo que buscas no existe o no te pertenece.</p>
      <Link href="/products" className="mt-6 inline-block rounded-full bg-ink px-5 py-2 text-sm text-paper">Volver al catálogo</Link>
    </div>
  );
}
