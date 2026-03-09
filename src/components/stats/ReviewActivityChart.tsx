"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Props {
  data: { date: string; total: number; again: number; hard: number; good: number; easy: number }[];
}

export function ReviewActivityChart({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-8">No review data yet</p>;
  }

  const formatted = data.map((d) => ({
    ...d,
    date: d.date.slice(5), // MM-DD
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={formatted} barCategoryGap="20%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="easy" stackId="a" fill="#22c55e" name="Easy" />
        <Bar dataKey="good" stackId="a" fill="#3b82f6" name="Good" />
        <Bar dataKey="hard" stackId="a" fill="#f59e0b" name="Hard" />
        <Bar dataKey="again" stackId="a" fill="#ef4444" name="Again" />
      </BarChart>
    </ResponsiveContainer>
  );
}
