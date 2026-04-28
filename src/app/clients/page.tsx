import { ClientsScreen } from "@/components/screens/clients-screen";
import { getClientDashboardSummary, getClients } from "@/services/social-analytics";

export default async function ClientsPage() {
  const clients = await getClients({ page: 1, pageSize: 100 });
  const summaries = await Promise.all(
    clients.items.map((client) => getClientDashboardSummary(client.id)),
  );

  const items = clients.items.map((client, index) => {
    const summary = summaries[index];
    if (!summary) {
      return client;
    }

    const postsRaw = summary.kpis.find((kpi) => kpi.id === "posts")?.value ?? "0";
    const commentsRaw = summary.kpis.find((kpi) => kpi.id === "comments")?.value ?? "0";

    return {
      ...client,
      postCount: toNumber(postsRaw),
      commentCount: toNumber(commentsRaw),
    };
  });

  return (
    <div className="py-2">
      <ClientsScreen initialClients={items} />
    </div>
  );
}

function toNumber(value: string): number {
  const normalized = value.replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
