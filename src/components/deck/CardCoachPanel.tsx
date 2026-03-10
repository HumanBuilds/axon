"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

interface CoachResult {
  suggestions: string;
  revised_front?: string;
  revised_back?: string;
  should_split?: boolean;
}

interface Props {
  front: string;
  back: string;
  onApply: (front: string, back: string) => void;
  onDismiss: () => void;
}

export function CardCoachPanel({ front, back, onApply, onDismiss }: Props) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CoachResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function getSuggestions() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agents/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ front, back }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to get suggestions");
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to get suggestions";
      setError(msg);
      addToast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!result && !loading) {
    return (
      <div className="mt-3 p-3 bg-indigo-50 rounded-md">
        <button
          onClick={getSuggestions}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Get AI suggestions
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-3 p-3 bg-indigo-50 rounded-md">
        <div className="flex items-center gap-2 text-sm text-indigo-600">
          <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
          Analyzing card...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-3 p-3 bg-red-50 rounded-md text-sm text-red-600">
        {error}
        <button onClick={onDismiss} className="ml-2 underline">Dismiss</button>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="mt-3 p-4 bg-indigo-50 rounded-md space-y-3">
      <div className="text-sm text-gray-700 whitespace-pre-wrap">{result.suggestions}</div>
      {(result.revised_front || result.revised_back) && (
        <div className="flex gap-2">
          <button
            onClick={() => onApply(result.revised_front || front, result.revised_back || back)}
            className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700"
          >
            Apply suggestion
          </button>
          <button
            onClick={onDismiss}
            className="text-sm text-gray-600 px-3 py-1.5 rounded-md hover:bg-gray-100"
          >
            Dismiss
          </button>
        </div>
      )}
      {!result.revised_front && !result.revised_back && (
        <button
          onClick={onDismiss}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
