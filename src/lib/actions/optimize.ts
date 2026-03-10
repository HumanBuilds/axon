"use server";

import { createClient } from "@/lib/supabase/server";

export async function optimizeFSRSParameters(): Promise<{ error?: string; weights?: number[] }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check review count
  const { count } = await supabase
    .from("review_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (!count || count < 1000) {
    return { error: `Need at least 1,000 reviews for optimization. You have ${count ?? 0}.` };
  }

  // Fetch all review logs ordered by card and time
  const { data: logs, error: fetchError } = await supabase
    .from("review_logs")
    .select("card_id, rating, reviewed_at, elapsed_days, scheduled_days")
    .eq("user_id", user.id)
    .not("card_id", "is", null)
    .order("reviewed_at", { ascending: true });

  if (fetchError || !logs) {
    return { error: "Failed to fetch review logs" };
  }

  try {
    // Dynamic import to avoid bundling WASM in the client
    const { computeParameters, convertCsvToFsrsItems } = await import(
      "@open-spaced-repetition/binding"
    );

    // Convert review logs to the CSV format expected by the binding
    // Format: card_id, review_date, rating (1-4), ...
    const ratingMap: Record<string, number> = {
      again: 1,
      hard: 2,
      good: 3,
      easy: 4,
    };

    const csvRows: string[] = [];
    for (const log of logs) {
      const date = new Date(log.reviewed_at).toISOString().split("T")[0];
      const rating = ratingMap[log.rating] ?? 3;
      csvRows.push(`${log.card_id},${date},${rating}`);
    }

    const csvData = csvRows.join("\n");
    const items = convertCsvToFsrsItems(csvData, 4, "UTC", () => 0);

    const result = await computeParameters(items, {
      enableShortTerm: true,
      timeout: 120,
    });

    const weights = Array.from(result.w as Float64Array | number[]);

    // Save optimized weights to user profile
    await supabase
      .from("user_profiles")
      .update({
        fsrs_weights: weights,
        last_optimization: new Date().toISOString(),
      })
      .eq("id", user.id);

    return { weights };
  } catch (e) {
    // If the WASM binding isn't available, return a helpful error
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (msg.includes("Cannot find module") || msg.includes("MODULE_NOT_FOUND")) {
      return { error: "FSRS optimizer is not available. Install @open-spaced-repetition/binding to enable this feature." };
    }
    return { error: `Optimization failed: ${msg}` };
  }
}
