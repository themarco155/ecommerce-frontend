/**
 * Genera la evidencia de la entrega de forma automática:
 *   1. Capturas de Swagger (endpoints de la API).
 *   2. Capturas del flujo completo de compra contra la API real (registro → carrito → orden → pago → historial).
 *   3. Reportes de Lighthouse (HTML) + capturas de esos reportes.
 *   4. Un PDF con todo: docs/evidencia.pdf
 *
 * Requisitos: la API Laravel corriendo (php artisan serve) y Google Chrome o Microsoft Edge instalado.
 * Uso:  npm run evidencia            (compila y levanta el frontend en modo producción en el puerto 3100)
 *       npm run evidencia -- --skip-build
 */
import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";
import { chromium } from "playwright-core";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SHOTS = path.join(ROOT, "docs", "capturas");
const LH_DIR = path.join(ROOT, "docs", "lighthouse");
const PORT = Number(process.env.EVIDENCIA_PORT ?? 3100);
const APP = `http://localhost:${PORT}`;
const skipBuild = process.argv.includes("--skip-build");

/* ---------- Configuración ---------- */

function readEnvFile() {
  const env = {};
  for (const file of [".env.local", ".env"]) {
    const p = path.join(ROOT, file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !(m[1] in env)) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

const fileEnv = readEnvFile();
const API = (process.env.API_BASE_URL ?? fileEnv.API_BASE_URL ?? "http://127.0.0.1:8000/api").replace(/\/$/, "");
const SWAGGER = API.replace(/\/api$/, "") + "/api/documentation";

const log = (msg) => console.log(`\x1b[36m▶\x1b[0m ${msg}`);
const ok = (msg) => console.log(`\x1b[32m✓\x1b[0m ${msg}`);
const warn = (msg) => console.log(`\x1b[33m!\x1b[0m ${msg}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- Navegador ---------- */

function browserPath() {
  if (process.env.EVIDENCIA_BROWSER_PATH) return process.env.EVIDENCIA_BROWSER_PATH;
  const found = chromeLauncher.Launcher.getInstallations();
  if (found.length) return found[0];
  const edge = [
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ].find((p) => fs.existsSync(p));
  if (edge) return edge;
  throw new Error("No encontré Google Chrome ni Microsoft Edge instalados.");
}

/* ---------- Servidor de Next.js ---------- */

async function waitFor(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      /* todavía no responde */
    }
    await sleep(1000);
  }
  return false;
}

function startNext() {
  const nextBin = require.resolve("next/dist/bin/next", { paths: [ROOT] });
  const child = spawn(process.execPath, [nextBin, "start", "-p", String(PORT)], {
    cwd: ROOT,
    env: { ...process.env, ...fileEnv, API_BASE_URL: API },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stderr.on("data", (d) => process.stderr.write(d));
  return child;
}

/* ---------- Ayudantes de Playwright ---------- */

const vis = (page, selector) => page.locator(`${selector} >> visible=true`).first();

async function shot(page, name, title, list) {
  const file = path.join(SHOTS, `${name}.png`);
  await page.waitForTimeout(400);
  await page.screenshot({ path: file, fullPage: true });
  list.push({ file, title });
  ok(`Captura: docs/capturas/${name}.png`);
}

async function swaggerShots(browser, list) {
  log(`Swagger: ${SWAGGER}`);
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  try {
    await page.goto(SWAGGER, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForSelector(".opblock", { timeout: 20000 });
    await shot(page, "01-swagger-endpoints", "Swagger UI: todos los endpoints de la API", list);

    // Detalle de los endpoints clave que consume el frontend
    for (const [method, route, name, title] of [
      ["post", "/api/login", "02-swagger-login", "Swagger: POST /api/login"],
      ["post", "/api/orders", "03-swagger-crear-orden", "Swagger: POST /api/orders"],
      ["post", "/api/orders/{order}/pay", "04-swagger-pagar-orden", "Swagger: POST /api/orders/{order}/pay (Stripe)"],
    ]) {
      const block = page.locator(`.opblock-${method}`).filter({
        has: page.locator(".opblock-summary-path", { hasText: new RegExp(`^${route.replace(/[{}]/g, "\\$&")}$`) }),
      }).first();
      if (!(await block.count())) {
        warn(`No encontré ${method.toUpperCase()} ${route} en Swagger`);
        continue;
      }
      await block.locator(".opblock-summary").first().click();
      await page.waitForTimeout(600);
      const file = path.join(SHOTS, `${name}.png`);
      await block.screenshot({ path: file });
      list.push({ file, title });
      ok(`Captura: docs/capturas/${name}.png`);
      await block.locator(".opblock-summary").first().click();
    }
  } catch (e) {
    warn(`No se pudieron tomar las capturas de Swagger: ${e.message}`);
  } finally {
    await page.close();
  }
}

async function payWith(page, method) {
  // Modo sin clave pública: radios con PaymentMethods de prueba
  const radio = page.locator(`input[value=${method}] >> visible=true`);
  if (await radio.count()) {
    await radio.first().check();
  } else {
    // Modo Stripe Elements: llenar la tarjeta dentro del iframe de Stripe
    const card = method === "pm_card_chargeDeclined" ? "4000000000000002" : "4242424242424242";
    const frame = page.frameLocator('iframe[name^="__privateStripeFrame"]').first();
    await frame.locator('input[name="cardnumber"]').fill(card);
    await frame.locator('input[name="exp-date"]').fill("12/34");
    await frame.locator('input[name="cvc"]').fill("123");
  }
  await vis(page, "button:has-text('Pagar')").click();
}

async function purchaseFlow(browser, list) {
  log("Flujo completo de compra contra la API real");
  const context = await browser.newContext({ viewport: { width: 1366, height: 860 }, locale: "es-SV" });
  const page = await context.newPage();
  const email = `demo.${Date.now()}@example.com`;

  await page.goto(`${APP}/products`);
  await vis(page, "article").waitFor();
  await shot(page, "05-catalogo", "Catálogo público (GET /api/products)", list);

  const first = page.locator("article").first();
  const firstName = (await first.locator("h2").innerText()).trim();
  await first.locator("h2 a").click();
  await vis(page, `h1:has-text("${firstName}")`).waitFor();
  await shot(page, "06-detalle-producto", `Detalle de producto (GET /api/products/{id}): ${firstName}`, list);

  await vis(page, "button:has-text('Agregar al carrito')").click();
  await page.waitForTimeout(300);
  await vis(page, "button:has-text('Agregar al carrito')").click();
  await page.goto(`${APP}/products`);
  await page.locator("article").nth(1).locator("button").click();
  await page.goto(`${APP}/cart`);
  await vis(page, "text=Resumen").waitFor();
  await shot(page, "07-carrito", "Carrito con estado local (agregar / quitar productos)", list);

  await vis(page, "button:has-text('Crear orden')").click();
  await page.waitForURL(/\/login/, { waitUntil: "commit" });
  await vis(page, "a:has-text('Regístrate')").click();
  await page.waitForURL(/\/register/, { waitUntil: "commit" });
  await vis(page, "input[name=name]").fill("Cliente Demo Kodigo");
  await vis(page, "input[name=email]").fill(email);
  await vis(page, "input[name=password]").fill("password123");
  await vis(page, "input[name=password_confirmation]").fill("password123");
  await shot(page, "08-registro", "Registro de cliente (Server Action → POST /api/register)", list);
  await vis(page, "button:has-text('Crear cuenta')").click();
  await page.waitForURL(/\/cart/, { waitUntil: "commit", timeout: 20000 });
  await vis(page, "text=Resumen").waitFor();

  const cookies = await context.cookies();
  const tokenCookie = cookies.find((c) => c.name === "auth_token");
  ok(`Cookie auth_token httpOnly=${tokenCookie?.httpOnly}`);

  await vis(page, "button:has-text('Crear orden')").click();
  await page.waitForURL(/\/checkout\/\d+$/, { waitUntil: "commit", timeout: 20000 });
  await vis(page, "h1:has-text('Pagar orden')").waitFor();
  await shot(page, "09-checkout", "Orden creada (Server Action → POST /api/orders) y pantalla de pago", list);

  await payWith(page, "pm_card_chargeDeclined");
  await vis(page, "form [role=alert]").waitFor({ timeout: 30000 });
  await shot(page, "10-pago-rechazado", "Pago rechazado por Stripe: el error se muestra sin salir de la página", list);

  await payWith(page, "pm_card_visa");
  await page.waitForURL(/\/success/, { waitUntil: "commit", timeout: 30000 });
  await vis(page, "text=Gracias por tu compra").waitFor({ timeout: 20000 });
  await shot(page, "11-confirmacion", "Confirmación de compra (POST /api/orders/{id}/pay con Stripe)", list);

  await page.goto(`${APP}/orders`);
  await vis(page, "a[href^='/orders/']").waitFor();
  await shot(page, "12-historial", "Historial de compras protegido (GET /api/orders)", list);

  await vis(page, "a[href^='/orders/']").click();
  await vis(page, "text=Pago Stripe").waitFor();
  await shot(page, "13-detalle-orden", "Detalle de la orden pagada (GET /api/orders/{id})", list);

  // Ruta protegida sin sesión → redirige al login (proxy.ts)
  const guest = await browser.newContext({ viewport: { width: 1366, height: 860 } });
  const gp = await guest.newPage();
  await gp.goto(`${APP}/orders`);
  await gp.waitForURL(/\/login/);
  await shot(gp, "14-ruta-protegida", "Sin sesión, /orders redirige al login (proxy.ts)", list);
  await guest.close();

  await context.close();
}

async function runLighthouse(chromePath, list, summary) {
  log("Lighthouse (puede tardar un par de minutos)");
  const browser = await chromium.launch({ executablePath: chromePath });
  const productsRes = await fetch(`${API}/products`).then((r) => r.json());
  const productId = productsRes?.data?.data?.[0]?.id ?? 1;

  const runs = [
    { name: "catalogo-movil", url: `${APP}/products`, desktop: false, label: "Catálogo (móvil)" },
    { name: "catalogo-escritorio", url: `${APP}/products`, desktop: true, label: "Catálogo (escritorio)" },
    { name: "detalle-producto-movil", url: `${APP}/products/${productId}`, desktop: false, label: "Detalle de producto (móvil)" },
    { name: "carrito-movil", url: `${APP}/cart`, desktop: false, label: "Carrito (móvil)" },
  ];

  for (const run of runs) {
    const chrome = await chromeLauncher.launch({
      chromePath,
      chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
    });
    try {
      const result = await lighthouse(
        run.url,
        { port: chrome.port, output: "html", logLevel: "error" },
        run.desktop ? desktopConfig : undefined,
      );
      const htmlFile = path.join(LH_DIR, `${run.name}.html`);
      fs.writeFileSync(htmlFile, result.report);
      const c = result.lhr.categories;
      const a = result.lhr.audits;
      const row = {
        label: run.label,
        perf: Math.round(c.performance.score * 100),
        a11y: Math.round(c.accessibility.score * 100),
        bp: Math.round(c["best-practices"].score * 100),
        seo: Math.round(c.seo.score * 100),
        lcp: a["largest-contentful-paint"].displayValue,
        cls: a["cumulative-layout-shift"].displayValue,
        tbt: a["total-blocking-time"].displayValue,
      };
      summary.push(row);
      ok(`${run.label}: Rendimiento ${row.perf} · Accesibilidad ${row.a11y} · Buenas prácticas ${row.bp} · SEO ${row.seo}`);

      // Captura de la parte superior del reporte
      const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
      await page.goto(pathToFileURL(htmlFile).href);
      await page.waitForTimeout(3500); // espera la animación de los puntajes
      const file = path.join(SHOTS, `lighthouse-${run.name}.png`);
      await page.screenshot({ path: file });
      list.push({ file, title: `Lighthouse · ${run.label}` });
      await page.close();
    } finally {
      // En Windows a veces falla al borrar la carpeta temporal de Chrome; no es grave.
      try {
        await chrome.kill();
      } catch {
        /* ignorar */
      }
    }
  }
  await browser.close();
}

async function buildPdf(chromePath, list, summary) {
  log("Armando docs/evidencia.pdf");
  const img = (f) => `data:image/png;base64,${fs.readFileSync(f).toString("base64")}`;
  const rows = summary
    .map((r) => `<tr><td>${r.label}</td><td>${r.perf}</td><td>${r.a11y}</td><td>${r.bp}</td><td>${r.seo}</td><td>${r.lcp}</td><td>${r.cls}</td><td>${r.tbt}</td></tr>`)
    .join("");
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
    body{font-family:Segoe UI,system-ui,sans-serif;color:#1d1b18;margin:0}
    h1{font-size:26px;margin:0 0 4px} h2{font-size:15px;margin:0 0 10px}
    .cover{padding:40px} .muted{color:#6b665e;font-size:13px}
    table{border-collapse:collapse;margin-top:16px;font-size:12px;width:100%}
    td,th{border:1px solid #e6e0d6;padding:6px 8px;text-align:left}
    section{page-break-before:always;padding:30px}
    img{max-width:100%;border:1px solid #e6e0d6}
  </style></head><body>
  <div class="cover">
    <h1>Evidencia · Frontend E-commerce en Next.js</h1>
    <p class="muted">Kodigo Shop (Next.js 16 + TypeScript) consumiendo la API Laravel 12 + Swagger + Stripe.<br>
    Generado el ${new Date().toLocaleString("es-SV")} · API: ${API} · Frontend: ${APP} (modo producción)</p>
    <h2 style="margin-top:24px">Contenido</h2>
    <ol class="muted">${list.map((s) => `<li>${s.title}</li>`).join("")}</ol>
    ${summary.length ? `<h2 style="margin-top:24px">Resumen Lighthouse</h2>
    <table><tr><th>Página</th><th>Rendimiento</th><th>Accesibilidad</th><th>Buenas prácticas</th><th>SEO</th><th>LCP</th><th>CLS</th><th>TBT</th></tr>${rows}</table>` : ""}
  </div>
  ${list.map((s, i) => `<section><h2>${i + 1}. ${s.title}</h2><img src="${img(s.file)}"></section>`).join("")}
  </body></html>`;

  const browser = await chromium.launch({ executablePath: chromePath });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.pdf({ path: path.join(ROOT, "docs", "evidencia.pdf"), format: "A4", printBackground: true, margin: { top: "10mm", bottom: "10mm" } });
  await browser.close();
  ok("PDF: docs/evidencia.pdf");
}

/* ---------- Programa principal ---------- */

async function main() {
  fs.mkdirSync(SHOTS, { recursive: true });
  fs.mkdirSync(LH_DIR, { recursive: true });

  log(`Comprobando la API en ${API}`);
  const up = await fetch(`${API}/products`).then((r) => r.ok).catch(() => false);
  if (!up) {
    console.error(`\n✗ La API no responde en ${API}/products.\n  Levántala con "php artisan serve" y vuelve a intentar.\n`);
    process.exit(1);
  }
  ok("API respondiendo");

  const chromePath = browserPath();
  ok(`Navegador: ${chromePath}`);

  if (!skipBuild) {
    log("Compilando el frontend (npm run build)");
    execSync("npm run build", { cwd: ROOT, stdio: "inherit", env: { ...process.env, API_BASE_URL: API } });
  }

  log(`Levantando el frontend en ${APP}`);
  const server = startNext();
  const stop = () => {
    try {
      server.kill();
    } catch {
      /* ya terminó */
    }
  };
  process.on("exit", stop);

  try {
    if (!(await waitFor(`${APP}/products`))) throw new Error(`El frontend no respondió en ${APP}`);
    ok("Frontend listo");

    const list = [];
    const summary = [];
    const browser = await chromium.launch({ executablePath: chromePath });
    await swaggerShots(browser, list);
    await purchaseFlow(browser, list);
    await browser.close();

    await runLighthouse(chromePath, list, summary);
    await buildPdf(chromePath, list, summary);

    console.log("\n\x1b[32m✓ Evidencia lista.\x1b[0m Revisa docs/capturas, docs/lighthouse y docs/evidencia.pdf\n");
  } finally {
    stop();
  }
}

main().catch((e) => {
  console.error(`\n✗ ${e.message}\n`);
  process.exit(1);
});
