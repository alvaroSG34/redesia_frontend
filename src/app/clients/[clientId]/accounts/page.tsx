import { notFound } from "next/navigation";

import {
  getAccounts,
  getAccountsSummaryV2,
  getClientDashboardSummary,
} from "@/services/social-analytics";
import type {
  ClientAccountsSummaryV2Response,
  ClientDashboardSummary,
  SocialAccount,
} from "@/types/social";
import {
  ConnectInstagramButton,
  DisconnectAccountButton,
  SyncAccountButton,
} from "./account-buttons";

interface ClientAccountsPageProps {
  params: Promise<{ clientId: string }>;
}

export default async function ClientAccountsPage({ params }: ClientAccountsPageProps) {
  const { clientId } = await params;

  const summaryV2 = await getAccountsSummaryV2(clientId);
  if (summaryV2) {
    return <AccountsOperationalView clientId={clientId} data={summaryV2} />;
  }

  const [summary, accounts] = await Promise.all([
    getClientDashboardSummary(clientId),
    getAccounts(clientId),
  ]);

  if (!summary) {
    notFound();
  }

  const fallback = mapLegacyToV2(clientId, summary, accounts);

  return (
    <AccountsOperationalView
      clientId={clientId}
      data={fallback}
      degradedMessage="Mostrando modo de compatibilidad (summary-v2 no disponible)."
    />
  );
}

function AccountsOperationalView({
  clientId,
  data,
  degradedMessage,
}: {
  clientId: string;
  data: ClientAccountsSummaryV2Response;
  degradedMessage?: string;
}) {
  const primaryAccount = data.primaryAccount;

  return (
    <section className="mx-auto w-full max-w-[1120px] space-y-6 pb-6">
      <header className="rounded-2xl border border-[#cfdae9] bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-[38px] font-bold tracking-tight text-[#182033]">Cuentas conectadas</h1>
            <p className="mt-1 text-[16px] text-[#60718f]">Operaci\u00f3n diaria de integraciones para {data.header.clientName}</p>
            <p className="text-[13px] text-[#64748b]">
              Estado: <span className={healthClass(data.header.health)}>{healthLabel(data.header.health)}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <ConnectInstagramButton
              clientId={clientId}
              canConnect={data.actions.canConnect}
              canReconnect={data.actions.canReconnect}
            />
            {primaryAccount ? (
              <SyncAccountButton
                clientId={clientId}
                accountId={primaryAccount.id}
                canSync={data.actions.canSync}
              />
            ) : null}
            {primaryAccount ? (
              <DisconnectAccountButton
                clientId={clientId}
                accountId={primaryAccount.id}
                canDisconnect={data.actions.canDisconnect}
              />
            ) : null}
          </div>
        </div>

        {degradedMessage ? (
          <p className="mt-4 rounded-lg border border-[#f4d7a7] bg-[#fff9ee] px-3 py-2 text-[13px] text-[#92400e]">
            {degradedMessage}
          </p>
        ) : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Conectadas" value={String(data.header.connectedAccounts)} />
          <StatCard label="Total cuentas" value={String(data.header.totalAccounts)} />
          <StatCard label="Puede sync" value={data.actions.canSync ? "S\u00ed" : "No"} />
          <StatCard label="Puede desconectar" value={data.actions.canDisconnect ? "S\u00ed" : "No"} />
          <StatCard
            label="\u00daltima sincronizaci\u00f3n"
            value={data.header.lastSyncAt ? formatDateTime(data.header.lastSyncAt) : "-"}
          />
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <article className="rounded-2xl border border-[#d1dae7] bg-white p-5">
          <h2 className="text-[24px] font-semibold text-[#1f2937]">Cuentas del cliente</h2>
          <div className="mt-4 space-y-3">
            {data.accounts.length ? (
              data.accounts.map((account) => (
                <div
                  key={account.id}
                  className={`rounded-xl border px-4 py-3 ${
                    data.primaryAccount?.id === account.id ? "border-[#93c5fd] bg-[#eff6ff]" : "border-[#e2e8f0]"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[16px] font-semibold text-[#1f2937]">{account.platform}</p>
                      <p className="text-[14px] text-[#64748b]">{account.handle}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${statusClass(account.status)}`}>
                      {account.status}
                    </span>
                  </div>
                  <p className="mt-2 text-[12px] text-[#64748b]">
                    \u00daltima sincronizaci\u00f3n: {account.lastSyncAt ? formatDateTime(account.lastSyncAt) : "sin sincronizaci\u00f3n"}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-[#d1dae7] px-4 py-5 text-[14px] text-[#64748b]">
                No hay cuentas registradas a\u00fan.
              </p>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-[#d1dae7] bg-white p-5">
          <h2 className="text-[24px] font-semibold text-[#1f2937]">Permisos activos</h2>
          {primaryAccount && primaryAccount.scopes.length ? (
            <ul className="mt-4 space-y-2">
              {primaryAccount.scopes.map((scope) => (
                <li key={scope} className="flex items-center gap-2 text-[14px] text-[#334155]">
                  <span className="text-[#10b981]">*</span>
                  {scope}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-[14px] text-[#64748b]">No hay scopes disponibles para la cuenta principal.</p>
          )}
        </article>
      </div>

      <article className="rounded-2xl border border-[#d1dae7] bg-white p-5">
        <h2 className="text-[24px] font-semibold text-[#1f2937]">Historial de sincronizaci\u00f3n</h2>
        {data.syncHistory.length ? (
          <div className="mt-4 space-y-2">
            {data.syncHistory.map((run) => (
              <div key={run.id} className="rounded-xl border border-[#e2e8f0] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[14px] font-semibold text-[#1f2937]">
                    {run.trigger === "manual" ? "Manual" : "Cron"} · {run.status}
                  </p>
                  <p className="text-[12px] text-[#64748b]">{formatDateTime(run.startedAt)}</p>
                </div>
                <p className="text-[13px] text-[#475569]">
                  Posts: {run.postsSynced} · Comentarios: {run.commentsSynced} · Analizados: {run.analyzedCount}
                </p>
                {run.error ? <p className="text-[12px] text-[#b91c1c]">Error: {run.error}</p> : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-[#d1dae7] px-4 py-5 text-[14px] text-[#64748b]">
            Sin ejecuciones de sincronizaci\u00f3n registradas.
          </p>
        )}
      </article>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-[#d1dae7] bg-[#f8fbff] px-4 py-3">
      <p className="text-[12px] uppercase tracking-wide text-[#64748b]">{label}</p>
      <p className="mt-1 text-[24px] font-bold text-[#182033]">{value}</p>
    </article>
  );
}

function healthClass(health: "good" | "warning" | "critical"): string {
  if (health === "good") return "text-[#15803d]";
  if (health === "warning") return "text-[#b45309]";
  return "text-[#b91c1c]";
}

function healthLabel(health: "good" | "warning" | "critical"): string {
  if (health === "good") return "Operativo";
  if (health === "warning") return "Atenci\u00f3n";
  return "Cr\u00edtico";
}

function statusClass(status: "Conectado" | "Pendiente" | "Desconectado"): string {
  if (status === "Conectado") return "bg-[#cceee2] text-[#0f766e]";
  if (status === "Desconectado") return "bg-[#fee2e2] text-[#b91c1c]";
  return "bg-[#fde7b1] text-[#b45309]";
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function mapLegacyToV2(
  clientId: string,
  summary: ClientDashboardSummary,
  accounts: SocialAccount[],
): ClientAccountsSummaryV2Response {
  const primary = accounts[0] ?? null;
  const connectedAccounts = accounts.filter((item) => item.status === "Conectado").length;

  return {
    header: {
      clientId,
      clientName: summary.client.name,
      connectedAccounts,
      totalAccounts: accounts.length,
      health: connectedAccounts ? "warning" : "critical",
      lastSyncAt: null,
    },
    primaryAccount: primary
      ? {
          id: primary.id,
          platform: primary.platform,
          handle: primary.handle,
          status: primary.status,
          lastSyncAt: null,
          scopes: primary.scopes,
        }
      : null,
    accounts: accounts.map((account) => ({
      id: account.id,
      platform: account.platform,
      handle: account.handle,
      status: account.status,
      lastSyncAt: null,
      scopes: account.scopes,
    })),
    actions: {
      canConnect: connectedAccounts === 0,
      canReconnect: accounts.length > 0,
      canSync: primary?.status === "Conectado" ? true : false,
      canDisconnect: primary?.status === "Conectado" ? true : false,
    },
    syncHistory: [],
  };
}
