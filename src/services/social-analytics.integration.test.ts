import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  analyzePostComments,
  getCommentsExportReport,
  getClient,
  getPost,
  getPostCommentsAnalysis,
  getPosts,
} from "@/services/social-analytics";

const fetchMock = vi.fn<typeof fetch>();

vi.stubGlobal("fetch", fetchMock);

describe("social analytics service integration", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    document.cookie = "ia_auth_token=test-token; path=/";

    fetchMock.mockImplementation(async (input, init) => {
      const url = typeof input === "string" ? input : input.url;

      if (url.includes("/clients/elbuen-sabor") && !url.includes("posts")) {
        return jsonResponse({
          id: "elbuen-sabor",
          name: "Restaurante El Buen Sabor",
          shortName: "RBS",
          industry: "Gastronomia",
          description: "...",
          status: "Activo",
          connected: true,
          avatarColor: "#b45309",
        });
      }

      if (url.includes("/clients/elbuen-sabor/posts/post-rbs-01")) {
        return jsonResponse({
          id: "post-rbs-01",
          clientId: "elbuen-sabor",
          caption: "Menu de verano",
          publishedAt: "12 de abril, 2025",
          imageHint: "hint",
          likes: 1240,
          commentsCount: 85,
          analyzedComments: 72,
        });
      }

      if (url.includes("/clients/elbuen-sabor/posts")) {
        return jsonResponse([
          {
            id: "post-rbs-01",
            clientId: "elbuen-sabor",
            caption: "Menu de verano",
            publishedAt: "12 de abril, 2025",
            imageHint: "hint",
            likes: 1240,
            commentsCount: 85,
            analyzedComments: 72,
          },
        ]);
      }

      if (url.includes("/posts/post-rbs-01/comments/analysis")) {
        return jsonResponse({
          summary: {
            postId: "post-rbs-01",
            total: 2,
            analyzed: 1,
            positive: 1,
            negative: 0,
            neutral: 0,
          },
          comments: [
            {
              id: "c1",
              postId: "post-rbs-01",
              username: "@a",
              text: "ok",
              likes: 1,
              createdAt: "hace 1h",
              sentiment: "Positivo",
              emotion: "Joy",
              confidence: 0.9,
              status: "analyzed",
            },
            {
              id: "c2",
              postId: "post-rbs-01",
              username: "@b",
              text: "pending",
              likes: 0,
              createdAt: "hace 2h",
              sentiment: "Neutral",
              emotion: "-",
              confidence: null,
              status: "pending",
            },
          ],
        });
      }

      if (
        url.includes("/posts/post-rbs-01/comments/analyze") &&
        init?.method === "POST"
      ) {
        return jsonResponse({
          summary: {
            postId: "post-rbs-01",
            total: 2,
            analyzed: 2,
            positive: 1,
            negative: 1,
            neutral: 0,
          },
          comments: [
            {
              id: "c1",
              postId: "post-rbs-01",
              username: "@a",
              text: "ok",
              likes: 1,
              createdAt: "hace 1h",
              sentiment: "Positivo",
              emotion: "Joy",
              confidence: 0.9,
              status: "analyzed",
            },
            {
              id: "c2",
              postId: "post-rbs-01",
              username: "@b",
              text: "pending",
              likes: 0,
              createdAt: "hace 2h",
              sentiment: "Negativo",
              emotion: "Anger",
              confidence: 0.78,
              status: "analyzed",
            },
          ],
        });
      }

      if (
        url.includes("/posts/post-rbs-01/comments/export-report") &&
        init?.method === "POST"
      ) {
        return jsonResponse({
          header: {
            postId: "post-rbs-01",
            clientId: "elbuen-sabor",
            clientName: "Restaurante El Buen Sabor",
            postCaption: "Menu de verano",
            publishedAt: "12 de abril, 2025",
          },
          objective: "aumentar reservas",
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
              emotion: "Anger",
              count: 1,
              comments: [
                {
                  commentId: "c2",
                  username: "@b",
                  text: "pending",
                  likes: 0,
                  createdAt: "hace 2h",
                  sentiment: "Negativo",
                  confidence: 0.78,
                },
              ],
            },
            {
              emotion: "Joy",
              count: 1,
              comments: [
                {
                  commentId: "c1",
                  username: "@a",
                  text: "ok",
                  likes: 1,
                  createdAt: "hace 1h",
                  sentiment: "Positivo",
                  confidence: 0.9,
                },
              ],
            },
          ],
          executive: {
            coveragePct: 100,
            highlights: [
              "Cobertura de analisis: 100% de comentarios totales.",
              "Se detecta friccion relevante: 50% de comentarios negativos.",
              "Emocion dominante: Anger.",
            ],
            nextSteps: [
              {
                priority: "Alta",
                action: "Responder objeciones criticas en menos de 24h",
                rationale: "La tasa de negatividad sugiere friccion activa.",
              },
              {
                priority: "Media",
                action: "Fortalecer CTA y propuesta de valor en el copy",
                rationale: "Aumentar conversion segun objetivo de negocio.",
              },
              {
                priority: "Baja",
                action: "Monitorear evolucion de emociones por semana",
                rationale: "Validar impacto de los ajustes.",
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
          recommendation: "Prioriza objeciones por precio y refuerza valor.",
          generatedAt: "2026-05-06T00:00:00.000Z",
        });
      }

      return jsonResponse({ error: "not found" }, 404);
    });
  });

  it("cubre el flujo cliente -> posts -> detalle", async () => {
    const client = await getClient("elbuen-sabor");
    expect(client?.name).toContain("Buen Sabor");

    const posts = await getPosts("elbuen-sabor");
    expect(posts.length).toBeGreaterThan(0);

    const post = await getPost("elbuen-sabor", posts[0].id);
    expect(post?.id).toBe(posts[0].id);
  });

  it("analiza comentarios pendientes", async () => {
    const before = await getPostCommentsAnalysis("post-rbs-01");
    const pendingBefore = before.comments.filter(
      (item) => item.status === "pending",
    ).length;

    const afterAnalyze = await analyzePostComments("post-rbs-01");
    const pendingAfter = afterAnalyze.comments.filter(
      (item) => item.status === "pending",
    ).length;

    expect(pendingBefore).toBeGreaterThan(0);
    expect(pendingAfter).toBe(0);
    expect(afterAnalyze.summary.analyzed).toBe(afterAnalyze.summary.total);
  });

  it("obtiene reporte exportable de comentarios", async () => {
    const report = await getCommentsExportReport("post-rbs-01", "aumentar reservas");

    expect(report.objective).toBe("aumentar reservas");
    expect(report.summary.analyzed).toBe(2);
    expect(report.emotionGroups[0]?.emotion).toBe("Anger");
    expect(report.executive.coveragePct).toBe(100);
    expect(report.recommendationSource).toBe("multimodal_ai");
    expect(report.recommendation.length).toBeGreaterThan(0);
  });
});

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
