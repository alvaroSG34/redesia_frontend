import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { clientRoute } from "@/lib/routes";
import { type Client } from "@/types/social";

interface ClientListProps {
  clients: Client[];
}

export function ClientList({ clients }: ClientListProps) {
  if (!clients.length) {
    return <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-sm text-slate-500">No encontramos clientes con ese filtro.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {clients.map((client) => {
        const badgeVariant =
          client.status === "Activo" ? "success" : client.status === "Pendiente" ? "warning" : "neutral";

        return (
          <Card key={client.id} className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar initials={client.shortName} color={client.avatarColor} />
                <div>
                  <p className="font-semibold text-slate-900">{client.name}</p>
                  <p className="text-sm text-slate-500">{client.industry}</p>
                </div>
              </div>
              <Badge variant={badgeVariant}>{client.status}</Badge>
            </div>
            <p className="text-sm text-slate-600">{client.description}</p>
            <div className="mt-auto flex items-center justify-between text-sm">
              <span className="text-slate-500">{client.connected ? "Conectado" : "Sin conexión"}</span>
              <Link
                href={clientRoute(client.id)}
                className="rounded-xl bg-slate-900 px-3 py-2 font-semibold text-white transition hover:bg-slate-700"
              >
                Ver cliente
              </Link>
            </div>
          </Card>
        );
      })}
    </div>
  );
}


