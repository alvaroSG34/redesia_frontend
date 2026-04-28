"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { AUTH_COOKIE_NAME, getApiBaseUrl } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export function LoginForm() {
  const router = useRouter();
  const apiBaseUrl = getApiBaseUrl();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Completa correo y contraseña para continuar.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        const message = await readErrorMessage(response);
        setError(message || "No se pudo iniciar sesión.");
        return;
      }

      const data = (await response.json()) as { accessToken?: string };
      if (data.accessToken) {
        document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(data.accessToken)}; path=/; samesite=lax; max-age=${60 * 60 * 24}`;
      }

      setError("");
      router.push(ROUTES.dashboard);
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-lg font-medium text-slate-700" htmlFor="email">
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@email.com"
          className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-lg text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#7d5df5] focus:ring-2 focus:ring-[#7d5df5]/20"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <label className="text-lg font-medium text-slate-700" htmlFor="password">
            Contraseña
          </label>
          <a href="#" className="text-base font-semibold text-[#7359ff] hover:underline">
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-lg text-slate-700 outline-none transition placeholder:text-slate-500 focus:border-[#7d5df5] focus:ring-2 focus:ring-[#7d5df5]/20"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <EyeIcon />
          </button>
        </div>
      </div>

      <label className="inline-flex cursor-pointer items-center gap-2 text-base text-slate-600">
        <input
          type="checkbox"
          checked={remember}
          onChange={(event) => setRemember(event.target.checked)}
          className="h-5 w-5 rounded border-slate-300 text-[#7359ff] focus:ring-[#7359ff]"
        />
        Recordar sesión
      </label>

      {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-12 w-full rounded-xl bg-gradient-to-r from-[#eb3f99] to-[#7f58f2] text-xl font-bold text-white shadow-[0_12px_20px_-14px_rgba(127,88,242,0.8)] transition hover:brightness-105"
      >
        {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
      </button>

      <p className="pt-3 text-center text-lg text-slate-500">
        ¿No tienes una cuenta? <a href="#" className="font-semibold text-[#7359ff]">Regístrate</a>
      </p>
    </form>
  );
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) {
      return body.message.join(", ");
    }
    return body.message ?? "";
  } catch {
    return "";
  }
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path
        d="M1.5 12C3.6 7.8 7.2 5.7 12 5.7C16.8 5.7 20.4 7.8 22.5 12C20.4 16.2 16.8 18.3 12 18.3C7.2 18.3 3.6 16.2 1.5 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="3.1" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
