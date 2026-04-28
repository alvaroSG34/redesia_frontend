import { cn } from "@/lib/cn";

interface ConfidencePillProps {
  value: number | null;
}

export function ConfidencePill({ value }: ConfidencePillProps) {
  if (value === null) {
    return <span className="text-xs font-semibold text-slate-400">—</span>;
  }

  const percent = Math.round(value * 100);
  const tone = percent >= 90 ? "text-emerald-700 bg-emerald-100" : percent >= 75 ? "text-amber-700 bg-amber-100" : "text-rose-700 bg-rose-100";

  return <span className={cn("rounded-full px-2 py-1 text-xs font-semibold", tone)}>{percent}%</span>;
}


