import Link from "next/link";
import { notFound } from "next/navigation";

import { commentsRoute } from "@/lib/routes";
import {
  getClient,
  getPost,
  getPostCommentsAnalysis,
  getPostDetailV2,
} from "@/services/social-analytics";
import {
  type CommentAnalysis,
  type Post,
  type PostDetailV2Response,
} from "@/types/social";

interface PostDetailPageProps {
  params: Promise<{ clientId: string; postId: string }>;
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { clientId, postId } = await params;
  const [detailV2, comments] = await Promise.all([
    getPostDetailV2(clientId, postId),
    loadComments(postId),
  ]);

  if (detailV2) {
    return <SimplePostView data={detailV2} comments={comments} />;
  }

  const [client, post] = await Promise.all([
    getClient(clientId),
    getPost(clientId, postId),
  ]);

  if (!client || !post) {
    notFound();
  }

  return (
    <SimplePostView
      data={mapLegacyToV2(clientId, postId, client.name, post)}
      comments={comments}
      degradedMessage="Mostrando compatibilidad temporal (detail-v2 no disponible)."
    />
  );
}

function SimplePostView({
  data,
  comments,
  degradedMessage,
}: {
  data: PostDetailV2Response;
  comments: CommentAnalysis[];
  degradedMessage?: string;
}) {
  return (
    <section className="mx-auto w-full max-w-[760px] space-y-5 pb-6">
      <article className="rounded-2xl border border-[#cfdae9] bg-white p-5">
        <nav className="flex flex-wrap items-center gap-2 text-[13px] text-[#64748b]">
          <Link href="/clients" className="hover:text-[#1d4ed8]">Clientes</Link>
          <span>/</span>
          <Link href={`/clients/${data.postHeader.clientId}`} className="hover:text-[#1d4ed8]">
            {data.postHeader.clientName}
          </Link>
          <span>/</span>
          <Link href={`/clients/${data.postHeader.clientId}/posts`} className="hover:text-[#1d4ed8]">Publicaciones</Link>
        </nav>

        <div className="mt-4 overflow-hidden rounded-xl border border-[#d8e2f0]">
          {data.postHeader.imageUrl ? (
            <div
              className="h-[420px] w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${data.postHeader.imageUrl})` }}
              aria-hidden
            />
          ) : (
            <div className="flex h-[420px] items-center justify-center bg-[#eef3f9] text-[14px] text-[#64748b]">
              Sin imagen disponible
            </div>
          )}

          <div className="space-y-3 bg-white px-5 py-4">
            <p className="text-[15px] leading-6 text-[#334155]">{data.postHeader.caption}</p>

            <div className="flex flex-wrap items-center gap-3 text-[14px] text-[#475569]">
              <span className="font-semibold text-[#0f172a]">{formatNumber(data.performance.likes)} reacciones</span>
              <span className="text-[#94a3b8]">•</span>
              <span className="font-semibold text-[#0f172a]">{formatNumber(data.performance.commentsTotal)} comentarios</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e2e8f0] pt-3">
              <div className="flex items-center gap-2 text-[12px] text-[#64748b]">
                <span className="rounded-full bg-[#e8f0ff] px-3 py-1 font-semibold text-[#1d4ed8]">{data.postHeader.mediaType}</span>
                <span>{data.postHeader.publishedAt}</span>
              </div>

              <Link
                href={data.actions.primary.href}
                className="inline-flex h-10 items-center rounded-xl bg-[#2563eb] px-4 text-[14px] font-semibold text-white hover:bg-[#1d4ed8]"
              >
                Ver comentarios
              </Link>
            </div>
          </div>
        </div>

        {degradedMessage ? (
          <p className="mt-4 rounded-lg border border-[#f4d7a7] bg-[#fff9ee] px-3 py-2 text-[13px] text-[#92400e]">
            {degradedMessage}
          </p>
        ) : null}
      </article>

      <article className="rounded-2xl border border-[#cfdae9] bg-white p-5">
        <h2 className="text-[20px] font-semibold text-[#0f172a]">Comentarios</h2>
        <p className="mt-1 text-[13px] text-[#64748b]">
          {formatNumber(comments.length)} comentarios
        </p>

        <div className="mt-4 max-h-[420px] overflow-auto rounded-xl border border-[#e2e8f0]">
          <table className="min-w-full text-left text-[14px]">
            <thead className="sticky top-0 bg-[#f8fafc] text-[#475569]">
              <tr>
                <th className="px-4 py-3 font-semibold">Usuario</th>
                <th className="px-4 py-3 font-semibold">Comentario</th>
                <th className="px-4 py-3 font-semibold">Reacciones</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {comments.length ? (
                comments.map((comment) => (
                  <tr key={comment.id} className="border-t border-[#eef2f7] align-top">
                    <td className="px-4 py-3 font-medium text-[#1e293b]">{comment.username}</td>
                    <td className="px-4 py-3 text-[#334155]">{comment.text}</td>
                    <td className="px-4 py-3 text-[#334155]">{formatNumber(comment.likes)}</td>
                    <td className="px-4 py-3 text-[#64748b]">{comment.createdAt}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[#64748b]">
                    Sin comentarios para este post.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

function mapLegacyToV2(
  clientId: string,
  postId: string,
  clientName: string,
  post: Post,
): PostDetailV2Response {
  return {
    postHeader: {
      postId,
      clientId,
      clientName,
      caption: post.caption,
      publishedAt: post.publishedAt,
      mediaType: normalizeMediaType(post.imageHint),
      imageUrl: post.imageUrl ?? null,
      accountHandle: "Cuenta no disponible",
      accountPlatform: "Plataforma no disponible",
      accountStatus: "Cuenta no disponible",
    },
    performance: {
      likes: post.likes,
      commentsTotal: post.commentsCount,
      analyzedComments: 0,
      pendingComments: 0,
      analysisStatus: "pending",
    },
    sentiment: {
      label: "neutral",
      positivePct: 0,
      negativePct: 0,
      neutralPct: 0,
      topEmotion: null,
    },
    comparison: {
      periodLabelCurrent: "",
      periodLabelPrevious: "",
      likesDeltaPct: 0,
      commentsDeltaPct: 0,
      negativePctDelta: 0,
    },
    actions: {
      primary: {
        label: "Ver comentarios",
        href: commentsRoute(clientId, postId),
      },
      secondary: [],
    },
  };
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function normalizeMediaType(raw: string): string {
  const normalized = raw.trim().toUpperCase();
  if (normalized === "IMAGE") return "Imagen";
  if (normalized === "VIDEO") return "Video";
  if (normalized === "CAROUSEL_ALBUM") return "Carrusel";
  return raw.trim() ? raw : "Contenido";
}

async function loadComments(postId: string): Promise<CommentAnalysis[]> {
  try {
    const payload = await getPostCommentsAnalysis(postId);
    return payload.comments;
  } catch {
    return [];
  }
}
