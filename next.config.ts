import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Modelo de caché moderno de Next.js 16 ("use cache" + cacheTag + Suspense)
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // La raíz del sitio lleva directo al catálogo
  async redirects() {
    return [{ source: "/", destination: "/products", permanent: false }];
  },
};

export default nextConfig;
