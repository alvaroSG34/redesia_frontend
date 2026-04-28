import { NextResponse } from 'next/server';

import { AUTH_COOKIE_NAME, getApiBaseUrl } from '@/lib/auth';

interface LoginPayload {
  email?: string;
  password?: string;
}

export async function POST(request: Request) {
  let payload: LoginPayload;

  try {
    payload = (await request.json()) as LoginPayload;
  } catch {
    return NextResponse.json({ message: 'Payload invalido' }, { status: 400 });
  }

  const email = payload.email?.trim();
  const password = payload.password?.trim();

  if (!email || !password) {
    return NextResponse.json(
      { message: 'Completa correo y contraseña para continuar.' },
      { status: 400 },
    );
  }

  const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const message = await readBackendError(response);
    return NextResponse.json(
      { message: message || 'Credenciales inválidas' },
      { status: response.status },
    );
  }

  const data = (await response.json()) as {
    accessToken: string;
    user: {
      id: string;
      email: string;
      fullName: string;
      role: string;
    };
  };

  const result = NextResponse.json({ user: data.user });
  result.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: data.accessToken,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
    maxAge: 60 * 60 * 24,
  });

  return result;
}

async function readBackendError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) {
      return body.message.join(', ');
    }

    return body.message ?? '';
  } catch {
    return '';
  }
}

