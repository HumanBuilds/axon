"use client";

import { useState } from "react";
import { updateProfile } from "@/lib/actions/profile";
import { optimizeFSRSParameters } from "@/lib/actions/optimize";
import { useToast } from "@/components/ui/Toast";
import type { UserProfile } from "@/lib/types";

interface Props {
  profile: UserProfile;
  reviewCount: number;
}

function formatLearningSteps(steps: string[]): string {
  return steps.join(", ");
}

function validateSteps(value: string): string | null {
  const parts = value.split(",").map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    const num = parseFloat(part);
    if (isNaN(num) || num <= 0) return `"${part}" is not a valid positive number`;
  }
  if (parts.length === 0) return "At least one step is required";
  return null;
}

export function SettingsForm({ profile, reviewCount }: Props) {
  const { addToast } = useToast();
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [retention, setRetention] = useState(profile.desired_retention);
  const [maxNew, setMaxNew] = useState(profile.max_new_cards_per_day);
  const [maxReviews, setMaxReviews] = useState(profile.max_reviews_per_day);
  const [learningSteps, setLearningSteps] = useState(formatLearningSteps(profile.learning_steps));
  const [relearningSteps, setRelearningSteps] = useState(formatLearningSteps(profile.relearning_steps));
  const [saving, setSaving] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [stepsError, setStepsError] = useState<string | null>(null);
  const [reStepsError, setReStepsError] = useState<string | null>(null);

  const isDirty =
    displayName !== (profile.display_name ?? "") ||
    retention !== profile.desired_retention ||
    maxNew !== profile.max_new_cards_per_day ||
    maxReviews !== profile.max_reviews_per_day ||
    learningSteps !== formatLearningSteps(profile.learning_steps) ||
    relearningSteps !== formatLearningSteps(profile.relearning_steps);

  async function handleSave() {
    const lErr = validateSteps(learningSteps);
    const rErr = validateSteps(relearningSteps);
    if (lErr) { setStepsError(lErr); return; }
    if (rErr) { setReStepsError(rErr); return; }
    setStepsError(null);
    setReStepsError(null);

    setSaving(true);
    try {
      await updateProfile({
        display_name: displayName || null,
        desired_retention: retention,
        max_new_cards_per_day: maxNew,
        max_reviews_per_day: maxReviews,
        learning_steps: learningSteps.split(",").map((s) => s.trim()).filter(Boolean),
        relearning_steps: relearningSteps.split(",").map((s) => s.trim()).filter(Boolean),
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
    setLearningSteps(formatLearningSteps(profile.learning_steps));
    setRelearningSteps(formatLearningSteps(profile.relearning_steps));
    setStepsError(null);
    setReStepsError(null);
  }

  async function handleOptimize() {
    setOptimizing(true);
    try {
      const result = await optimizeFSRSParameters();
      if (result.error) {
        addToast.error(result.error);
      } else {
        addToast.success("FSRS parameters optimized successfully");
      }
    } catch {
      addToast.error("Optimization failed");
    } finally {
      setOptimizing(false);
    }
  }

  const canOptimize = reviewCount >= 1000;

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

          <div className="max-w-sm">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Learning steps (minutes, comma-separated)
            </label>
            <input
              type="text"
              value={learningSteps}
              onChange={(e) => { setLearningSteps(e.target.value); setStepsError(null); }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="1, 10"
            />
            {stepsError && <p className="mt-1 text-xs text-red-600">{stepsError}</p>}
            <p className="mt-1 text-xs text-gray-500">e.g. 1, 10 = 1min then 10min</p>
          </div>

          <div className="max-w-sm">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relearning steps (minutes, comma-separated)
            </label>
            <input
              type="text"
              value={relearningSteps}
              onChange={(e) => { setRelearningSteps(e.target.value); setReStepsError(null); }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="10"
            />
            {reStepsError && <p className="mt-1 text-xs text-red-600">{reStepsError}</p>}
            <p className="mt-1 text-xs text-gray-500">e.g. 10 = 10min relearning step</p>
          </div>
        </div>
      </section>

      {/* FSRS Optimization */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">FSRS Optimization</h2>
        <p className="text-sm text-gray-600 mb-3">
          Personalize your scheduling parameters based on your review history.
          Requires at least 1,000 reviews.
        </p>
        <p className="text-sm text-gray-500 mb-4">
          You have <span className="font-medium text-gray-700">{reviewCount.toLocaleString()}</span> reviews.
          {profile.last_optimization && (
            <> Last optimized: {new Date(profile.last_optimization).toLocaleDateString()}</>
          )}
        </p>
        <button
          onClick={handleOptimize}
          disabled={!canOptimize || optimizing}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {optimizing ? "Optimizing..." : "Optimize Parameters"}
        </button>
        {!canOptimize && (
          <p className="mt-2 text-xs text-gray-400">
            Need {(1000 - reviewCount).toLocaleString()} more reviews to enable optimization
          </p>
        )}
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
