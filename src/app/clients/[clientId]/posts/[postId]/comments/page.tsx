import { notFound } from "next/navigation";

import { CommentAnalysisTable } from "@/components/business/comment-analysis-table";
import {
  getClient,
  getCommentsWorkbenchV2,
  getPost,
  getPostCommentsAnalysis,
} from "@/services/social-analytics";
import type {
  CommentAnalysis,
  CommentsWorkbenchV2Response,
  Post,
  PostAnalysisSummary,
} from "@/types/social";

interface CommentsAnalysisPageProps {
  params: Promise<{ clientId: string; postId: string }>;
}

export default async function CommentsAnalysisPage({ params }: CommentsAnalysisPageProps) {
  const { clientId, postId } = await params;

  const [client, post, workbenchV2] = await Promise.all([
    getClient(clientId),
    getPost(clientId, postId),
    getCommentsWorkbenchV2(postId),
  ]);

  if (!client || !post) {
    notFound();
  }

  if (workbenchV2) {
    return (
      <section className="space-y-4">
        <PostImagePreview imageUrl={post.imageUrl} caption={post.caption} />
        <CommentAnalysisTable initialData={workbenchV2} />
      </section>
    );
  }

  const legacy = await getPostCommentsAnalysis(postId);

  return (
    <section className="space-y-4">
      <PostImagePreview imageUrl={post.imageUrl} caption={post.caption} />
      <CommentAnalysisTable
        initialData={mapLegacyToWorkbench(client.id, client.name, post, legacy.summary, legacy.comments)}
        degradedMessage="Mostrando compatibilidad temporal (workbench-v2 no disponible)."
      />
    </section>
  );
}

function PostImagePreview({
  imageUrl,
  caption,
}: {
  imageUrl?: string;
  caption: string;
}) {
  return (
    <section className="mx-auto w-full max-w-[1120px] rounded-2xl border border-[#cfdae9] bg-white p-4">
      <p className="mb-3 text-[14px] font-semibold text-[#334155]">Publicacion</p>
      <div className="overflow-hidden rounded-xl border border-[#dbe4f2] bg-[#eef3f9]">
        {imageUrl ? (
          <div
            className="h-[260px] w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${imageUrl})` }}
            aria-hidden
          />
        ) : (
          <div className="flex h-[260px] items-center justify-center text-[13px] text-[#64748b]">
            Sin imagen disponible
          </div>
        )}
      </div>
      <p className="mt-3 text-[13px] text-[#64748b]">{caption}</p>
    </section>
  );
}

function mapLegacyToWorkbench(
  clientId: string,
  clientName: string,
  post: Post,
  summary: PostAnalysisSummary,
  comments: CommentAnalysis[],
): CommentsWorkbenchV2Response {
  const pending = comments.filter((item) => item.status === "pending").length;
  const failed = comments.filter((item) => item.status === "failed").length;

  return {
    header: {
      postId: post.id,
      clientId,
      clientName,
      postCaption: post.caption,
      publishedAt: post.publishedAt,
      totalComments: post.commentsCount,
    },
    summary: {
      total: summary.total,
      pending,
      analyzed: summary.analyzed,
      failed,
      positive: summary.positive,
      negative: summary.negative,
      neutral: summary.neutral,
    },
    filtersMeta: {
      emotions: Array.from(
        new Set(comments.map((item) => item.emotion).filter((emotion) => emotion && emotion !== "-")),
      ),
      sentiments: ["Positivo", "Negativo", "Neutral"],
      statuses: ["pending", "analyzed", "failed"],
    },
    items: comments.map((item) => ({
      commentId: item.id,
      username: item.username,
      text: item.text,
      likes: item.likes,
      createdAt: item.createdAt,
      sentiment: item.sentiment,
      emotion: item.emotion,
      confidence: item.confidence,
      analysisStatus: item.status,
      retryCount: item.retryCount ?? 0,
      lastAttemptAt: item.lastAttemptAt ?? null,
      error: item.error ?? null,
    })),
    actions: {
      canAnalyzePending: pending > 0,
      canRefresh: true,
      canReanalyzeRow: true,
    },
  };
}
