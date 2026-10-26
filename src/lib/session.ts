import "server-only";
import { cookies } from "next/headers";

export const TOKEN_COOKIE = "auth_token";
export const USER_COOKIE = "auth_user";

const base = {
  httpOnly: true, // JavaScript del navegador NO puede leerla (protege contra XSS)
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function saveSession(token: string, expiresIn: number, name: string) {
  const store = await cookies();
  store.set(TOKEN_COOKIE, token, { ...base, maxAge: expiresIn });
  store.set(USER_COOKIE, name, { ...base, maxAge: expiresIn });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(TOKEN_COOKIE);
  store.delete(USER_COOKIE);
}

export async function getToken() {
  return (await cookies()).get(TOKEN_COOKIE)?.value;
}

export async function getUserName() {
  return (await cookies()).get(USER_COOKIE)?.value;
}
