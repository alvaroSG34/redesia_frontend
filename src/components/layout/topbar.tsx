"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { clearPersistedAuthToken } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (pathname.startsWith("/clients")) {
    return null;
  }

  const onLogout = async () => {
    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      clearPersistedAuthToken();
    } finally {
      router.push(ROUTES.login);
      router.refresh();
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-sm">
          <label className="sr-only" htmlFor="top-search">
            Buscar cliente o reporte
          </label>
          <input
            id="top-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar cliente o reporte..."
            className="h-10 w-full rounded-xl border border-slate-200 px-4 text-base text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <span className="inline-flex h-8 w-8 rounded-full bg-slate-300" aria-hidden />
          <span className="text-xl font-semibold text-slate-600">Admin</span>
          <button
            type="button"
            onClick={onLogout}
            disabled={isLoggingOut}
            className="inline-flex h-10 items-center rounded-xl border border-slate-300 px-4 text-base font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-70"
          >
            {isLoggingOut ? "Saliendo..." : "Salir"}
          </button>
        </div>
      </div>
    </header>
  );
}
