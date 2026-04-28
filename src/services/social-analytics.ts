import {
  type Client,
  type ClientAccountsSummaryV2Response,
  type ClientDashboardSummary,
  type ClientSummaryV2Response,
  type CommentAnalysis,
  type CommentsWorkbenchV2Response,
  type DashboardRange,
  type DashboardStatsResponse,
  type DashboardV2Response,
  type PaginatedResult,
  type Post,
  type PostDetailV2Response,
  type PostAnalysisSummary,
  type SocialAccount,
} from "@/types/social";
import { getApiBaseUrl, readAuthTokenFromDocument } from "@/lib/auth";

export interface ClientsQuery {
  search?: string;
  status?: "Todos" | "Activos" | "Pendientes" | "Sin cuenta";
  page?: number;
  pageSize?: number;
}

export interface CreateClientInput {
  name: string;
  shortName: string;
  industry: string;
  description?: string;
  status?: "Activo" | "Pendiente" | "Sin cuenta";
  connected?: boolean;
  avatarColor?: string;
}

const API_BASE_URL = getApiBaseUrl();

export async function getDashboardStats(search = ""): Promise<DashboardStatsResponse> {
  return apiFetch<DashboardStatsResponse>("/dashboard", {
    query: { search },
  });
}

export async function getDashboardV2(
  range: DashboardRange = "30d",
  search = "",
): Promise<DashboardV2Response> {
  return apiFetch<DashboardV2Response>("/dashboard-v2", {
    query: { range, search },
  });
}

export async function getClients(query: ClientsQuery = {}): Promise<PaginatedResult<Client>> {
  return apiFetch<PaginatedResult<Client>>("/clients", {
    query: {
      search: query.search,
      status: query.status,
      page: query.page,
      pageSize: query.pageSize,
    },
  });
}

export async function getClient(clientId: string): Promise<Client | null> {
  return apiFetchNullable<Client>(`/clients/${clientId}`);
}

export async function createClient(
  input: CreateClientInput,
  options?: { accessToken?: string },
): Promise<Client> {
  return apiFetch<Client>("/clients", {
    method: "POST",
    body: JSON.stringify(input),
    requireAuth: true,
    accessToken: options?.accessToken,
  });
}

export async function deleteClient(
  clientId: string,
  options?: { accessToken?: string },
): Promise<{ ok: boolean; clientId: string }> {
  return apiFetch<{ ok: boolean; clientId: string }>(`/clients/${clientId}`, {
    method: "DELETE",
    requireAuth: true,
    accessToken: options?.accessToken,
  });
}

export async function getClientDashboardSummary(
  clientId: string,
): Promise<ClientDashboardSummary | null> {
  return apiFetchNullable<ClientDashboardSummary>(`/clients/${clientId}/summary`);
}

export async function getClientSummaryV2(
  clientId: string,
): Promise<ClientSummaryV2Response | null> {
  return apiFetchNullable<ClientSummaryV2Response>(`/clients/${clientId}/summary-v2`);
}

export async function getAccounts(clientId: string): Promise<SocialAccount[]> {
  return apiFetch<SocialAccount[]>(`/clients/${clientId}/accounts`);
}

export async function getAccountsSummaryV2(
  clientId: string,
): Promise<ClientAccountsSummaryV2Response | null> {
  return apiFetchNullable<ClientAccountsSummaryV2Response>(
    `/clients/${clientId}/accounts/summary-v2`,
  );
}

export async function createInstagramOauthUrl(
  clientId: string,
  scopes?: string[],
  options?: { accessToken?: string },
): Promise<{ url: string; state: string; expiresAt: string }> {
  return apiFetch<{ url: string; state: string; expiresAt: string }>(
    `/clients/${clientId}/accounts/instagram/oauth-url`,
    {
      method: "POST",
      body: JSON.stringify({ scopes }),
      requireAuth: true,
      accessToken: options?.accessToken,
    },
  );
}

export async function syncAccount(
  clientId: string,
  accountId: string,
  options?: { accessToken?: string },
): Promise<unknown> {
  return apiFetch<unknown>(`/clients/${clientId}/accounts/${accountId}/sync`, {
    method: "POST",
    requireAuth: true,
    accessToken: options?.accessToken,
  });
}

export async function disconnectAccount(
  clientId: string,
  accountId: string,
  options?: { accessToken?: string },
): Promise<{ ok: boolean; clientId: string; accountId: string }> {
  return apiFetch<{ ok: boolean; clientId: string; accountId: string }>(
    `/clients/${clientId}/accounts/${accountId}/disconnect`,
    {
      method: "POST",
      requireAuth: true,
      accessToken: options?.accessToken,
    },
  );
}


export async function getPosts(clientId: string): Promise<Post[]> {
  return apiFetch<Post[]>(`/clients/${clientId}/posts`);
}

export async function getPost(clientId: string, postId: string): Promise<Post | null> {
  return apiFetchNullable<Post>(`/clients/${clientId}/posts/${postId}`);
}

export async function getPostDetailV2(
  clientId: string,
  postId: string,
): Promise<PostDetailV2Response | null> {
  return apiFetchNullable<PostDetailV2Response>(
    `/clients/${clientId}/posts/${postId}/detail-v2`,
  );
}

export async function getPostCommentsAnalysis(postId: string): Promise<{
  summary: PostAnalysisSummary;
  comments: CommentAnalysis[];
}> {
  return apiFetch<{ summary: PostAnalysisSummary; comments: CommentAnalysis[] }>(
    `/posts/${postId}/comments/analysis`,
  );
}

export async function getCommentsWorkbenchV2(
  postId: string,
): Promise<CommentsWorkbenchV2Response | null> {
  return apiFetchNullable<CommentsWorkbenchV2Response>(
    `/posts/${postId}/comments/workbench-v2`,
  );
}

export async function analyzePostComments(
  postId: string,
  options?: { accessToken?: string },
): Promise<{
  summary: PostAnalysisSummary;
  comments: CommentAnalysis[];
}> {
  return apiFetch<{ summary: PostAnalysisSummary; comments: CommentAnalysis[] }>(
    `/posts/${postId}/comments/analyze`,
    {
      method: "POST",
      requireAuth: true,
      accessToken: options?.accessToken,
    },
  );
}

export async function reanalyzeComment(
  postId: string,
  commentId: string,
  options?: { accessToken?: string },
): Promise<CommentsWorkbenchV2Response> {
  return apiFetch<CommentsWorkbenchV2Response>(
    `/posts/${postId}/comments/${commentId}/reanalyze`,
    {
      method: "POST",
      requireAuth: true,
      accessToken: options?.accessToken,
    },
  );
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit & {
    query?: Record<string, string | number | undefined>;
    requireAuth?: boolean;
    accessToken?: string;
  },
): Promise<T> {
  const { query, requireAuth, accessToken, ...requestOptions } = options ?? {};
  const url = buildUrl(path, query);
  const token = accessToken ?? readAuthTokenFromDocument();

  console.log("[backend]", url);

  if (requireAuth && !token) {
    throw new Error("Tu sesiÃ³n no es vÃ¡lida. Inicia sesiÃ³n nuevamente.");
  }

  const response = await fetch(url, {
    ...requestOptions,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(requestOptions.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await safeErrorText(response);
    throw new Error(
      `API request failed (${response.status}) on ${path}${errorText ? `: ${errorText}` : ""}`,
    );
  }

  return (await response.json()) as T;
}

async function apiFetchNullable<T>(path: string): Promise<T | null> {
  const url = buildUrl(path);
  let response: Response;

  try {
    console.log("[backend]", url);
    response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
  } catch {
    return null;
  }

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorText = await safeErrorText(response);
    throw new Error(
      `API request failed (${response.status}) on ${path}${errorText ? `: ${errorText}` : ""}`,
    );
  }

  return (await response.json()) as T;
}

function buildUrl(
  path: string,
  query?: Record<string, string | number | undefined>,
): string {
  const base = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const url = new URL(`${base}${normalizedPath}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === "") return;
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

async function safeErrorText(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string; error?: string };
    return body.message ?? body.error ?? "";
  } catch {
    return "";
  }
}
