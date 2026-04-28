"use server";

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AUTH_COOKIE_NAME } from '@/lib/auth';
import {
  createInstagramOauthUrl,
  disconnectAccount,
  syncAccount,
} from '@/services/social-analytics';

export async function connectInstagramAction(clientId: string): Promise<{ error: string } | never> {
  let oauthUrl: string;
  const accessToken = (await cookies()).get(AUTH_COOKIE_NAME)?.value;

  try {
    const result = await createInstagramOauthUrl(clientId, undefined, {
      accessToken,
    });
    oauthUrl = result.url;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al generar URL de autorización';
    return { error: message };
  }

  // Redirige al usuario a Facebook OAuth
  redirect(oauthUrl);
}

export async function syncAccountAction(
  clientId: string,
  accountId: string,
): Promise<{ ok: boolean; error?: string }> {
  const accessToken = (await cookies()).get(AUTH_COOKIE_NAME)?.value;

  try {
    await syncAccount(clientId, accountId, { accessToken });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al sincronizar cuenta';
    return { ok: false, error: message };
  }
}

export async function disconnectAccountAction(
  clientId: string,
  accountId: string,
): Promise<{ ok: boolean; error?: string }> {
  const accessToken = (await cookies()).get(AUTH_COOKIE_NAME)?.value;

  try {
    await disconnectAccount(clientId, accountId, { accessToken });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al desconectar cuenta';
    return { ok: false, error: message };
  }
}

