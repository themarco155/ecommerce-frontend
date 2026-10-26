"use client";

import { useReportWebVitals } from "next/web-vitals";

type Metric = Parameters<Parameters<typeof useReportWebVitals>[0]>[0];

// Función estable (fuera del componente) para que no se registre dos veces.
function report(metric: Metric) {
  const value = metric.name === "CLS" ? metric.value.toFixed(3) : `${Math.round(metric.value)} ms`;
  console.log(`[Web Vitals] ${metric.name}: ${value} (${metric.rating})`);
}

/**
 * Reporta las métricas Web Vitals (LCP, CLS, INP, FCP, TTFB) en la consola del navegador.
 * Ábrela con F12 → Console para verlas mientras navegas.
 */
export function WebVitals() {
  useReportWebVitals(report);
  return null;
}
