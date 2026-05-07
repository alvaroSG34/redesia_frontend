export const AUTH_COOKIE_NAME = "ia_auth_token";

export function getApiBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.API_BASE_URL ??
    "http://localhost:4000/v1";

  return configured.endsWith("/") ? configured.slice(0, -1) : configured;
}

export function readAuthTokenFromDocument(): string | undefined {
  const cookieToken = readAuthTokenFromCookie();
  if (cookieToken) {
    return cookieToken;
  }

  return readAuthTokenFromStorage();
}

export function persistAuthToken(token: string): void {
  if (typeof document !== "undefined") {
    document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; samesite=lax; max-age=${60 * 60 * 24}`;
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_COOKIE_NAME, token);
  }
}

export function clearPersistedAuthToken(): void {
  if (typeof document !== "undefined") {
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; samesite=lax; max-age=0`;
  }

  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_COOKIE_NAME);
  }
}

function readAuthTokenFromCookie(): string | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }

  const chunks = document.cookie.split(";").map((item) => item.trim());
  const match = chunks.find((item) => item.startsWith(`${AUTH_COOKIE_NAME}=`));

  if (!match) {
    return undefined;
  }

  const value = match.slice(`${AUTH_COOKIE_NAME}=`.length);
  return value ? decodeURIComponent(value) : undefined;
}

function readAuthTokenFromStorage(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const value = window.localStorage.getItem(AUTH_COOKIE_NAME);
  return value?.trim() ? value : undefined;
}