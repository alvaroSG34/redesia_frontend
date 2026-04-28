import { Card } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  delta: string;
  context: string;
}

export function StatCard({ label, value, delta, context }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-gradient-to-br from-[var(--color-accent)]/30 to-transparent" />
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
      <div className="mt-2 flex items-center gap-2 text-xs">
        <span className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">{delta}</span>
        <span className="text-slate-500">{context}</span>
      </div>
    </Card>
  );
}


