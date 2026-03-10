"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/lib/types";

export async function getProfile(): Promise<UserProfile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    // Fallback: create profile with defaults if missing (e.g., existing users)
    const { data: newProfile, error: insertError } = await supabase
      .from("user_profiles")
      .upsert({ id: user.id })
      .select()
      .single();

    if (insertError || !newProfile) throw insertError ?? new Error("Failed to create profile");
    return newProfile as UserProfile;
  }

  return data as UserProfile;
}

export async function updateProfile(
  updates: Partial<
    Pick<
      UserProfile,
      | "display_name"
      | "desired_retention"
      | "max_new_cards_per_day"
      | "max_reviews_per_day"
      | "learning_steps"
      | "relearning_steps"
      | "interleaving_enabled"
      | "agent_enabled"
    >
  >
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Validate retention range
  if (
    updates.desired_retention !== undefined &&
    (updates.desired_retention < 0.7 || updates.desired_retention > 0.99)
  ) {
    throw new Error("Desired retention must be between 0.7 and 0.99");
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/settings");
  return data as UserProfile;
}
