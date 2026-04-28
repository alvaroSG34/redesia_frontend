import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  analyzePostComments,
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
});

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
