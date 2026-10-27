# Kodigo Shop · Frontend E-commerce en Next.js

Frontend en **Next.js 16 (App Router) + TypeScript + Tailwind** que consume la
[API de e-commerce en Laravel 12 + Swagger + Stripe](https://github.com/themarco155/ecommerce-api).

Flujo completo: **catálogo → carrito → login → crear orden → pago con Stripe → confirmación → historial**.

## Requisitos

- Node.js 20.9 o superior
- La API Laravel corriendo (`php artisan serve` → `http://127.0.0.1:8000`)

## Configuración (`.env.example`)

```env
# URL base de la API Laravel (incluye /api, sin "/" al final)
API_BASE_URL=http://127.0.0.1:8000/api

# (Opcional) Clave PÚBLICA de Stripe en modo prueba (pk_test_...)
NEXT_PUBLIC_STRIPE_KEY=
```

| Variable | Uso |
|---|---|
| `API_BASE_URL` | URL de la API. Solo se usa en el servidor (Server Components / Server Actions), nunca llega al navegador. |
| `NEXT_PUBLIC_STRIPE_KEY` | Opcional. Si la pones, el checkout muestra el formulario de tarjeta de **Stripe Elements**. Si está vacía, se usan los métodos de prueba de Stripe (`pm_card_visa`, `pm_card_mastercard`, `pm_card_chargeDeclined`). |

> Usa `127.0.0.1` y no `localhost`: en Windows Node puede resolver `localhost` a IPv6 (`::1`) y `php artisan serve` solo escucha en IPv4.

## Cómo ejecutar

```bash
# 1. Levanta la API (en la carpeta ecommerce-api)
php artisan serve

# 2. En esta carpeta
npm install
cp .env.example .env.local      # en Windows: copy .env.example .env.local
npm run dev                     # http://localhost:3000
```

Para medir rendimiento usa el modo producción:

```bash
npm run build
npm start
```

Usuario de prueba (lo crea el seeder de la API): `cliente@example.com` / `password123`.

## Rutas implementadas

| Ruta | Tipo | Descripción |
|---|---|---|
| `/products` | Pública | Catálogo con paginación (`?page=2`). `/` redirige aquí. |
| `/products/[id]` | Pública | Detalle del producto. |
| `/login` | Solo invitados | Inicio de sesión. |
| `/register` | Solo invitados | Registro de cliente. |
| `/cart` | Pública | Carrito (estado local) y botón para crear la orden. |
| `/checkout/[orderId]` | Protegida | Resumen de la orden y pago con Stripe. |
| `/checkout/[orderId]/success` | Protegida | Confirmación de compra. |
| `/orders` | Protegida | Historial de compras del usuario. |
| `/orders/[id]` | Protegida | Detalle de una orden. |
| `POST /api/auth/logout` | Route Handler | Cierra sesión en la API y borra la cookie. |

## Endpoints de la API que se consumen

| Endpoint | Dónde se usa | Cómo |
|---|---|---|
| `GET /products` | Catálogo | Server Component + `"use cache"` + `cacheTag("products")` |
| `GET /products/{id}` | Detalle | Server Component + `"use cache"` |
| `POST /register` | Registro | Server Action `registerAction` |
| `POST /login` | Login | Server Action `loginAction` |
| `POST /logout` | Menú "Salir" | Route Handler `/api/auth/logout` |
| `POST /orders` | Carrito | Server Action `createOrderAction` |
| `GET /orders/{id}` | Checkout, confirmación y detalle | Server Component (sin caché, por usuario) |
| `POST /orders/{id}/pay` | Checkout | Server Action `payOrderAction` |
| `GET /orders` | Historial | Server Component dentro de `<Suspense>` |

## Cómo se cumplió cada requisito

**Lecturas en el servidor.** Todo `fetch` a la API pasa por `src/lib/api.ts` (marcado `server-only`), así el token JWT nunca se expone al navegador.

**Mutaciones con Server Actions.** Login, registro, crear orden y pagar están en `src/app/actions/`.

**Token seguro.** Al hacer login/registro, la Server Action guarda el JWT en una cookie **httpOnly**, `sameSite=lax`, `secure` en producción y con la misma duración que el token (`expires_in`). El cierre de sesión es un **Route Handler** (`src/app/api/auth/logout/route.ts`). El archivo **`src/proxy.ts`** (el antiguo *middleware* en Next 16) protege `/orders` y `/checkout` y saca a los usuarios con sesión de `/login` y `/register`. Si el token vence (401), se borra la cookie y se manda al login.

**Carrito.** Estado local en el navegador (`src/components/cart-store.ts`), guardado en `localStorage` y compartido con `useSyncExternalStore`. Respeta el stock disponible. Se vacía solo cuando la API confirma la orden.

**Pago con Stripe.** La Server Action llama a `POST /orders/{id}/pay` con el `payment_method`. Con `NEXT_PUBLIC_STRIPE_KEY`, Stripe.js crea el PaymentMethod en el navegador (los datos de la tarjeta nunca pasan por nuestro servidor). Si el pago se rechaza, se muestra el error sin salir de la página.

**Rendimiento y resiliencia**
- `loading.tsx` en `/products`, `/products/[id]`, `/checkout/[orderId]`, `/checkout/[orderId]/success`, `/orders` y `/orders/[id]`.
- `error.tsx` en la raíz, `/products`, `/checkout` y `/orders` (con botón "Reintentar").
- `<Suspense>` en la lista de productos, en el historial de compras y en el menú de usuario.
- Sin datos viejos después de mutar: al crear una orden se llama `revalidateTag("products", { expire: 0 })` (el stock cambió) y `revalidatePath("/orders")`; al pagar, `revalidatePath` de `/orders`, `/orders/[id]` y `/checkout/[id]`.
- Web Vitals: `src/components/web-vitals.tsx` usa `useReportWebVitals` y muestra LCP, CLS, INP, FCP y TTFB en la consola (F12).
- Sin fuentes externas ni imágenes pesadas; el encabezado tiene altura fija para que el CLS sea 0.

## Evidencia (capturas, Lighthouse y PDF)

Con la API corriendo (`php artisan serve`), ejecuta:

```bash
npm run evidencia
```

El script (`scripts/evidencia.mjs`) usa tu Chrome o Edge y hace todo solo:

1. Compila el frontend y lo levanta en modo producción en `http://localhost:3100`.
2. Toma capturas de **Swagger** (lista de endpoints y detalle de login, crear orden y pagar).
3. Recorre el **flujo completo de compra** contra la API real: catálogo → detalle → carrito → registro → crear orden → pago rechazado → pago aprobado con Stripe → confirmación → historial → ruta protegida.
4. Corre **Lighthouse** (móvil y escritorio) y guarda los reportes.
5. Junta todo en un PDF.

Resultado:

- `docs/capturas/`: capturas PNG.
- `docs/lighthouse/`: reportes de Lighthouse en HTML.
- `docs/evidencia.pdf`: todo en un solo documento.

## Estructura

```
src/
├── app/
│   ├── actions/        # Server Actions (auth.ts, orders.ts)
│   ├── api/auth/logout # Route Handler de logout
│   ├── products/       # catálogo y detalle (+ loading / error)
│   ├── cart/           # carrito
│   ├── checkout/       # pago y confirmación (+ loading / error)
│   ├── orders/         # historial (+ loading / error)
│   ├── login/ register/
│   └── layout.tsx
├── components/         # UI (carrito, formularios, skeletons, pago…)
├── lib/                # api.ts, data.ts, session.ts, tipos y formato
└── proxy.ts            # protección de rutas
```
