import { type ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface TableColumn {
  key: string;
  label: string;
  className?: string;
}

interface DataTableProps {
  columns: TableColumn[];
  children: ReactNode;
  className?: string;
}

export function DataTable({ columns, children, className }: DataTableProps) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white", className)}>
      <table className="min-w-full border-collapse">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.08em] text-slate-500",
                  column.className,
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}


