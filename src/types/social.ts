export type AnalysisStatus = "pending" | "analyzed" | "failed";

export type ClientStatus = "Activo" | "Pendiente" | "Sin cuenta";

export type Sentiment = "Positivo" | "Negativo" | "Neutral";

export interface Client {
  id: string;
  name: string;
  shortName: string;
  industry: string;
  description: string;
  status: ClientStatus;
  connected: boolean;
  avatarColor: string;
  postCount?: number;
  commentCount?: number;
}

export interface SocialAccount {
  id: string;
  clientId: string;
  platform: "Instagram Business";
  handle: string;
  igBusinessId: string;
  facebookPage: string;
  scopes: string[];
  status: "Conectado" | "Pendiente" | "Desconectado";
  lastSync: string;
}

export interface Post {
  id: string;
  clientId: string;
  caption: string;
  publishedAt: string;
  imageUrl?: string;
  imageHint: string;
  likes: number;
  commentsCount: number;
  analyzedComments: number;
}

export interface Comment {
  id: string;
  postId: string;
  username: string;
  text: string;
  likes: number;
  createdAt: string;
}

export interface EmotionScore {
  emotion: string;
  count: number;
  percentage: number;
}

export interface CommentAnalysis extends Comment {
  sentiment: Sentiment;
  emotion: string;
  confidence: number | null;
  status: AnalysisStatus;
  retryCount?: number;
  lastAttemptAt?: string | null;
  error?: string | null;
}

export interface CommentsWorkbenchItem {
  commentId: string;
  username: string;
  text: string;
  likes: number;
  createdAt: string;
  sentiment: Sentiment;
  emotion: string;
  confidence: number | null;
  analysisStatus: AnalysisStatus;
  retryCount: number;
  lastAttemptAt: string | null;
  error: string | null;
}

export interface CommentsWorkbenchV2Response {
  header: {
    postId: string;
    clientId: string;
    clientName: string;
    postCaption: string;
    publishedAt: string;
    totalComments: number;
  };
  summary: {
    total: number;
    pending: number;
    analyzed: number;
    failed: number;
    positive: number;
    negative: number;
    neutral: number;
  };
  filtersMeta: {
    emotions: string[];
    sentiments: Sentiment[];
    statuses: AnalysisStatus[];
  };
  items: CommentsWorkbenchItem[];
  actions: {
    canAnalyzePending: boolean;
    canRefresh: boolean;
    canReanalyzeRow: boolean;
  };
}

export interface DashboardKpi {
  id: string;
  label: string;
  value: string;
  delta: string;
  context: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PostAnalysisSummary {
  postId: string;
  total: number;
  analyzed: number;
  positive: number;
  negative: number;
  neutral: number;
  topEmotion?: string;
}

export interface ClientDashboardSummary {
  client: Client;
  kpis: DashboardKpi[];
  emotionDistribution: EmotionScore[];
  topPosts: Post[];
}

export type ClientSummaryAlertSeverity = "high" | "medium" | "low";
export type ClientSummaryHealth = "good" | "warning" | "critical";
export type ClientSummaryAlertRuleId =
  | "NO_CONNECTED_ACCOUNT"
  | "STALE_SYNC"
  | "LOW_ANALYSIS_COVERAGE"
  | "HIGH_NEGATIVE_RATE"
  | "PENDING_WORKLOAD";

export interface ClientSummaryV2Response {
  clientHeader: Pick<
    Client,
    "id" | "name" | "shortName" | "industry" | "connected" | "status" | "avatarColor"
  >;
  statusOverview: {
    health: ClientSummaryHealth;
    coveragePct: number;
    negativePct: number;
    pendingComments: number;
    lastSyncAt: string | null;
    connectedAccounts: number;
  };
  alerts: Array<{
    id: string;
    severity: ClientSummaryAlertSeverity;
    title: string;
    description: string;
    actionLabel: string;
    actionHref: string;
    ruleId: ClientSummaryAlertRuleId;
  }>;
  kpis: Array<{
    id: string;
    label: string;
    value: string;
    deltaPct: number;
    context: string;
  }>;
  comparison: {
    periodLabelCurrent: string;
    periodLabelPrevious: string;
  };
  emotionTop: EmotionScore[];
  recentPosts: Post[];
}

export type AccountHealth = "good" | "warning" | "critical";

export interface ClientAccountsSummaryV2Response {
  header: {
    clientId: string;
    clientName: string;
    connectedAccounts: number;
    totalAccounts: number;
    health: AccountHealth;
    lastSyncAt: string | null;
  };
  primaryAccount: {
    id: string;
    platform: "Instagram Business";
    handle: string;
    status: "Conectado" | "Pendiente" | "Desconectado";
    lastSyncAt: string | null;
    scopes: string[];
  } | null;
  accounts: Array<{
    id: string;
    platform: "Instagram Business";
    handle: string;
    status: "Conectado" | "Pendiente" | "Desconectado";
    lastSyncAt: string | null;
    scopes: string[];
  }>;
  actions: {
    canConnect: boolean;
    canReconnect: boolean;
    canSync: boolean;
    canDisconnect: boolean;
  };
  syncHistory: Array<{
    id: string;
    status: "running" | "success" | "failed";
    trigger: "manual" | "cron";
    startedAt: string;
    finishedAt: string | null;
    postsSynced: number;
    commentsSynced: number;
    analyzedCount: number;
    error: string | null;
  }>;
}

export interface DashboardStatsResponse {
  kpis: DashboardKpi[];
  recentClients: Client[];
  trendingEmotions: EmotionScore[];
}

export type DashboardRange = "30d" | "7d" | "month";
export type AlertSeverity = "high" | "medium" | "low";
export type ClientRiskLevel = "high" | "medium" | "low";

export interface DashboardV2Overview {
  clientsTotal: number;
  connectedAccounts: number;
  postsTotal: number;
  commentsTotal: number;
  analyzedTotal: number;
  analysisCoveragePct: number;
}

export interface DashboardV2Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  ruleId:
    | "HIGH_NEGATIVE_SPIKE"
    | "STALE_SYNC"
    | "LOW_ANALYSIS_COVERAGE"
    | "PENDING_WORKLOAD";
}

export interface DashboardV2Action {
  id: string;
  title: string;
  description: string;
  href: string;
  priority: 1 | 2 | 3;
}

export interface DashboardV2TrendPoint {
  period: string;
  positive: number;
  neutral: number;
  negative: number;
}

export interface DashboardV2ClientHealth {
  clientId: string;
  name: string;
  status: ClientStatus;
  connected: boolean;
  lastSyncAt: string | null;
  pendingComments: number;
  negativeRatePct: number;
  riskLevel: ClientRiskLevel;
}

export interface DashboardV2Response {
  overview: DashboardV2Overview;
  alerts: DashboardV2Alert[];
  todayActions: DashboardV2Action[];
  sentimentTrend: DashboardV2TrendPoint[];
  emotionTop: EmotionScore[];
  clientsHealth: DashboardV2ClientHealth[];
}

export type PostDetailAnalysisStatus = "pending" | "partial" | "complete";
export type PostDetailSentimentLabel = "positive" | "negative" | "neutral";
export type PostDetailActionIntent = "primary" | "secondary" | "neutral";

export interface PostDetailV2Response {
  postHeader: {
    postId: string;
    clientId: string;
    clientName: string;
    caption: string;
    publishedAt: string;
    mediaType: string;
    imageUrl: string | null;
    accountHandle: string;
    accountPlatform: string;
    accountStatus: SocialAccount["status"] | "Cuenta no disponible";
  };
  performance: {
    likes: number;
    commentsTotal: number;
    analyzedComments: number;
    pendingComments: number;
    analysisStatus: PostDetailAnalysisStatus;
  };
  sentiment: {
    label: PostDetailSentimentLabel;
    positivePct: number;
    negativePct: number;
    neutralPct: number;
    topEmotion: string | null;
  };
  comparison: {
    periodLabelCurrent: string;
    periodLabelPrevious: string;
    likesDeltaPct: number;
    commentsDeltaPct: number;
    negativePctDelta: number;
  };
  actions: {
    primary: {
      label: string;
      href: string;
    };
    secondary: Array<{
      label: string;
      href: string;
      intent: PostDetailActionIntent;
    }>;
  };
}


