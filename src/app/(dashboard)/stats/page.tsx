import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getReviewCountsByDay,
  getRetentionRate,
  getCardMaturityDistribution,
  getReviewForecast,
  getStudyHeatmap,
  getStudyStreak,
} from "@/lib/actions/statistics";
import { StatsDashboard } from "@/components/stats/StatsDashboard";

export default async function StatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [reviewCounts, retention, maturity, forecast, heatmap, streak] =
    await Promise.all([
      getReviewCountsByDay(30),
      getRetentionRate(30),
      getCardMaturityDistribution(),
      getReviewForecast(14),
      getStudyHeatmap(),
      getStudyStreak(),
    ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600">&larr;</Link>
          <h1 className="text-xl font-bold text-gray-900">Statistics</h1>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <StatsDashboard
          reviewCounts={reviewCounts}
          retention={retention}
          maturity={maturity}
          forecast={forecast}
          heatmap={heatmap}
          streak={streak}
        />
      </main>
    </div>
  );
}
