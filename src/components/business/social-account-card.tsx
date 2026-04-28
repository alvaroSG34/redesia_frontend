import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { type SocialAccount } from "@/types/social";

interface SocialAccountCardProps {
  account: SocialAccount;
}

export function SocialAccountCard({ account }: SocialAccountCardProps) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-900">{account.platform}</p>
          <p className="text-sm text-slate-500">{account.handle}</p>
        </div>
        <Badge variant={account.status === "Conectado" ? "success" : "warning"}>{account.status}</Badge>
      </div>
      <dl className="space-y-2 text-sm text-slate-600">
        <div className="flex items-center justify-between gap-4">
          <dt className="font-medium text-slate-500">IG Business ID</dt>
          <dd>{account.igBusinessId}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="font-medium text-slate-500">Página Facebook</dt>
          <dd>{account.facebookPage}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="font-medium text-slate-500">Última sincronización</dt>
          <dd>{account.lastSync}</dd>
        </div>
      </dl>
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-500">Scopes</p>
        <div className="flex flex-wrap gap-2">
          {account.scopes.length ? (
            account.scopes.map((scope) => (
              <span key={scope} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {scope}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-400">Sin scopes configurados.</span>
          )}
        </div>
      </div>
    </Card>
  );
}


