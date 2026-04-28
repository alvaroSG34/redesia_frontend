import Link from "next/link";
import { notFound } from "next/navigation";

import { getAccounts, getClient, getPosts } from "@/services/social-analytics";
import { type Post } from "@/types/social";
import { SyncAccountButton } from "../accounts/account-buttons";

interface ClientPostsPageProps {
  params: Promise<{ clientId: string }>;
}

function derivePostStatus(post: Post): { label: string; labelClass: string } {
  if (post.analyzedComments > 0) {
    return { label: "Analizado", labelClass: "bg-[#cceee2] text-[#0f766e]" };
  }
  if (post.commentsCount > 0) {
    return { label: "Pendiente", labelClass: "bg-[#fde7b1] text-[#b45309]" };
  }
  return { label: "Sin comentarios", labelClass: "bg-[#e9eff8] text-[#64748b]" };
}

function buildUnsplashUrl(hint: string): string {
  const query = encodeURIComponent(hint.slice(0, 50));
  return `https://source.unsplash.com/featured/800x600?${query}`;
}

export default async function ClientPostsPage({ params }: ClientPostsPageProps) {
  const { clientId } = await params;
  const [client, posts, accounts] = await Promise.all([
    getClient(clientId),
    getPosts(clientId),
    getAccounts(clientId),
  ]);

  if (!client) {
    notFound();
  }

  const connectedAccount = accounts.find((account) => account.status === "Conectado");

  // KPIs calculados desde los posts reales
  const totalPosts = posts.length;
  const analyzedPosts = posts.filter((p) => p.analyzedComments > 0).length;
  const totalComments = posts.reduce((sum, p) => sum + p.commentsCount, 0);

  return (
    <section className="mx-auto w-full max-w-[1120px] space-y-6 pb-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[48px] font-bold tracking-tight text-[#182033]">Publicaciones de Instagram</h1>
          <p className="mt-1 text-[30px] text-[#60718f]">{client.name}</p>
        </div>

        {connectedAccount ? (
          <SyncAccountButton
            clientId={clientId}
            accountId={connectedAccount.id}
            canSync
          />
        ) : (
          <Link
            href={`/clients/${clientId}/accounts`}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#c7d2e4] bg-white px-5 text-[16px] font-semibold text-[#475569] hover:bg-slate-50"
          >
            Conectar cuenta
          </Link>
        )}
      </header>

      {/* KPIs reales */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="🖼" iconClass="bg-[#e8eff9]" label="Total publicaciones" value={String(totalPosts)} />
        <StatCard icon="◔" iconClass="bg-[#ddefe4]" label="Analizadas" value={String(analyzedPosts)} />
        <StatCard
          icon="◌"
          iconClass="bg-[#f8edc7]"
          label="Comentarios disponibles"
          value={totalComments.toLocaleString("en-US")}
        />
        <StatCard
          icon="◔"
          iconClass="bg-[#ddefe4]"
          label="Pendientes de analizar"
          value={String(totalPosts - analyzedPosts)}
        />
      </section>

      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-3">
          <FilterButton label="Rango de fechas" icon="🗓" />
          <FilterButton label="Tipo de publicacion" />
          <FilterButton label="Mas recientes" icon="⇅" />
        </div>

        <div className="inline-flex items-center gap-2 rounded-lg bg-[#f0f4fa] p-1">
          <button type="button" className="rounded-md bg-white px-3 py-2 text-[14px] text-[#334155]">▦</button>
          <button type="button" className="rounded-md px-3 py-2 text-[14px] text-[#94a3b8]">☰</button>
        </div>
      </section>

      {/* Posts reales */}
      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#c7d2e4] bg-white p-16 text-center">
          <p className="text-[18px] text-[#94a3b8]">No hay publicaciones registradas para este cliente.</p>
          <p className="mt-2 text-[14px] text-[#c0cbd8]">Sincroniza la cuenta de Instagram para importar publicaciones.</p>
        </div>
      ) : (
        <section className="grid gap-4 xl:grid-cols-3">
          {posts.map((post) => {
            const { label: statusLabel, labelClass } = derivePostStatus(post);
            const imageUrl = post.imageUrl || buildUnsplashUrl(post.imageHint || post.caption);

            return (
              <article key={post.id} className="overflow-hidden rounded-2xl border border-[#d1dae7] bg-white">
                <div
                  className="h-56 w-full bg-cover bg-center bg-[#e2e8f0]"
                  style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
                  aria-hidden
                />

                <div className="space-y-4 p-4">
                  <span className={`inline-flex rounded-md px-3 py-1 text-[14px] font-semibold ${labelClass}`}>
                    {statusLabel}
                  </span>

                  <p className="line-clamp-2 text-[16px] text-[#334155]">{post.caption}</p>

                  <div className="flex items-center justify-between text-[16px] text-[#64748b]">
                    <div className="flex items-center gap-4">
                      <span>♡ {post.likes.toLocaleString("en-US")}</span>
                      <span>◌ {post.commentsCount.toLocaleString("en-US")}</span>
                    </div>
                    <span className="text-[14px]">{post.publishedAt}</span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[14px] text-[#94a3b8]">
                      {post.analyzedComments > 0
                        ? `${post.analyzedComments} analizados`
                        : "Sin análisis"}
                    </span>
                    <Link
                      href={`/clients/${clientId}/posts/${post.id}`}
                      className="inline-flex h-8 items-center rounded-lg bg-[#e8f0ff] px-4 text-[14px] font-semibold text-[#2563eb]"
                    >
                      Ver detalle
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </section>
  );
}

function StatCard({
  icon,
  iconClass,
  label,
  value,
}: {
  icon: string;
  iconClass: string;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-2xl border border-[#d1dae7] bg-white px-5 py-4">
      <div className="flex items-center gap-4">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-[16px] ${iconClass}`}>{icon}</span>
        <div>
          <p className="text-[16px] text-[#64748b]">{label}</p>
          <p className="text-[42px] font-bold text-[#182033]">{value}</p>
        </div>
      </div>
    </article>
  );
}

function FilterButton({ label, icon }: { label: string; icon?: string }) {
  return (
    <button
      type="button"
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#c7d2e4] bg-white px-4 text-[16px] text-[#475569]"
    >
      {icon ? <span aria-hidden>{icon}</span> : null}
      {label}
      <span aria-hidden>⌄</span>
    </button>
  );
}

