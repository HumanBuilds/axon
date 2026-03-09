import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Dashboard } from "@/components/layout/Dashboard";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: decks } = await supabase
    .from("decks")
    .select("*, cards(count)")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return <Dashboard decks={decks ?? []} />;
}
