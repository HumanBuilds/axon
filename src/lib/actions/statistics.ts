"use server";

import { createClient } from "@/lib/supabase/server";

export async function getReviewCountsByDay(days: number = 30) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data } = await supabase
    .from("review_logs")
    .select("reviewed_at, rating")
    .eq("user_id", user.id)
    .gte("reviewed_at", since.toISOString())
    .order("reviewed_at", { ascending: true });

  // Group by date
  const byDay: Record<string, { total: number; again: number; hard: number; good: number; easy: number }> = {};
  for (const log of data ?? []) {
    const date = new Date(log.reviewed_at).toISOString().split("T")[0];
    if (!byDay[date]) byDay[date] = { total: 0, again: 0, hard: 0, good: 0, easy: 0 };
    byDay[date].total++;
    byDay[date][log.rating as "again" | "hard" | "good" | "easy"]++;
  }

  // Fill in missing days
  const result: { date: string; total: number; again: number; hard: number; good: number; easy: number }[] = [];
  const current = new Date(since);
  const today = new Date();
  while (current <= today) {
    const dateStr = current.toISOString().split("T")[0];
    result.push({
      date: dateStr,
      ...(byDay[dateStr] ?? { total: 0, again: 0, hard: 0, good: 0, easy: 0 }),
    });
    current.setDate(current.getDate() + 1);
  }

  return result;
}

export async function getRetentionRate(days: number = 30) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data } = await supabase
    .from("review_logs")
    .select("reviewed_at, rating")
    .eq("user_id", user.id)
    .gte("reviewed_at", since.toISOString());

  const byDay: Record<string, { total: number; passed: number }> = {};
  for (const log of data ?? []) {
    const date = new Date(log.reviewed_at).toISOString().split("T")[0];
    if (!byDay[date]) byDay[date] = { total: 0, passed: 0 };
    byDay[date].total++;
    if (log.rating === "good" || log.rating === "easy") byDay[date].passed++;
  }

  return Object.entries(byDay)
    .map(([date, { total, passed }]) => ({
      date,
      retention: total > 0 ? passed / total : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getCardMaturityDistribution() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data } = await supabase
    .from("card_states")
    .select("state, cards!inner(archived_at)")
    .eq("user_id", user.id)
    .is("cards.archived_at", null);

  const counts: Record<string, number> = { new: 0, learning: 0, review: 0, relearning: 0 };
  for (const row of data ?? []) {
    counts[row.state] = (counts[row.state] ?? 0) + 1;
  }

  return Object.entries(counts).map(([state, count]) => ({ state, count }));
}

export async function getReviewForecast(days: number = 14) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const end = new Date();
  end.setDate(end.getDate() + days);

  const { data } = await supabase
    .from("card_states")
    .select("due, cards!inner(archived_at)")
    .eq("user_id", user.id)
    .is("cards.archived_at", null)
    .lte("due", end.toISOString());

  const byDay: Record<string, number> = {};
  for (const row of data ?? []) {
    const date = new Date(row.due).toISOString().split("T")[0];
    byDay[date] = (byDay[date] ?? 0) + 1;
  }

  const result: { date: string; count: number }[] = [];
  const current = new Date();
  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    result.push({ date: dateStr, count: byDay[dateStr] ?? 0 });
    current.setDate(current.getDate() + 1);
  }

  return result;
}

export async function getStudyHeatmap() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const since = new Date();
  since.setDate(since.getDate() - 365);

  const { data } = await supabase
    .from("review_logs")
    .select("reviewed_at")
    .eq("user_id", user.id)
    .gte("reviewed_at", since.toISOString());

  const byDay: Record<string, number> = {};
  for (const log of data ?? []) {
    const date = new Date(log.reviewed_at).toISOString().split("T")[0];
    byDay[date] = (byDay[date] ?? 0) + 1;
  }

  return Object.entries(byDay).map(([date, count]) => ({ date, count }));
}

export async function getStudyStreak(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data } = await supabase
    .from("review_logs")
    .select("reviewed_at")
    .eq("user_id", user.id)
    .order("reviewed_at", { ascending: false });

  if (!data || data.length === 0) return 0;

  const studyDays = new Set<string>();
  for (const log of data) {
    studyDays.add(new Date(log.reviewed_at).toISOString().split("T")[0]);
  }

  const sortedDays = Array.from(studyDays).sort().reverse();
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  // Streak must include today or yesterday
  if (sortedDays[0] !== today && sortedDays[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1]);
    const curr = new Date(sortedDays[i]);
    const diffDays = (prev.getTime() - curr.getTime()) / 86400000;
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
