/* Imagen del producto. Si la API no trae image_url, dibuja un placeholder liviano (sin descargar nada). */
const tones = ["#f4d9c6", "#d8e4d3", "#d9dcef", "#efe0b9", "#e9d3e2", "#cfe3e6"];

export function ProductImage({ name, url, id, priority = false }: { name: string; url: string | null; id: number; priority?: boolean }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        width={600}
        height={450}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        className="aspect-[4/3] w-full rounded-2xl object-cover"
      />
    );
  }
  return (
    <div
      role="img"
      aria-label={name}
      className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl"
      style={{ background: tones[id % tones.length] }}
    >
      <span className="font-display text-6xl text-ink/70">{name.charAt(0)}</span>
    </div>
  );
}
