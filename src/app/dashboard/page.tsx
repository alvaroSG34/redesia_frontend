import Link from "next/link";

import { DashboardSentimentTrend } from "@/components/business/dashboard-sentiment-trend";
import { getDashboardStats, getDashboardV2 } from "@/services/social-analytics";
import type {
  DashboardRange,
  DashboardV2ClientHealth,
  DashboardV2Response,
} from "@/types/social";

const RANGE: DashboardRange = "30d";

export default async function DashboardPage() {
  const model = await buildDashboardModel();

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#cfdae9] bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-[34px] font-bold tracking-tight text-[#0f172a]">Prioridad hoy</h1>
            <p className="mt-1 text-[16px] text-[#5b6c86]">
              Tareas y alertas para decidir en menos de 30 segundos.
            </p>
            {model.degradedMessage ? (
              <p className="mt-3 rounded-lg border border-[#f4d7a7] bg-[#fff9ee] px-3 py-2 text-[14px] text-[#92400e]">
                {model.degradedMessage}
              </p>
            ) : null}
          </div>
          <Link
            href="/clients"
            className="inline-flex h-10 items-center rounded-xl border border-[#bfd0e8] bg-white px-4 text-[15px] font-semibold text-[#1e3a8a] hover:bg-[#f4f8ff]"
          >
            Ver clientes
          </Link>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.45fr_1fr]">
          <div className="space-y-3">
            {model.data.alerts.length ? (
              model.data.alerts.map((alert) => (
                <article
                  key={alert.id}
                  className={`rounded-xl border px-4 py-3 ${alertBorder(alert.severity)}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[17px] font-semibold text-[#0f172a]">{alert.title}</p>
                      <p className="text-[14px] text-[#5b6c86]">{alert.description}</p>
                    </div>
                    <Link
                      href={alert.actionHref}
                      className="inline-flex h-9 items-center rounded-lg bg-[#1d4ed8] px-3 text-[14px] font-semibold text-white hover:bg-[#1e40af]"
                    >
                      {alert.actionLabel}
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <article className="rounded-xl border border-dashed border-[#c7d4e9] bg-[#f8fbff] px-4 py-6 text-[15px] text-[#5b6c86]">
                Sin alertas críticas por ahora. Mantén monitoreo de clientes activos.
              </article>
            )}
          </div>

          <div className="rounded-xl border border-[#d3ddeb] bg-[#f8fbff] p-4">
            <h2 className="text-[18px] font-semibold text-[#0f172a]">Plan de acción</h2>
            <div className="mt-3 space-y-2">
              {model.data.todayActions.map((action) => (
                <Link
                  key={action.id}
                  href={action.href}
                  className="block rounded-lg border border-[#c8d5ea] bg-white px-3 py-2 hover:bg-[#f4f8ff]"
                >
                  <p className="text-[14px] font-semibold text-[#0f172a]">
                    {action.priority}. {action.title}
                  </p>
                  <p className="text-[13px] text-[#64748b]">{action.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <KpiCard label="Clientes" value={model.data.overview.clientsTotal} />
        <KpiCard label="Cuentas conectadas" value={model.data.overview.connectedAccounts} />
        <KpiCard label="Publicaciones" value={model.data.overview.postsTotal} />
        <KpiCard label="Comentarios" value={model.data.overview.commentsTotal} />
        <KpiCard label="Analizados" value={model.data.overview.analyzedTotal} />
        <KpiCard
          label="Cobertura IA"
          value={`${model.data.overview.analysisCoveragePct}%`}
          tone={
            model.data.overview.analysisCoveragePct < 70
              ? "warn"
              : model.data.overview.analysisCoveragePct < 85
                ? "neutral"
                : "good"
          }
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <article className="rounded-2xl border border-[#cfdae9] bg-white p-5">
          <h2 className="text-[24px] font-semibold text-[#0f172a]">Tendencia de sentimiento (30 días)</h2>
          <p className="mt-1 text-[14px] text-[#64748b]">Distribución semanal de comentarios analizados.</p>
          <div className="mt-4">
            <DashboardSentimentTrend data={model.data.sentimentTrend} />
          </div>
        </article>

        <article className="rounded-2xl border border-[#cfdae9] bg-white p-5">
          <h2 className="text-[24px] font-semibold text-[#0f172a]">Top emociones</h2>
          <ul className="mt-4 space-y-2">
            {model.data.emotionTop.length ? (
              model.data.emotionTop.map((item) => (
                <li key={item.emotion} className="flex items-center justify-between rounded-lg border border-[#e2e8f0] px-3 py-2">
                  <span className="text-[15px] text-[#334155]">{item.emotion}</span>
                  <span className="text-[15px] font-semibold text-[#0f172a]">{item.percentage}%</span>
                </li>
              ))
            ) : (
              <li className="rounded-lg border border-dashed border-[#d3ddeb] px-3 py-4 text-[14px] text-[#64748b]">
                Aún no hay emociones suficientes para mostrar ranking.
              </li>
            )}
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border border-[#cfdae9] bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[24px] font-semibold text-[#0f172a]">Salud por cliente</h2>
          <Link href="/clients" className="text-[14px] font-semibold text-[#1d4ed8] hover:underline">
            Ver todos
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-[#e2e8f0] text-[13px] uppercase tracking-wide text-[#64748b]">
                <th className="pb-3 pr-4">Cliente</th>
                <th className="pb-3 pr-4">Estado</th>
                <th className="pb-3 pr-4">Pendientes</th>
                <th className="pb-3 pr-4">Negativo</th>
                <th className="pb-3 pr-4">Riesgo</th>
                <th className="pb-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {model.data.clientsHealth.slice(0, 6).map((client) => (
                <tr key={client.clientId} className="border-b border-[#eff3f8] text-[15px] text-[#334155]">
                  <td className="py-3 pr-4 font-semibold text-[#0f172a]">{client.name}</td>
                  <td className="py-3 pr-4">{client.connected ? "Conectada" : "Sin conectar"}</td>
                  <td className="py-3 pr-4">{client.pendingComments}</td>
                  <td className="py-3 pr-4">{client.negativeRatePct}%</td>
                  <td className="py-3 pr-4">
                    <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${riskClass(client.riskLevel)}`}>
                      {labelRisk(client.riskLevel)}
                    </span>
                  </td>
                  <td className="py-3">
                    <Link
                      href={`/clients/${client.clientId}/accounts`}
                      className="inline-flex h-8 items-center rounded-lg bg-[#1d4ed8] px-3 text-[13px] font-semibold text-white hover:bg-[#1e40af]"
                    >
                      Ir a cuenta
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "good" | "neutral" | "warn";
}) {
  return (
    <article className="rounded-2xl border border-[#cfdae9] bg-white px-4 py-4">
      <p className="text-[13px] uppercase tracking-wide text-[#64748b]">{label}</p>
      <p className={`mt-2 text-[33px] font-bold ${toneClass(tone)}`}>{value}</p>
    </article>
  );
}

function toneClass(tone: "good" | "neutral" | "warn"): string {
  if (tone === "good") return "text-[#0f766e]";
  if (tone === "warn") return "text-[#b45309]";
  return "text-[#0f172a]";
}

function riskClass(level: DashboardV2ClientHealth["riskLevel"]): string {
  if (level === "high") return "bg-[#fee2e2] text-[#b91c1c]";
  if (level === "medium") return "bg-[#fef3c7] text-[#b45309]";
  return "bg-[#dcfce7] text-[#166534]";
}

function labelRisk(level: DashboardV2ClientHealth["riskLevel"]): string {
  if (level === "high") return "Alto";
  if (level === "medium") return "Medio";
  return "Bajo";
}

function alertBorder(severity: "high" | "medium" | "low"): string {
  if (severity === "high") return "border-[#fecaca] bg-[#fff5f5]";
  if (severity === "medium") return "border-[#fde68a] bg-[#fffbeb]";
  return "border-[#dbeafe] bg-[#eff6ff]";
}

async function buildDashboardModel(): Promise<{
  data: DashboardV2Response;
  degradedMessage?: string;
}> {
  try {
    const data = await getDashboardV2(RANGE);
    return { data };
  } catch {
    const legacy = await getDashboardStats().catch(() => ({
      kpis: [],
      recentClients: [],
      trendingEmotions: [],
    }));

    return {
      data: {
        overview: {
          clientsTotal: extractKpi(legacy.kpis, "total-clients"),
          connectedAccounts: legacy.recentClients.filter((item) => item.connected).length,
          postsTotal: extractKpi(legacy.kpis, "total-posts"),
          commentsTotal: extractKpi(legacy.kpis, "total-comments"),
          analyzedTotal: extractKpi(legacy.kpis, "analyzed-comments"),
          analysisCoveragePct: 0,
        },
        alerts: [
          {
            id: "legacy-fallback",
            severity: "medium",
            title: "Modo de compatibilidad activado",
            description: "No se pudo cargar dashboard-v2. Mostrando datos base temporales.",
            actionLabel: "Ver clientes",
            actionHref: "/clients",
            ruleId: "LOW_ANALYSIS_COVERAGE",
          },
        ],
        todayActions: [
          {
            id: "legacy-1",
            title: "Revisar cuentas conectadas",
            description: "Valida estado general de clientes con actividad reciente.",
            href: "/clients",
            priority: 1,
          },
          {
            id: "legacy-2",
            title: "Actualizar sincronizaciones",
            description: "Comprueba cuentas con retraso para evitar backlog.",
            href: "/clients",
            priority: 2,
          },
          {
            id: "legacy-3",
            title: "Auditar análisis",
            description: "Confirma que los comentarios clave estén analizados.",
            href: "/clients",
            priority: 3,
          },
        ],
        sentimentTrend: [],
        emotionTop: legacy.trendingEmotions,
        clientsHealth: legacy.recentClients.map((client) => ({
          clientId: client.id,
          name: client.name,
          status: client.status,
          connected: client.connected,
          lastSyncAt: null,
          pendingComments: 0,
          negativeRatePct: 0,
          riskLevel: client.connected ? "low" : "medium",
        })),
      },
      degradedMessage: "Mostrando fallback temporal por error de dashboard-v2.",
    };
  }
}

function extractKpi(
  items: Array<{ id: string; value: string }>,
  id: string,
): number {
  const raw = items.find((item) => item.id === id)?.value ?? "0";
  const normalized = Number(raw.replace(/[.,\s]/g, ""));
  return Number.isFinite(normalized) ? normalized : 0;
}
