import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/actions/profile";
import { SettingsForm } from "@/components/settings/SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600">&larr;</Link>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <SettingsForm profile={profile} />
      </main>
    </div>
  );
}
