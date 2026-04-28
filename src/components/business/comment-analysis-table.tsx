"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import {
  analyzePostComments,
  getCommentsWorkbenchV2,
  reanalyzeComment,
} from "@/services/social-analytics";
import type {
  AnalysisStatus,
  CommentsWorkbenchItem,
  CommentsWorkbenchV2Response,
  Sentiment,
} from "@/types/social";

interface CommentAnalysisTableProps {
  initialData: CommentsWorkbenchV2Response;
  degradedMessage?: string;
}

type DateFilter = "all" | "24h" | "7d" | "30d";
type BucketFilter = "all" | AnalysisStatus;

export function CommentAnalysisTable({ initialData, degradedMessage }: CommentAnalysisTableProps) {
  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState<"all" | Sentiment>("all");
  const [emotionFilter, setEmotionFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [bucket, setBucket] = useState<BucketFilter>("all");
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredRows = useMemo(() => {
    const lower = query.trim().toLowerCase();

    return data.items.filter((row) => {
      const matchesBucket = bucket === "all" || row.analysisStatus === bucket;
      const matchesSearch =
        !lower ||
        row.username.toLowerCase().includes(lower) ||
        row.text.toLowerCase().includes(lower);
      const matchesSentiment =
        sentimentFilter === "all" || row.sentiment === sentimentFilter;
      const matchesEmotion = emotionFilter === "all" || row.emotion === emotionFilter;
      const matchesDate = matchesDateFilter(row.createdAt, dateFilter);

      return matchesBucket && matchesSearch && matchesSentiment && matchesEmotion && matchesDate;
    });
  }, [bucket, data.items, dateFilter, emotionFilter, query, sentimentFilter]);

  const emotionChart = useMemo(() => {
    const analyzed = data.items.filter(
      (row) => row.analysisStatus === "analyzed" && row.emotion && row.emotion !== "-",
    );

    const totals = new Map<string, number>();
    for (const row of analyzed) {
      totals.set(row.emotion, (totals.get(row.emotion) ?? 0) + 1);
    }

    const total = analyzed.length;
    const items = Array.from(totals.entries())
      .map(([emotion, count]) => ({
        emotion,
        label: translateEmotion(emotion),
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return { total, items };
  }, [data.items]);

  const onRefresh = () => {
    startTransition(async () => {
      const payload = await getCommentsWorkbenchV2(data.header.postId);
      if (payload) {
        setData(payload);
      }
    });
  };

  const onAnalyzePending = () => {
    startTransition(async () => {
      await analyzePostComments(data.header.postId);
      const refreshed = await getCommentsWorkbenchV2(data.header.postId);
      if (refreshed) {
        setData(refreshed);
      }
    });
  };

  const onReanalyzeRow = (commentId: string) => {
    setActiveRowId(commentId);
    startTransition(async () => {
      try {
        const refreshed = await reanalyzeComment(data.header.postId, commentId);
        setData(refreshed);
      } finally {
        setActiveRowId(null);
      }
    });
  };

  return (
    <section className="mx-auto w-full max-w-[1120px] space-y-6 pb-6">
      <header className="rounded-2xl border border-[#cfdae9] bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-[34px] font-bold tracking-tight text-[#0f172a]">Workbench de comentarios</h1>
            <p className="mt-1 text-[15px] text-[#64748b]">
              {data.header.clientName} · {truncateText(data.header.postCaption, 90)}
            </p>
            <p className="text-[13px] text-[#64748b]">Post: {data.header.publishedAt}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isPending || !data.actions.canRefresh}
              className="inline-flex h-10 items-center rounded-xl border border-[#c9d6ea] bg-white px-4 text-[14px] font-semibold text-[#334155] hover:bg-[#f8fbff] disabled:opacity-60"
            >
              Actualizar
            </button>
            <button
              type="button"
              onClick={onAnalyzePending}
              disabled={isPending || !data.actions.canAnalyzePending}
              className="inline-flex h-10 items-center rounded-xl bg-[#2563eb] px-4 text-[14px] font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60"
            >
              {isPending ? "Procesando..." : "Analizar pendientes"}
            </button>
          </div>
        </div>

        {degradedMessage ? (
          <p className="mt-4 rounded-lg border border-[#f4d7a7] bg-[#fff9ee] px-3 py-2 text-[13px] text-[#92400e]">
            {degradedMessage}
          </p>
        ) : null}
      </header>

      <section className="rounded-2xl border border-[#cfdae9] bg-white p-4">
        <h2 className="text-[18px] font-semibold text-[#0f172a]">Distribucion de emociones</h2>
        {emotionChart.items.length ? (
          <div className="mt-3 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={emotionChart.items}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={48}
                    paddingAngle={2}
                  >
                    {emotionChart.items.map((entry) => (
                      <Cell key={entry.emotion} fill={emotionColor(entry.emotion)} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-2">
              {emotionChart.items.map((item) => (
                <li
                  key={item.emotion}
                  className="flex items-center justify-between rounded-lg border border-[#e2e8f0] px-3 py-2 text-[14px]"
                >
                  <span className="inline-flex items-center gap-2 text-[#334155]">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: emotionColor(item.emotion) }}
                    />
                    {item.label}
                  </span>
                  <span className="font-semibold text-[#0f172a]">
                    {item.count} ({item.percentage}%)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-3 rounded-lg border border-dashed border-[#dbe4f2] px-3 py-4 text-[14px] text-[#64748b]">
            Sin datos de emociones para el filtro actual.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-[#cfdae9] bg-white p-4">
        <div className="flex flex-wrap gap-2">
          <BucketButton label="Todos" active={bucket === "all"} onClick={() => setBucket("all")} />
          <BucketButton label="Pendientes" active={bucket === "pending"} onClick={() => setBucket("pending")} />
          <BucketButton label="Fallidos" active={bucket === "failed"} onClick={() => setBucket("failed")} />
          <BucketButton label="Analizados" active={bucket === "analyzed"} onClick={() => setBucket("analyzed")} />
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por usuario o texto"
            className="h-10 rounded-xl border border-[#c9d6ea] px-3 text-[14px] text-[#334155] outline-none focus:border-[#2563eb]"
          />

          <select
            value={sentimentFilter}
            onChange={(event) => setSentimentFilter(event.target.value as "all" | Sentiment)}
            className="h-10 rounded-xl border border-[#c9d6ea] px-3 text-[14px] text-[#334155]"
          >
            <option value="all">Sentimiento</option>
            <option value="Positivo">Positivo</option>
            <option value="Negativo">Negativo</option>
            <option value="Neutral">Neutral</option>
          </select>

          <select
            value={emotionFilter}
            onChange={(event) => setEmotionFilter(event.target.value)}
            className="h-10 rounded-xl border border-[#c9d6ea] px-3 text-[14px] text-[#334155]"
          >
            <option value="all">Emoción</option>
            {data.filtersMeta.emotions.map((emotion) => (
              <option key={emotion} value={emotion}>
                {translateEmotion(emotion)}
              </option>
            ))}
          </select>

          <select
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value as DateFilter)}
            className="h-10 rounded-xl border border-[#c9d6ea] px-3 text-[14px] text-[#334155]"
          >
            <option value="all">Fecha</option>
            <option value="24h">Últimas 24h</option>
            <option value="7d">Últimos 7d</option>
            <option value="30d">Últimos 30d</option>
          </select>

          <div className="inline-flex h-10 items-center rounded-xl border border-dashed border-[#c9d6ea] px-3 text-[13px] text-[#64748b]">
            {filteredRows.length} visibles
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#cfdae9] bg-white">
        <div className="max-h-[560px] overflow-auto">
          <table className="min-w-full text-left text-[14px]">
            <thead className="sticky top-0 bg-[#f8fafc] text-[#475569]">
              <tr>
                <th className="px-4 py-3 font-semibold">Usuario</th>
                <th className="px-4 py-3 font-semibold">Comentario</th>
                <th className="px-4 py-3 font-semibold">Likes</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Sentimiento</th>
                <th className="px-4 py-3 font-semibold">Emoción</th>
                <th className="px-4 py-3 font-semibold">Conf.</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Intentos</th>
                <th className="px-4 py-3 font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length ? (
                filteredRows.map((row) => (
                  <CommentRow
                    key={row.commentId}
                    row={row}
                    disabled={isPending || !data.actions.canReanalyzeRow}
                    loading={activeRowId === row.commentId}
                    onReanalyze={onReanalyzeRow}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-[#64748b]">
                    No hay comentarios para estos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function CommentRow({
  row,
  disabled,
  loading,
  onReanalyze,
}: {
  row: CommentsWorkbenchItem;
  disabled: boolean;
  loading: boolean;
  onReanalyze: (commentId: string) => void;
}) {
  return (
    <tr className="border-t border-[#eef2f7] align-top">
      <td className="px-4 py-3 font-medium text-[#1e293b]">{row.username}</td>
      <td className="max-w-[420px] px-4 py-3 text-[#334155]">{row.text}</td>
      <td className="px-4 py-3 text-[#334155]">{row.likes}</td>
      <td className="px-4 py-3 text-[#64748b]">{row.createdAt}</td>
      <td className="px-4 py-3"><SentimentPill value={row.sentiment} status={row.analysisStatus} /></td>
      <td className="px-4 py-3"><EmotionPill value={row.emotion} status={row.analysisStatus} /></td>
      <td className="px-4 py-3 text-[#334155]">
        {row.confidence == null ? "-" : `${Math.round(row.confidence * 100)}%`}
      </td>
      <td className="px-4 py-3"><StatusPill status={row.analysisStatus} /></td>
      <td className="px-4 py-3 text-[#334155]">{row.retryCount}</td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={() => onReanalyze(row.commentId)}
          disabled={disabled || loading}
          className="inline-flex h-8 items-center rounded-lg border border-[#c9d6ea] bg-white px-3 text-[12px] font-semibold text-[#334155] hover:bg-[#f8fbff] disabled:opacity-60"
        >
          {loading ? "Reanalizando..." : "Reanalizar"}
        </button>
      </td>
    </tr>
  );
}

function BucketButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-xl bg-[#2563eb] px-4 py-2 text-[13px] font-semibold text-white"
          : "rounded-xl bg-[#f1f5f9] px-4 py-2 text-[13px] font-semibold text-[#334155] hover:bg-[#e2e8f0]"
      }
    >
      {label}
    </button>
  );
}

function SentimentPill({ value, status }: { value: Sentiment; status: AnalysisStatus }) {
  if (status !== "analyzed") {
    return <span className="rounded-full bg-[#e2e8f0] px-2 py-1 text-[12px] font-semibold text-[#334155]">-</span>;
  }

  if (value === "Positivo") {
    return <span className="rounded-full bg-[#dcfce7] px-2 py-1 text-[12px] font-semibold text-[#166534]">Positivo</span>;
  }

  if (value === "Negativo") {
    return <span className="rounded-full bg-[#fee2e2] px-2 py-1 text-[12px] font-semibold text-[#b91c1c]">Negativo</span>;
  }

  return <span className="rounded-full bg-[#e2e8f0] px-2 py-1 text-[12px] font-semibold text-[#334155]">Neutral</span>;
}

function EmotionPill({ value, status }: { value: string; status: AnalysisStatus }) {
  if (status !== "analyzed" || !value || value === "-") {
    return <span className="rounded-full bg-[#e2e8f0] px-2 py-1 text-[12px] font-semibold text-[#334155]">-</span>;
  }

  return <span className="rounded-full bg-[#eef2ff] px-2 py-1 text-[12px] font-semibold text-[#3730a3]">{translateEmotion(value)}</span>;
}

function StatusPill({ status }: { status: AnalysisStatus }) {
  if (status === "analyzed") {
    return <span className="rounded-full bg-[#dcfce7] px-2 py-1 text-[12px] font-semibold text-[#166534]">Analizado</span>;
  }

  if (status === "failed") {
    return <span className="rounded-full bg-[#fee2e2] px-2 py-1 text-[12px] font-semibold text-[#b91c1c]">Fallido</span>;
  }

  return <span className="rounded-full bg-[#fef3c7] px-2 py-1 text-[12px] font-semibold text-[#92400e]">Pendiente</span>;
}

function matchesDateFilter(createdAt: string, filter: DateFilter): boolean {
  if (filter === "all") {
    return true;
  }

  const hours = parseRelativeToHours(createdAt);
  if (hours == null) {
    return true;
  }

  if (filter === "24h") {
    return hours <= 24;
  }

  if (filter === "7d") {
    return hours <= 168;
  }

  return hours <= 720;
}

function parseRelativeToHours(value: string): number | null {
  const normalized = value.toLowerCase();
  const hourMatch = normalized.match(/(\d+)\s*h/);
  if (hourMatch?.[1]) {
    return Number(hourMatch[1]);
  }

  const dayMatch = normalized.match(/(\d+)\s*d/);
  if (dayMatch?.[1]) {
    return Number(dayMatch[1]) * 24;
  }

  return null;
}

function truncateText(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

function emotionColor(emotion: string): string {
  const map: Record<string, string> = {
    Joy: "#16a34a",
    Love: "#db2777",
    Anger: "#dc2626",
    Surprise: "#4f46e5",
    Sadness: "#2563eb",
    Fear: "#64748b",
    Disgust: "#15803d",
  };

  return map[emotion] ?? "#94a3b8";
}

function translateEmotion(emotion: string): string {
  const map: Record<string, string> = {
    Joy: "Alegria",
    Love: "Amor",
    Anger: "Enojo",
    Surprise: "Sorpresa",
    Sadness: "Tristeza",
    Fear: "Miedo",
    Disgust: "Disgusto",
  };

  return map[emotion] ?? emotion;
}
