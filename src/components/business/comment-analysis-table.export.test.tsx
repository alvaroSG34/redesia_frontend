import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

import { CommentAnalysisTable } from "@/components/business/comment-analysis-table";
import { getCommentsExportReport } from "@/services/social-analytics";
import type { CommentsWorkbenchV2Response } from "@/types/social";

const saveMock = vi.fn();
const textMock = vi.fn();

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Pie: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Cell: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

vi.mock("jspdf", () => {
  class JsPdfMock {
    internal = {
      pageSize: {
        getWidth: () => 595,
        getHeight: () => 842,
      },
    };

    setFontSize = vi.fn();
    setTextColor = vi.fn();
    setDrawColor = vi.fn();
    setLineWidth = vi.fn();
    line = vi.fn();
    text = textMock;
    splitTextToSize = (value: string) => [value];
    setFont = vi.fn();
    addPage = vi.fn();
    save = saveMock;
  }

  return { default: JsPdfMock };
});

vi.mock("jspdf-autotable", () => ({
  default: vi.fn((doc: { lastAutoTable?: { finalY: number } }, options: { startY?: number }) => {
    doc.lastAutoTable = { finalY: (options.startY ?? 40) + 40 };
  }),
}));

vi.mock("@/services/social-analytics", () => ({
  analyzePostComments: vi.fn(),
  getCommentsWorkbenchV2: vi.fn(),
  getCommentsExportReport: vi.fn(),
  reanalyzeComment: vi.fn(),
}));

describe("CommentAnalysisTable export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    textMock.mockReset();
  });

  it("abre modal de exportacion", async () => {
    const user = userEvent.setup();
    render(<CommentAnalysisTable initialData={buildWorkbench()} />);

    await user.click(screen.getByRole("button", { name: "Exportar analisis" }));

    expect(screen.getByText("Objetivo del post")).toBeInTheDocument();
  });

  it("valida objetivo requerido", async () => {
    const user = userEvent.setup();
    render(<CommentAnalysisTable initialData={buildWorkbench()} />);

    await user.click(screen.getByRole("button", { name: "Exportar analisis" }));
    await user.click(screen.getByRole("button", { name: "Generar PDF" }));

    expect(
      screen.getByText("Debes escribir el objetivo del post para exportar."),
    ).toBeInTheDocument();
  });

  it("solicita reporte y genera pdf", async () => {
    const user = userEvent.setup();
    vi.mocked(getCommentsExportReport).mockResolvedValue({
      header: {
        postId: "post-1",
        clientId: "client-1",
        clientName: "Cliente 1",
        postCaption: "Caption",
        publishedAt: "01 de mayo, 2026",
      },
      objective: "aumentar conversion",
      summary: {
        totalComments: 2,
        analyzed: 2,
        positive: 1,
        negative: 1,
        neutral: 0,
        emotionDistribution: [
          { emotion: "Joy", count: 1, percentage: 50 },
          { emotion: "Anger", count: 1, percentage: 50 },
        ],
      },
      emotionGroups: [
        {
          emotion: "Joy",
          count: 1,
          comments: [
            {
              commentId: "c-1",
              username: "@ana",
              text: "excelente",
              likes: 2,
              createdAt: "hace 2h",
              sentiment: "Positivo",
              confidence: 0.95,
            },
          ],
        },
      ],
      executive: {
        coveragePct: 100,
        highlights: [
          "Cobertura de analisis: 100% de comentarios totales.",
          "Sentimiento favorable dominante: 70% de comentarios positivos.",
          "Emocion dominante: Joy.",
        ],
        nextSteps: [
          {
            priority: "Alta",
            action: "Escalar formato con mejor respuesta",
            rationale: "Existe validacion positiva suficiente.",
          },
          {
            priority: "Media",
            action: "Optimizar CTA por segmento",
            rationale: "Incrementar conversion al siguiente paso.",
          },
          {
            priority: "Baja",
            action: "Monitorear variacion semanal",
            rationale: "Asegurar consistencia del impacto.",
          },
        ],
      },
      recommendationSource: "multimodal_ai",
      recommendationInputsUsed: {
        image: true,
        caption: true,
        objective: true,
        comments: true,
      },
      recommendation: "Refuerza CTA con prueba social.",
      generatedAt: "2026-05-06T00:00:00.000Z",
    });

    render(<CommentAnalysisTable initialData={buildWorkbench()} />);

    await user.click(screen.getByRole("button", { name: "Exportar analisis" }));
    await user.type(
      screen.getByPlaceholderText(
        "Ejemplo: aumentar conversiones a reservas en la proxima semana",
      ),
      "aumentar conversion",
    );
    await user.click(screen.getByRole("button", { name: "Generar PDF" }));

    await waitFor(() => {
      expect(getCommentsExportReport).toHaveBeenCalledWith(
        "post-1",
        "aumentar conversion",
      );
    });

    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(
      textMock.mock.calls.some((call) => String(call[0]).includes("Resumen ejecutivo")),
    ).toBe(true);
    expect(
      textMock.mock.calls.some((call) =>
        String(call[0]).includes("Checklist de acciones priorizadas"),
      ),
    ).toBe(true);
  });
});

function buildWorkbench(): CommentsWorkbenchV2Response {
  return {
    header: {
      postId: "post-1",
      clientId: "client-1",
      clientName: "Cliente 1",
      postCaption: "Post de prueba",
      publishedAt: "01 de mayo, 2026",
      totalComments: 1,
    },
    summary: {
      total: 1,
      pending: 0,
      analyzed: 1,
      failed: 0,
      positive: 1,
      negative: 0,
      neutral: 0,
    },
    filtersMeta: {
      emotions: ["Joy"],
      sentiments: ["Positivo", "Negativo", "Neutral"],
      statuses: ["pending", "analyzed", "failed"],
    },
    items: [
      {
        commentId: "c-1",
        username: "@ana",
        text: "excelente",
        likes: 2,
        createdAt: "hace 2h",
        sentiment: "Positivo",
        emotion: "Joy",
        confidence: 0.95,
        analysisStatus: "analyzed",
        retryCount: 0,
        lastAttemptAt: null,
        error: null,
      },
    ],
    actions: {
      canAnalyzePending: false,
      canRefresh: true,
      canReanalyzeRow: true,
    },
  };
}
