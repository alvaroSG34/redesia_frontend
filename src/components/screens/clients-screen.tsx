"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ROUTES, clientRoute } from "@/lib/routes";
import { deleteClient } from "@/services/social-analytics";
import { type Client } from "@/types/social";

type ClientFilter = "Todos" | "Activos" | "Pendientes";

interface ClientsScreenProps {
  initialClients: Client[];
}

interface ClientRow {
  id: string;
  initials: string;
  name: string;
  category: string;
  accountLabel: string;
  publicaciones: string;
  comentarios: string;
  status: Client["status"];
  primaryAction: string;
  actionHref: string;
  avatarClass: string;
}

const FILTERS: ClientFilter[] = ["Todos", "Activos", "Pendientes"];

const FILTER_TO_STATUS: Record<ClientFilter, Client["status"] | null> = {
  Todos: null,
  Activos: "Activo",
  Pendientes: "Pendiente",
};

export function ClientsScreen({ initialClients }: ClientsScreenProps) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [filter, setFilter] = useState<ClientFilter>("Todos");
  const [query, setQuery] = useState("");
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  const rows = useMemo<ClientRow[]>(() => {
    const baseRows: ClientRow[] = clients.map((client) => ({
      id: client.id,
      initials: resolveInitials(client),
      name: client.name,
      category: client.industry,
      accountLabel: client.connected ? "Cuenta conectada" : "Cuenta no conectada",
      publicaciones: formatCompactNumber(client.postCount ?? 0),
      comentarios: formatCompactNumber(client.commentCount ?? 0),
      status: client.status,
      primaryAction: "Ver cliente",
      actionHref: clientRoute(client.id),
      avatarClass: client.connected ? "bg-[#c6d8ef] text-[#1d4ed8]" : "bg-[#e2e8f0] text-[#475569]",
    }));

    const expectedStatus = FILTER_TO_STATUS[filter];
    const lowerQuery = query.trim().toLowerCase();

    return baseRows.filter((row) => {
      const matchesFilter = !expectedStatus || row.status === expectedStatus;
      const matchesQuery =
        !lowerQuery ||
        row.name.toLowerCase().includes(lowerQuery) ||
        row.category.toLowerCase().includes(lowerQuery) ||
        row.accountLabel.toLowerCase().includes(lowerQuery);

      return matchesFilter && matchesQuery;
    });
  }, [clients, filter, query]);

  async function handleDeleteClient(clientId: string, clientName: string) {
    const accepted = window.confirm(
      `¿Seguro que deseas eliminar al cliente \"${clientName}\"? Esta acción no se puede deshacer.`,
    );
    if (!accepted) {
      return;
    }

    setDeletingClientId(clientId);
    try {
      await deleteClient(clientId);
      setClients((prev) => prev.filter((client) => client.id !== clientId));
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo eliminar el cliente.";
      window.alert(`Error al eliminar cliente: ${message}`);
    } finally {
      setDeletingClientId(null);
    }
  }

  return (
    <section className="mx-auto w-full max-w-[1120px] space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[48px] font-bold leading-tight tracking-tight text-[#182033]">Clientes</h1>
          <p className="mt-1 text-[16px] text-[#60718f]">Gestiona las marcas, empresas o cuentas que seran analizadas</p>
        </div>
        <Link
          href={ROUTES.newClient}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#2563eb] px-4 text-[16px] font-semibold text-white shadow-[0_10px_14px_-12px_rgba(37,99,235,0.95)] transition hover:bg-[#1d4ed8]"
        >
          <span aria-hidden>+</span>
          Agregar cliente
        </Link>
      </header>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-3">
          {FILTERS.map((item) => {
            const active = item === filter;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`rounded-full border px-4 py-1.5 text-[18px] font-medium transition ${
                  active
                    ? "border-[#e5ebf4] bg-[#e9edf4] text-[#111827]"
                    : "border-[#d6deea] bg-white text-[#64748b] hover:bg-[#f8fafc]"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>

        <label className="relative block w-full max-w-sm">
          <span className="sr-only">Buscar cliente</span>
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa8bd]">
            <SearchIcon />
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar cliente..."
            className="h-10 w-full rounded-xl border border-[#c7d2e4] bg-transparent pl-10 pr-4 text-[16px] text-[#334155] outline-none transition placeholder:text-[#9aa8bd] focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/20"
          />
        </label>
      </div>

      <div className="space-y-4">
        {rows.map((row) => (
          <article
            key={row.id}
            className="grid grid-cols-1 gap-4 rounded-2xl border border-[#d1dae7] bg-white p-5 lg:grid-cols-[2.4fr_0.8fr_0.8fr_auto_auto]"
          >
            <div className="flex min-w-0 items-center gap-4">
              <span className={`inline-flex h-14 w-14 items-center justify-center rounded-full text-[34px] font-bold ${row.avatarClass}`}>
                {row.initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[28px] font-bold leading-tight text-[#1e293b]">{row.name}</p>
                <p className="mt-1 text-[17px] text-[#7a8da9]">
                  {row.category} <span className="mx-1">•</span> {row.accountLabel}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[14px] font-semibold text-[#8fa1bc]">Publicaciones</p>
              <p className="mt-1 text-[40px] font-bold text-[#1f2937]">{row.publicaciones}</p>
            </div>

            <div>
              <p className="text-[14px] font-semibold text-[#8fa1bc]">Comentarios</p>
              <p className="mt-1 text-[40px] font-bold text-[#1f2937]">{row.comentarios}</p>
            </div>

            <div className="flex items-center gap-2 lg:justify-end">
              {row.status !== "Sin cuenta" ? (
                <span
                  className={`rounded-full px-3 py-1 text-[14px] font-semibold ${
                    row.status === "Activo"
                      ? "bg-[#cfe6f6] text-[#0369a1]"
                      : "bg-[#fef3c7] text-[#b45309]"
                  }`}
                >
                  {row.status}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-2 lg:justify-end">
              <button
                type="button"
                onClick={() => handleDeleteClient(row.id, row.name)}
                disabled={deletingClientId === row.id}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-[#f3b3bd] px-4 text-[14px] font-semibold text-[#b91c1c] transition hover:bg-[#fff1f2] disabled:opacity-60"
              >
                {deletingClientId === row.id ? "Eliminando..." : "Eliminar"}
              </button>
              <Link
                href={row.actionHref}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-[#c6d2e3] px-4 text-[14px] font-semibold text-[#334155] transition hover:bg-[#f8fafc]"
              >
                {row.primaryAction}
              </Link>
            </div>
          </article>
        ))}

        {!rows.length ? (
          <p className="rounded-2xl border border-dashed border-[#cad5e6] bg-white p-8 text-center text-[16px] text-[#64748b]">
            No encontramos clientes con ese filtro.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function resolveInitials(client: Client): string {
  if (client.shortName.trim()) {
    return client.shortName.trim().slice(0, 3).toUpperCase();
  }

  const chunks = client.name.trim().split(/\s+/).filter(Boolean);
  const initials = chunks.slice(0, 2).map((chunk) => chunk[0] ?? "").join("");
  return initials.toUpperCase() || "NA";
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
