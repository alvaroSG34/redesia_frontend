export const AUTH_COOKIE_NAME = 'ia_auth_token';

export function getApiBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.API_BASE_URL ??
    'http://localhost:4000/v1';

  return configured.endsWith('/') ? configured.slice(0, -1) : configured;
}

export function readAuthTokenFromDocument(): string | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const chunks = document.cookie.split(';').map((item) => item.trim());
  const match = chunks.find((item) => item.startsWith(`${AUTH_COOKIE_NAME}=`));

  if (!match) {
    return undefined;
  }

  const value = match.slice(`${AUTH_COOKIE_NAME}=`.length);
  return value ? decodeURIComponent(value) : undefined;
}

