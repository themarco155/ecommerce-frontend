import Link from "next/link";

export function Pagination({ base, page, last }: { base: string; page: number; last: number }) {
  if (last <= 1) return null;
  const link = "rounded-full border border-line px-4 py-2 text-sm hover:border-ink";
  return (
    <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Paginación">
      {page > 1 ? <Link className={link} href={`${base}?page=${page - 1}`}>← Anterior</Link> : <span />}
      <span className="text-sm text-muted">Página {page} de {last}</span>
      {page < last ? <Link className={link} href={`${base}?page=${page + 1}`}>Siguiente →</Link> : <span />}
    </nav>
  );
}
