"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface Props {
  data: { state: string; count: number }[];
}

const COLORS: Record<string, string> = {
  new: "#a78bfa",
  learning: "#3b82f6",
  review: "#22c55e",
  relearning: "#f59e0b",
};

const LABELS: Record<string, string> = {
  new: "New",
  learning: "Learning",
  review: "Review",
  relearning: "Relearning",
};

export function MaturityChart({ data }: Props) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) {
    return <p className="text-gray-400 text-sm text-center py-8">No cards yet</p>;
  }

  const formatted = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      name: LABELS[d.state] ?? d.state,
      value: d.count,
      color: COLORS[d.state] ?? "#9ca3af",
    }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={formatted}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={90}
          paddingAngle={2}
        >
          {formatted.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [value, "Cards"]} />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
