"use client";

import { useMemo, useState, useTransition } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
  getCommentsExportReport,
  getCommentsWorkbenchV2,
  reanalyzeComment,
} from "@/services/social-analytics";
import type {
  AnalysisStatus,
  CommentsExportReportResponse,
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
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportObjective, setExportObjective] = useState("");
  const [exportError, setExportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

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

  const onOpenExportModal = () => {
    setExportError(null);
    setExportObjective("");
    setIsExportModalOpen(true);
  };

  const onCloseExportModal = () => {
    if (isExporting) return;
    setIsExportModalOpen(false);
    setExportError(null);
  };

  const onConfirmExport = async () => {
    const objective = exportObjective.trim();
    if (!objective) {
      setExportError("Debes escribir el objetivo del post para exportar.");
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      const report = await getCommentsExportReport(data.header.postId, objective);
      await downloadCommentsReportPdf(report);
      setIsExportModalOpen(false);
      setExportObjective("");
    } catch (error) {
      setExportError(
        error instanceof Error
          ? error.message
          : "No se pudo exportar el analisis.",
      );
    } finally {
      setIsExporting(false);
    }
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
              onClick={onOpenExportModal}
              disabled={isPending || isExporting}
              className="inline-flex h-10 items-center rounded-xl border border-[#c9d6ea] bg-white px-4 text-[14px] font-semibold text-[#334155] hover:bg-[#f8fbff] disabled:opacity-60"
            >
              {isExporting ? "Exportando..." : "Exportar analisis"}
            </button>
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

      {isExportModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/40 p-4">
          <div className="w-full max-w-[560px] rounded-2xl border border-[#cfdae9] bg-white p-5 shadow-xl">
            <h3 className="text-[20px] font-semibold text-[#0f172a]">Exportar analisis</h3>
            <p className="mt-1 text-[14px] text-[#64748b]">
              Escribe el objetivo del post para generar la recomendacion final.
            </p>

            <label className="mt-4 block text-[13px] font-semibold text-[#334155]">
              Objetivo del post
            </label>
            <textarea
              value={exportObjective}
              onChange={(event) => setExportObjective(event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-xl border border-[#c9d6ea] px-3 py-2 text-[14px] text-[#334155] outline-none focus:border-[#2563eb]"
              placeholder="Ejemplo: aumentar conversiones a reservas en la proxima semana"
            />

            {exportError ? (
              <p className="mt-3 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-[13px] text-[#b91c1c]">
                {exportError}
              </p>
            ) : null}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onCloseExportModal}
                disabled={isExporting}
                className="inline-flex h-10 items-center rounded-xl border border-[#c9d6ea] bg-white px-4 text-[14px] font-semibold text-[#334155] hover:bg-[#f8fbff] disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onConfirmExport}
                disabled={isExporting}
                className="inline-flex h-10 items-center rounded-xl bg-[#2563eb] px-4 text-[14px] font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60"
              >
                {isExporting ? "Generando..." : "Generar PDF"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

async function downloadCommentsReportPdf(report: CommentsExportReportResponse): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 42;
  const contentWidth = pageWidth - marginX * 2;
  const palette = {
    navy: [30, 41, 59] as [number, number, number],
    slate: [71, 85, 105] as [number, number, number],
    gray: [148, 163, 184] as [number, number, number],
    line: [203, 213, 225] as [number, number, number],
    header: [15, 23, 42] as [number, number, number],
    tableHead: [51, 65, 85] as [number, number, number],
  };

  doc.setDrawColor(...palette.line);
  doc.setLineWidth(1);
  doc.line(marginX, 52, pageWidth - marginX, 52);

  doc.setTextColor(...palette.navy);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text("Informe Ejecutivo de Comentarios", marginX, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...palette.slate);
  doc.text(`Cliente: ${report.header.clientName}`, marginX, 72);
  doc.text(`Post: ${report.header.postId} | Fecha: ${report.header.publishedAt}`, marginX, 88);
  doc.text(`Generado: ${formatReportTimestamp(report.generatedAt)}`, marginX, 104);

  let cursorY = 122;
  const captionLines = doc.splitTextToSize(
    `Publicacion: ${report.header.postCaption}`,
    contentWidth,
  );
  doc.setTextColor(...palette.navy);
  doc.setFont("helvetica", "normal");
  doc.text(captionLines, marginX, cursorY);
  cursorY += captionLines.length * 13 + 10;

  const objectiveLines = doc.splitTextToSize(
    `Objetivo: ${report.objective}`,
    contentWidth,
  );
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...palette.header);
  doc.text(objectiveLines, marginX, cursorY);
  doc.setFont("helvetica", "normal");
  cursorY += objectiveLines.length * 13 + 16;

  const imageUrl = report.header.imageUrl?.trim();
  if (imageUrl) {
    cursorY = ensureSpace(doc, cursorY, 250);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...palette.header);
    doc.text("Imagen del post", marginX, cursorY);
    cursorY += 10;

    const imageHeight = await appendPostImageFromUrl(
      doc,
      imageUrl,
      marginX,
      cursorY,
      contentWidth,
      210,
    );

    if (imageHeight > 0) {
      cursorY += imageHeight + 14;
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...palette.slate);
      doc.text("No se pudo cargar la imagen del post para este reporte.", marginX, cursorY + 14);
      doc.setTextColor(...palette.navy);
      cursorY += 32;
    }
  }

  cursorY = ensureSpace(doc, cursorY, 160);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...palette.header);
  doc.text("Resumen ejecutivo", marginX, cursorY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...palette.navy);
  cursorY += 16;

  report.executive.highlights.forEach((highlight) => {
    const bullet = doc.splitTextToSize(`- ${highlight}`, contentWidth);
    doc.text(bullet, marginX, cursorY);
    cursorY += bullet.length * 12 + 4;
  });

  cursorY += 4;

  autoTable(doc, {
    startY: cursorY,
    margin: { left: marginX, right: marginX },
    head: [["Indicador", "Valor"]],
    body: [
      ["Total comentarios", String(report.summary.totalComments)],
      ["Analizados", String(report.summary.analyzed)],
      ["Cobertura", `${report.executive.coveragePct}%`],
      ["Positivos", String(report.summary.positive)],
      ["Negativos", String(report.summary.negative)],
      ["Neutrales", String(report.summary.neutral)],
    ],
    styles: { fontSize: 10, cellPadding: 6, textColor: palette.navy },
    headStyles: { fillColor: palette.tableHead, textColor: [255, 255, 255] },
    bodyStyles: { fillColor: [250, 252, 255] },
    alternateRowStyles: { fillColor: [245, 248, 252] },
    theme: "grid",
  });

  cursorY = getAutoTableY(doc, cursorY + 10);

  autoTable(doc, {
    startY: cursorY,
    margin: { left: marginX, right: marginX },
    head: [["Emocion", "Cantidad", "Participacion"]],
    body: report.summary.emotionDistribution.map((item) => [
      translateEmotion(item.emotion),
      String(item.count),
      `${item.percentage}%`,
    ]),
    styles: { fontSize: 10, cellPadding: 6, textColor: palette.navy },
    headStyles: { fillColor: palette.tableHead, textColor: [255, 255, 255] },
    bodyStyles: { fillColor: [250, 252, 255] },
    alternateRowStyles: { fillColor: [245, 248, 252] },
    theme: "grid",
  });

  cursorY = getAutoTableY(doc, cursorY + 14);
  cursorY = ensureSpace(doc, cursorY, 220);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...palette.header);
  doc.text("Distribucion emocional (grafico de pastel)", marginX, cursorY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  cursorY += 10;

  const pieRendered = appendEmotionPieChartImage(
    doc,
    report.summary.emotionDistribution,
    marginX,
    cursorY,
    contentWidth,
    170,
  );

  if (pieRendered) {
    cursorY += 184;
  } else {
    doc.setTextColor(...palette.slate);
    doc.text("No fue posible renderizar el grafico en este entorno.", marginX, cursorY + 14);
    doc.setTextColor(...palette.navy);
    cursorY += 34;
  }

  cursorY = ensureSpace(doc, cursorY, 170);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...palette.header);
  doc.text("Checklist de acciones priorizadas", marginX, cursorY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...palette.navy);
  cursorY += 16;

  report.executive.nextSteps.forEach((step, index) => {
    const actionLines = doc.splitTextToSize(
      `${index + 1}. [${step.priority}] ${step.action}`,
      contentWidth,
    );
    const rationaleLines = doc.splitTextToSize(`Justificacion: ${step.rationale}`, contentWidth - 14);
    doc.setFont("helvetica", "bold");
    doc.text(actionLines, marginX, cursorY);
    cursorY += actionLines.length * 12 + 2;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...palette.slate);
    doc.text(rationaleLines, marginX + 12, cursorY);
    doc.setTextColor(...palette.navy);
    cursorY += rationaleLines.length * 12 + 6;
  });

  cursorY += 4;
  cursorY = ensureSpace(doc, cursorY, 110);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...palette.header);
  doc.text("Detalle por emocion (Top 7)", marginX, cursorY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  cursorY += 14;

  for (const group of report.emotionGroups) {
    cursorY = ensureSpace(doc, cursorY, 80);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...palette.header);
    doc.text(
      `Emocion: ${translateEmotion(group.emotion)} (${group.count})`,
      marginX,
      cursorY,
    );
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...palette.navy);
    cursorY += 10;

    autoTable(doc, {
      startY: cursorY,
      margin: { left: marginX, right: marginX },
      head: [["Usuario", "Comentario", "Sentimiento", "Conf.", "Likes", "Fecha"]],
      body: group.comments.slice(0, 7).map((comment) => [
        comment.username,
        normalizePdfCommentText(truncateForPdf(comment.text, 220)),
        comment.sentiment,
        comment.confidence == null
          ? "-"
          : `${Math.round(comment.confidence * 100)}%`,
        String(comment.likes),
        comment.createdAt,
      ]),
      styles: { fontSize: 9, cellPadding: 4, valign: "top", textColor: palette.navy },
      headStyles: { fillColor: palette.tableHead, textColor: [255, 255, 255] },
      bodyStyles: { fillColor: [252, 252, 253] },
      alternateRowStyles: { fillColor: [246, 248, 252] },
      theme: "grid",
      columnStyles: {
        1: { cellWidth: 250 },
      },
    });

    cursorY = getAutoTableY(doc, cursorY + 16);
  }

  cursorY = ensureSpace(doc, cursorY, 120);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...palette.header);
  doc.text("Recomendacion final", marginX, cursorY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...palette.slate);
  doc.text(
    `Fuente recomendacion: ${
      report.recommendationSource === "multimodal_ai" ? "IA multimodal" : "Fallback"
    }`,
    marginX,
    cursorY + 14,
  );
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...palette.navy);
  cursorY = renderRecommendationBlock(
    doc,
    report.recommendation,
    marginX,
    cursorY + 32,
    contentWidth,
    palette,
  );

  const filename = buildReportFilename(report.header.postId);
  doc.save(filename);
}

function getAutoTableY(doc: jsPDF, fallback: number): number {
  const withTable = doc as jsPDF & { lastAutoTable?: { finalY: number } };
  return (withTable.lastAutoTable?.finalY ?? fallback) + 14;
}

function ensureSpace(doc: jsPDF, cursorY: number, neededHeight: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (cursorY + neededHeight > pageHeight - 30) {
    doc.addPage();
    return 44;
  }

  return cursorY;
}

function buildReportFilename(postId: string): string {
  const day = new Date().toISOString().slice(0, 10);
  const safePostId = postId.replace(/[^a-zA-Z0-9_-]/g, "-");
  return `reporte-analisis-${safePostId}-${day}.pdf`;
}

function formatReportTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(parsed);
}

function truncateForPdf(value: string, maxLen: number): string {
  if (value.length <= maxLen) return value;
  return `${value.slice(0, maxLen - 3)}...`;
}

function normalizePdfCommentText(value: string): string {
  const normalized = value
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ")
    .replace(/[\u2000-\u200F\u2028-\u202F\u205F\u3000]/g, " ")
    .replace(/[^\p{L}\p{N}\p{P}\p{Zs}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  return normalized.replace(
    /(?:\b[0-9A-Za-zÀ-ÿ]\b(?:\s+|$)){4,}/g,
    (chunk) => chunk.replace(/\s+/g, ""),
  );
}

function renderRecommendationBlock(
  doc: jsPDF,
  rawText: string,
  x: number,
  startY: number,
  width: number,
  palette: {
    navy: [number, number, number];
    slate: [number, number, number];
    header: [number, number, number];
  },
): number {
  const text = normalizeRecommendationForPdf(rawText);
  const lines = text.split("\n");
  let cursorY = startY;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      cursorY += 6;
      continue;
    }

    if (isRecommendationHeading(trimmed)) {
      cursorY = ensureSpace(doc, cursorY, 24);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...palette.header);
      const headingLines = doc.splitTextToSize(trimmed, width);
      doc.text(headingLines, x, cursorY);
      cursorY += headingLines.length * 13 + 2;
      continue;
    }

    cursorY = ensureSpace(doc, cursorY, 22);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...palette.navy);
    const bodyLines = doc.splitTextToSize(trimmed, width);
    doc.text(bodyLines, x, cursorY);
    cursorY += bodyLines.length * 12 + 2;
  }

  return cursorY;
}

function normalizeRecommendationForPdf(value: string): string {
  return value
    .replace(/\r/g, "\n")
    .replace(/[*`#]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

function isRecommendationHeading(value: string): boolean {
  const upper = value.toUpperCase();
  if (
    upper.includes("LECTURA VISUAL DEL POST") ||
    upper.includes("LECTURA DEL MENSAJE") ||
    upper.includes("LECTURA DE LA AUDIENCIA") ||
    upper.includes("RECOMENDACION PARA EL POST ACTUAL") ||
    upper.includes("RECOMENDACION PARA FUTURAS PUBLICACIONES") ||
    upper.includes("RIESGOS SI NO SE ACTUA")
  ) {
    return true;
  }

  return /^[A-ZÁÉÍÓÚÑ0-9\s:]{8,}$/.test(value);
}


function appendEmotionPieChartImage(
  doc: jsPDF,
  emotionDistribution: Array<{ emotion: string; count: number; percentage: number }>,
  x: number,
  y: number,
  width: number,
  height: number,
): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  const segments = emotionDistribution.filter((item) => item.count > 0);
  if (!segments.length) {
    return false;
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 360;

    const context = canvas.getContext("2d");
    if (!context) {
      return false;
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const total = segments.reduce((acc, item) => acc + item.count, 0);
    const centerX = 190;
    const centerY = 180;
    const radius = 108;
    let angleStart = -Math.PI / 2;

    segments.forEach((segment) => {
      const angleEnd = angleStart + (segment.count / total) * Math.PI * 2;
      context.beginPath();
      context.moveTo(centerX, centerY);
      context.arc(centerX, centerY, radius, angleStart, angleEnd);
      context.closePath();
      context.fillStyle = emotionColor(segment.emotion);
      context.fill();
      angleStart = angleEnd;
    });

    context.beginPath();
    context.arc(centerX, centerY, 55, 0, Math.PI * 2);
    context.fillStyle = "#ffffff";
    context.fill();

    context.fillStyle = "#1e293b";
    context.font = "bold 28px Arial";
    context.textAlign = "center";
    context.fillText(String(total), centerX, centerY - 3);
    context.font = "14px Arial";
    context.fillStyle = "#475569";
    context.fillText("comentarios", centerX, centerY + 18);

    context.textAlign = "left";
    let legendY = 74;
    segments.forEach((segment) => {
      context.fillStyle = emotionColor(segment.emotion);
      context.fillRect(380, legendY, 14, 14);
      context.fillStyle = "#1e293b";
      context.font = "bold 14px Arial";
      context.fillText(translateEmotion(segment.emotion), 402, legendY + 12);
      context.fillStyle = "#64748b";
      context.font = "13px Arial";
      context.fillText(
        `${segment.count} comentarios (${segment.percentage}%)`,
        402,
        legendY + 30,
      );
      legendY += 54;
    });

    const image = canvas.toDataURL("image/png");
    doc.addImage(image, "PNG", x, y, width, height, undefined, "NONE");
    return true;
  } catch {
    return false;
  }
}

async function appendPostImageFromUrl(
  doc: jsPDF,
  imageUrl: string,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
): Promise<number> {
  if (typeof window === "undefined") {
    return 0;
  }

  try {
    const encoded = await encodeImageAsDataUrl(imageUrl);
    if (!encoded) {
      return 0;
    }

    const dimensions = await measureDataImage(encoded.dataUrl);
    if (!dimensions) {
      return 0;
    }

    let renderWidth = maxWidth;
    let renderHeight = (dimensions.height / dimensions.width) * renderWidth;

    if (renderHeight > maxHeight) {
      const ratio = maxHeight / renderHeight;
      renderHeight = maxHeight;
      renderWidth *= ratio;
    }

    doc.addImage(
      encoded.dataUrl,
      encoded.format,
      x,
      y,
      renderWidth,
      renderHeight,
      undefined,
      "FAST",
    );

    return renderHeight;
  } catch {
    return 0;
  }
}

async function encodeImageAsDataUrl(
  url: string,
): Promise<{ dataUrl: string; format: "PNG" | "JPEG" | "WEBP" } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    const dataUrl = await blobToDataUrl(blob);
    if (!dataUrl) {
      return null;
    }

    const mime = blob.type.toLowerCase();
    const format: "PNG" | "JPEG" | "WEBP" =
      mime.includes("png") ? "PNG" : mime.includes("webp") ? "WEBP" : "JPEG";

    return { dataUrl, format };
  } catch {
    return null;
  }
}

function blobToDataUrl(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      resolve(result);
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

function measureDataImage(url: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      if (!image.width || !image.height) {
        resolve(null);
        return;
      }
      resolve({ width: image.width, height: image.height });
    };
    image.onerror = () => resolve(null);
    image.src = url;
  });
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
