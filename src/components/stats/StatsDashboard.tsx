"use client";

import { Activity, TrendingUp, Calendar, Zap } from "react-feather";
import { ReviewActivityChart } from "./ReviewActivityChart";
import { RetentionChart } from "./RetentionChart";
import { MaturityChart } from "./MaturityChart";
import { ForecastChart } from "./ForecastChart";
import { StudyHeatmap } from "./StudyHeatmap";

interface StatsDashboardProps {
  reviewCounts: { date: string; total: number; again: number; hard: number; good: number; easy: number }[];
  retention: { date: string; retention: number }[];
  maturity: { state: string; count: number }[];
  forecast: { date: string; count: number }[];
  heatmap: { date: string; count: number }[];
  streak: number;
}

export function StatsDashboard({
  reviewCounts,
  retention,
  maturity,
  forecast,
  heatmap,
  streak,
}: StatsDashboardProps) {
  const totalReviews = reviewCounts.reduce((sum, d) => sum + d.total, 0);
  const avgRetention =
    retention.length > 0
      ? retention.reduce((sum, d) => sum + d.retention, 0) / retention.length
      : 0;
  const totalCards = maturity.reduce((sum, d) => sum + d.count, 0);
  const dueToday = forecast.length > 0 ? forecast[0].count : 0;

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Activity size={20} />}
          label="Reviews (30d)"
          value={totalReviews.toLocaleString()}
          color="text-blue-600 bg-blue-50"
        />
        <SummaryCard
          icon={<TrendingUp size={20} />}
          label="Avg Retention"
          value={`${(avgRetention * 100).toFixed(1)}%`}
          color="text-green-600 bg-green-50"
        />
        <SummaryCard
          icon={<Zap size={20} />}
          label="Study Streak"
          value={`${streak} day${streak !== 1 ? "s" : ""}`}
          color="text-amber-600 bg-amber-50"
        />
        <SummaryCard
          icon={<Calendar size={20} />}
          label="Due Today"
          value={dueToday.toLocaleString()}
          color="text-purple-600 bg-purple-50"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Review Activity (30 days)">
          <ReviewActivityChart data={reviewCounts} />
        </ChartCard>
        <ChartCard title="Retention Rate (30 days)">
          <RetentionChart data={retention} />
        </ChartCard>
        <ChartCard title="Card Maturity">
          <MaturityChart data={maturity} />
        </ChartCard>
        <ChartCard title="Review Forecast (14 days)">
          <ForecastChart data={forecast} />
        </ChartCard>
      </div>

      {/* Heatmap full width */}
      <ChartCard title="Study Activity (Past Year)">
        <StudyHeatmap data={heatmap} />
      </ChartCard>

      {/* Total cards footer */}
      <p className="text-sm text-gray-500 text-center">
        {totalCards} total active cards
      </p>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`p-1.5 rounded-md ${color}`}>{icon}</span>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-sm font-medium text-gray-700 mb-4">{title}</h3>
      {children}
    </div>
  );
}
