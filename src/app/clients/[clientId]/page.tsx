import Link from "next/link";
import { notFound } from "next/navigation";

import { getClientDashboardSummary, getClientSummaryV2 } from "@/services/social-analytics";
import type { ClientDashboardSummary, ClientSummaryV2Response } from "@/types/social";

interface ClientDashboardPageProps {
  params: Promise<{ clientId: string }>;
}

const ALERT_STYLES: Record<string, string> = {
  high: "border-[#fecaca] bg-[#fff5f5]",
  medium: "border-[#fde68a] bg-[#fffbeb]",
  low: "border-[#dbeafe] bg-[#eff6ff]",
};

export default async function ClientDashboardPage({ params }: ClientDashboardPageProps) {
  const { clientId } = await params;
  const summaryV2 = await getClientSummaryV2(clientId);

  if (summaryV2) {
    return <ClientExecutiveView clientId={clientId} data={summaryV2} />;
  }

  const legacy = await getClientDashboardSummary(clientId);
  if (!legacy) {
    notFound();
  }

  const fallback = mapLegacyToV2(legacy, clientId);

  return (
    <ClientExecutiveView
      clientId={clientId}
      data={fallback}
      degradedMessage="Mostrando modo de compatibilidad temporal (summary-v2 no disponible)."
    />
  );
}

function ClientExecutiveView({
  clientId,
  data,
  degradedMessage,
}: {
  clientId: string;
  data: ClientSummaryV2Response;
  degradedMessage?: string;
}) {
  return (
    <section className="mx-auto w-full max-w-[1120px] space-y-6 pb-6">
      <header className="rounded-2xl border border-[#cfdae9] bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-4">
            <span
              className="inline-flex h-16 w-16 items-center justify-center rounded-full text-[26px] font-bold"
              style={{
                backgroundColor: `${data.clientHeader.avatarColor}22`,
                color: data.clientHeader.avatarColor,
              }}
            >
              {data.clientHeader.shortName}
            </span>
            <div>
              <h1 className="text-[36px] font-bold tracking-tight text-[#0f172a]">{data.clientHeader.name}</h1>
              <p className="mt-1 text-[15px] text-[#64748b]">
                {data.clientHeader.industry} · {data.clientHeader.connected ? "Conectado" : "No conectado"}
              </p>
              <p className="text-[13px] text-[#64748b]">
                {data.comparison.periodLabelCurrent} vs {data.comparison.periodLabelPrevious}
              </p>
            </div>
          </div>

          <Link
            href={`/clients/${clientId}/posts`}
            className="inline-flex h-10 items-center rounded-xl bg-[#1d4ed8] px-4 text-[15px] font-semibold text-white hover:bg-[#1e40af]"
          >
            Ver publicaciones
          </Link>
        </div>

        {degradedMessage ? (
          <p className="mt-4 rounded-lg border border-[#f4d7a7] bg-[#fff9ee] px-3 py-2 text-[13px] text-[#92400e]">
            {degradedMessage}
          </p>
        ) : null}

        <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_1fr]">
          <article className="rounded-xl border border-[#d4deec] bg-[#f8fbff] p-4">
            <h2 className="text-[18px] font-semibold text-[#0f172a]">Estado del cliente</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <MiniStat label="Salud" value={healthLabel(data.statusOverview.health)} />
              <MiniStat label="Cobertura IA" value={`${data.statusOverview.coveragePct}%`} />
              <MiniStat label="Negativo" value={`${data.statusOverview.negativePct}%`} />
              <MiniStat label="Pendientes" value={String(data.statusOverview.pendingComments)} />
            </div>
          </article>

          <article className="rounded-xl border border-[#d4deec] bg-white p-4">
            <h2 className="text-[18px] font-semibold text-[#0f172a]">Alertas</h2>
            <div className="mt-3 space-y-2">
              {data.alerts.length ? (
                data.alerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className={`rounded-lg border p-3 ${ALERT_STYLES[alert.severity] ?? ALERT_STYLES.low}`}>
                    <p className="text-[14px] font-semibold text-[#0f172a]">{alert.title}</p>
                    <p className="text-[13px] text-[#64748b]">{alert.description}</p>
                    <Link href={alert.actionHref} className="mt-2 inline-flex text-[13px] font-semibold text-[#1d4ed8] hover:underline">
                      {alert.actionLabel}
                    </Link>
                  </div>
                ))
              ) : (
                <p className="rounded-lg border border-dashed border-[#d2dceb] px-3 py-4 text-[13px] text-[#64748b]">
                  Sin alertas activas para este cliente.
                </p>
              )}
            </div>
          </article>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi) => (
          <article key={kpi.id} className="rounded-2xl border border-[#cfdae9] bg-white px-4 py-4">
            <p className="text-[13px] uppercase tracking-wide text-[#64748b]">{kpi.label}</p>
            <p className="mt-2 text-[34px] font-bold text-[#0f172a]">{kpi.value}</p>
            <p className={`text-[13px] font-semibold ${kpi.deltaPct >= 0 ? "text-[#15803d]" : "text-[#b91c1c]"}`}>
              {kpi.deltaPct >= 0 ? "+" : ""}
              {kpi.deltaPct}%
            </p>
            <p className="text-[12px] text-[#64748b]">{kpi.context}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <article className="rounded-2xl border border-[#cfdae9] bg-white p-5">
          <h2 className="text-[24px] font-semibold text-[#0f172a]">Lectura de sentimiento</h2>
          <p className="mt-1 text-[14px] text-[#64748b]">Variacion porcentual de cobertura y negativo en el periodo.</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <SignalCard
              label="Cobertura"
              value={`${data.statusOverview.coveragePct}%`}
              tone={data.statusOverview.coveragePct < 70 ? "warn" : "good"}
            />
            <SignalCard
              label="Negativo"
              value={`${data.statusOverview.negativePct}%`}
              tone={data.statusOverview.negativePct >= 30 ? "warn" : "neutral"}
            />
          </div>
        </article>

        <article className="rounded-2xl border border-[#cfdae9] bg-white p-5">
          <h2 className="text-[24px] font-semibold text-[#0f172a]">Top emociones</h2>
          <ul className="mt-4 space-y-2">
            {data.emotionTop.length ? (
              data.emotionTop.slice(0, 6).map((item) => (
                <li key={item.emotion} className="flex items-center justify-between rounded-lg border border-[#e2e8f0] px-3 py-2">
                  <span className="text-[14px] text-[#334155]">{item.emotion}</span>
                  <span className="text-[14px] font-semibold text-[#0f172a]">{item.percentage}%</span>
                </li>
              ))
            ) : (
              <li className="rounded-lg border border-dashed border-[#d2dceb] px-3 py-4 text-[13px] text-[#64748b]">
                Sin emociones registradas en el periodo.
              </li>
            )}
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border border-[#cfdae9] bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[24px] font-semibold text-[#0f172a]">Actividad reciente</h2>
          <Link href={`/clients/${clientId}/posts`} className="text-[14px] font-semibold text-[#1d4ed8] hover:underline">
            Ver todas
          </Link>
        </div>

        {data.recentPosts.length ? (
          <div className="mt-4 space-y-2">
            {data.recentPosts.map((post) => (
              <article key={post.id} className="grid gap-3 rounded-lg border border-[#e8edf5] px-4 py-3 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-center">
                <p className="truncate text-[14px] font-medium text-[#1f2937]">{post.caption}</p>
                <span className="text-[13px] text-[#64748b]">{post.likes}</span>
                <span className="text-[13px] text-[#64748b]">{post.commentsCount}</span>
                <span className="text-[12px] text-[#64748b]">{post.publishedAt}</span>
                <Link href={`/clients/${clientId}/posts/${post.id}`} className="text-[13px] font-semibold text-[#1d4ed8] hover:underline">
                  Ver detalle
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-lg border border-dashed border-[#d2dceb] px-4 py-6 text-center text-[13px] text-[#64748b]">
            No hay publicaciones para mostrar en el periodo actual.
          </p>
        )}
      </section>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#dbe6f3] bg-white px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-[#64748b]">{label}</p>
      <p className="text-[18px] font-semibold text-[#0f172a]">{value}</p>
    </div>
  );
}

function SignalCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "neutral" | "warn";
}) {
  const cls = tone === "good" ? "text-[#15803d]" : tone === "warn" ? "text-[#b45309]" : "text-[#0f172a]";

  return (
    <div className="rounded-xl border border-[#dbe6f3] bg-[#f8fbff] px-4 py-4">
      <p className="text-[12px] uppercase tracking-wide text-[#64748b]">{label}</p>
      <p className={`mt-1 text-[30px] font-bold ${cls}`}>{value}</p>
    </div>
  );
}

function healthLabel(health: "good" | "warning" | "critical"): string {
  if (health === "good") return "Estable";
  if (health === "warning") return "Atenci\u00f3n";
  return "Cr\u00edtico";
}

function mapLegacyToV2(
  legacy: ClientDashboardSummary,
  clientId: string,
): ClientSummaryV2Response {
  const kpiMap = Object.fromEntries(legacy.kpis.map((item) => [item.id, item]));
  const sentimentPositive = parsePct(kpiMap.sentiment?.value ?? "0%");

  return {
    clientHeader: {
      id: legacy.client.id,
      name: legacy.client.name,
      shortName: legacy.client.shortName,
      industry: legacy.client.industry,
      connected: legacy.client.connected,
      status: legacy.client.status,
      avatarColor: legacy.client.avatarColor,
    },
    statusOverview: {
      health: legacy.client.connected ? "warning" : "critical",
      coveragePct: 0,
      negativePct: Math.max(0, 100 - sentimentPositive),
      pendingComments: 0,
      lastSyncAt: null,
      connectedAccounts: legacy.client.connected ? 1 : 0,
    },
    alerts: [
      {
        id: "legacy-fallback",
        severity: "medium",
        title: "Datos parciales",
        description: "No se pudo cargar summary-v2. Se muestra el resumen legacy.",
        actionLabel: "Ver cuentas",
        actionHref: `/clients/${clientId}/accounts`,
        ruleId: "LOW_ANALYSIS_COVERAGE",
      },
    ],
    kpis: legacy.kpis.slice(0, 4).map((kpi) => ({
      id: kpi.id,
      label: kpi.label,
      value: kpi.value,
      deltaPct: 0,
      context: kpi.context,
    })),
    comparison: {
      periodLabelCurrent: "Periodo actual",
      periodLabelPrevious: "Periodo previo",
    },
    emotionTop: legacy.emotionDistribution,
    recentPosts: legacy.topPosts,
  };
}

function parsePct(value: string): number {
  const normalized = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(normalized) ? normalized : 0;
}
