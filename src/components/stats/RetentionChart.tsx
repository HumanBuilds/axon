"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: { date: string; retention: number }[];
}

export function RetentionChart({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-8">No review data yet</p>;
  }

  const formatted = data.map((d) => ({
    date: d.date.slice(5),
    retention: Math.round(d.retention * 1000) / 10, // percentage with 1 decimal
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11 }}
          tickFormatter={(v: number) => `${v}%`}
        />
        <Tooltip formatter={(value) => [`${value}%`, "Retention"]} />
        <Line
          type="monotone"
          dataKey="retention"
          stroke="#22c55e"
          strokeWidth={2}
          dot={{ r: 2 }}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
