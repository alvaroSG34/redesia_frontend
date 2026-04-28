import { cn } from "@/lib/cn";

interface TabItem {
  value: string;
  label: string;
  count?: number;
}

interface FilterTabsProps {
  items: TabItem[];
  active: string;
  onChange: (value: string) => void;
}

export function FilterTabs({ items, active, onChange }: FilterTabsProps) {
  return (
    <div className="inline-flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-1" role="tablist" aria-label="Filtros">
      {items.map((item) => {
        const selected = item.value === active;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item.value)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold transition",
              selected ? "bg-white text-slate-900 shadow" : "text-slate-600 hover:text-slate-900",
            )}
          >
            {item.label}
            {typeof item.count === "number" ? <span className="ml-2 text-xs text-slate-500">{item.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}


