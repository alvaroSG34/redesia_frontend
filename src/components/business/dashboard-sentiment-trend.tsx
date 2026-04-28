"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DashboardV2TrendPoint } from "@/types/social";

interface DashboardSentimentTrendProps {
  data: DashboardV2TrendPoint[];
}

export function DashboardSentimentTrend({ data }: DashboardSentimentTrendProps) {
  if (!data.length) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-2xl border border-dashed border-[#c8d4e5] bg-[#f8fbff] text-[15px] text-[#64748b]">
        No hay datos suficientes para mostrar tendencia.
      </div>
    );
  }

  return (
    <div className="h-[320px] w-full rounded-2xl border border-[#d4deec] bg-white p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 18, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#e6edf7" strokeDasharray="3 3" />
          <XAxis dataKey="period" stroke="#64748b" tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} stroke="#64748b" tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #d1dbe9",
              background: "#ffffff",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="positive"
            name="Positivo"
            stroke="#0f766e"
            strokeWidth={2.5}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="neutral"
            name="Neutral"
            stroke="#64748b"
            strokeWidth={2.5}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="negative"
            name="Negativo"
            stroke="#dc2626"
            strokeWidth={2.5}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
