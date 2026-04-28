import Link from "next/link";

import { Card } from "@/components/ui/card";
import { commentsRoute, postRoute } from "@/lib/routes";
import { type Post } from "@/types/social";

interface PostGridProps {
  posts: Post[];
  clientId: string;
}

export function PostGrid({ posts, clientId }: PostGridProps) {
  if (!posts.length) {
    return <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-sm text-slate-500">Este cliente todavía no tiene publicaciones sincronizadas.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {posts.map((post) => (
        <Card key={post.id} className="space-y-4">
          <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-amber-50 via-white to-teal-50 p-4 text-sm text-slate-600">
            {post.imageHint}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-800">{post.caption}</p>
            <p className="text-xs text-slate-500">Publicado: {post.publishedAt}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-600">
            <div className="rounded-xl bg-slate-100 p-2">
              <p className="font-bold text-slate-900">{post.likes}</p>
              <p>Likes</p>
            </div>
            <div className="rounded-xl bg-slate-100 p-2">
              <p className="font-bold text-slate-900">{post.commentsCount}</p>
              <p>Comentarios</p>
            </div>
            <div className="rounded-xl bg-slate-100 p-2">
              <p className="font-bold text-slate-900">{post.analyzedComments}</p>
              <p>Analizados</p>
            </div>
          </div>
          <div className="flex gap-2 text-sm">
            <Link
              href={postRoute(clientId, post.id)}
              className="rounded-xl border border-slate-300 px-3 py-2 font-semibold text-slate-700 hover:border-slate-400"
            >
              Ver detalle
            </Link>
            <Link
              href={commentsRoute(clientId, post.id)}
              className="rounded-xl bg-slate-900 px-3 py-2 font-semibold text-white hover:bg-slate-700"
            >
              Comentarios
            </Link>
          </div>
        </Card>
      ))}
    </div>
  );
}


