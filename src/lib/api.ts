import "server-only";

/** Error de la API con el código HTTP y los errores de validación (si hay). */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function baseUrl() {
  const url = process.env.API_BASE_URL;
  if (!url) throw new Error("Falta la variable API_BASE_URL en .env.local");
  return url.replace(/\/$/, "");
}

type Options = Omit<RequestInit, "body"> & { token?: string; body?: unknown };

/**
 * Cliente único para hablar con la API Laravel. Solo corre en el servidor,
 * así el token JWT nunca llega al navegador.
 */
export async function api<T>(path: string, { token, body, headers, ...init }: Options = {}) {
  let res: Response;
  try {
    res = await fetch(`${baseUrl()}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("No se pudo conectar con la API. ¿Está corriendo el servidor Laravel?", 503);
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      json?.error ?? json?.message ?? `Error ${res.status} de la API`,
      res.status,
      json?.errors,
    );
  }
  return json as { success: boolean; message?: string; data: T };
}
