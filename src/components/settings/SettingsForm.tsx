"use client";

import { useState } from "react";
import { updateProfile } from "@/lib/actions/profile";
import { useToast } from "@/components/ui/Toast";
import type { UserProfile } from "@/lib/types";

interface Props {
  profile: UserProfile;
}

export function SettingsForm({ profile }: Props) {
  const { addToast } = useToast();
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [retention, setRetention] = useState(profile.desired_retention);
  const [maxNew, setMaxNew] = useState(profile.max_new_cards_per_day);
  const [maxReviews, setMaxReviews] = useState(profile.max_reviews_per_day);
  const [saving, setSaving] = useState(false);

  const isDirty =
    displayName !== (profile.display_name ?? "") ||
    retention !== profile.desired_retention ||
    maxNew !== profile.max_new_cards_per_day ||
    maxReviews !== profile.max_reviews_per_day;

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({
        display_name: displayName || null,
        desired_retention: retention,
        max_new_cards_per_day: maxNew,
        max_reviews_per_day: maxReviews,
      });
      addToast.success("Settings saved");
    } catch {
      addToast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setDisplayName(profile.display_name ?? "");
    setRetention(profile.desired_retention);
    setMaxNew(profile.max_new_cards_per_day);
    setMaxReviews(profile.max_reviews_per_day);
  }

  return (
    <div className="space-y-8">
      {/* Profile */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Display name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Your name"
          />
        </div>
      </section>

      {/* Scheduling */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Scheduling</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Desired retention: {Math.round(retention * 100)}%
            </label>
            <input
              type="range"
              min="0.7"
              max="0.99"
              step="0.01"
              value={retention}
              onChange={(e) => setRetention(parseFloat(e.target.value))}
              className="w-full max-w-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              {retention > 0.97
                ? "Very high retention produces short intervals."
                : retention < 0.8
                  ? "Low retention produces long intervals."
                  : "Recommended range: 85-95%"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max new cards/day
              </label>
              <input
                type="number"
                min="0"
                value={maxNew}
                onChange={(e) => setMaxNew(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max reviews/day
              </label>
              <input
                type="number"
                min="0"
                value={maxReviews}
                onChange={(e) => setMaxReviews(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Features</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Interleaving</p>
              <p className="text-xs text-gray-500">Order cards by semantic similarity</p>
            </div>
            <span className="text-xs text-gray-400">Coming soon</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">AI Agent</p>
              <p className="text-xs text-gray-500">Get card quality suggestions</p>
            </div>
            <span className="text-xs text-gray-400">Coming soon</span>
          </div>
        </div>
      </section>

      {/* Save/Discard */}
      {isDirty && (
        <div className="flex gap-3 sticky bottom-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
          <button
            onClick={handleDiscard}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Discard
          </button>
        </div>
      )}
    </div>
  );
}
