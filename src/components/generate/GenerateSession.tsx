"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { createCard } from "@/lib/actions/cards";
import { createDeck } from "@/lib/actions/decks";

interface GeneratedCard {
  front: string;
  back: string;
  tags?: string[];
  selected: boolean;
}

interface Props {
  decks: { id: string; name: string }[];
}

export function GenerateSession({ decks }: Props) {
  const router = useRouter();
  const { addToast } = useToast();
  const [topic, setTopic] = useState("");
  const [depth, setDepth] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [cardCount, setCardCount] = useState("");
  const [notes, setNotes] = useState("");
  const [targetDeckId, setTargetDeckId] = useState(decks[0]?.id ?? "__new__");
  const [newDeckName, setNewDeckName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [cards, setCards] = useState<GeneratedCard[]>([]);
  const [saving, setSaving] = useState(false);

  async function handleGenerate() {
    if (!topic.trim()) return;
    setGenerating(true);
    setCards([]);

    try {
      const res = await fetch("/api/agents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          depth,
          card_count: cardCount ? parseInt(cardCount) : undefined,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await res.json();
      setCards(
        (data.cards ?? []).map((c: { front: string; back: string; tags?: string[] }) => ({
          ...c,
          selected: true,
        }))
      );
    } catch (err) {
      addToast.error(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    const selected = cards.filter((c) => c.selected);
    if (selected.length === 0) return;

    setSaving(true);
    try {
      let deckId = targetDeckId;
      if (deckId === "__new__") {
        const name = newDeckName.trim() || topic.trim();
        const deck = await createDeck(name);
        deckId = deck.id;
      }

      for (const card of selected) {
        await createCard(deckId, card.front, card.back, card.tags ?? [], "ai_generated");
      }

      addToast.success(`Added ${selected.length} cards`);
      router.push(`/decks/${deckId}`);
    } catch {
      addToast.error("Failed to save cards");
    } finally {
      setSaving(false);
    }
  }

  function toggleCard(index: number) {
    setCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, selected: !c.selected } : c))
    );
  }

  function toggleAll() {
    const allSelected = cards.every((c) => c.selected);
    setCards((prev) => prev.map((c) => ({ ...c, selected: !allSelected })));
  }

  return (
    <div className="space-y-6">
      {/* Generation Form */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="e.g., Photosynthesis, JavaScript closures, WW2 causes..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Depth</label>
            <select
              value={depth}
              onChange={(e) => setDepth(e.target.value as typeof depth)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Card count (optional)</label>
            <input
              type="number"
              min="1"
              max="50"
              value={cardCount}
              onChange={(e) => setCardCount(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Auto"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Focus on X, avoid Y..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Add to deck</label>
          <select
            value={targetDeckId}
            onChange={(e) => setTargetDeckId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="__new__">Create new deck</option>
            {decks.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          {targetDeckId === "__new__" && (
            <input
              type="text"
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Deck name (defaults to topic)"
            />
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || !topic.trim()}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {generating ? "Generating..." : "Generate Cards"}
        </button>
      </div>

      {/* Generated Cards */}
      {generating && (
        <div className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Generating flashcards...</p>
        </div>
      )}

      {cards.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700 font-medium">
              {cards.filter((c) => c.selected).length} of {cards.length} cards selected
            </p>
            <button onClick={toggleAll} className="text-sm text-indigo-600 hover:text-indigo-700">
              {cards.every((c) => c.selected) ? "Deselect all" : "Select all"}
            </button>
          </div>

          <div className="space-y-2">
            {cards.map((card, i) => (
              <div
                key={i}
                onClick={() => toggleCard(i)}
                className={`rounded-lg border p-4 cursor-pointer transition-colors ${
                  card.selected ? "border-indigo-200 bg-indigo-50" : "border-gray-200 bg-white opacity-60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={card.selected}
                    onChange={() => toggleCard(i)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{card.front}</p>
                    <p className="mt-1 text-sm text-gray-500">{card.back}</p>
                    {card.tags && card.tags.length > 0 && (
                      <div className="mt-2 flex gap-1 flex-wrap">
                        {card.tags.map((tag, j) => (
                          <span key={j} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={saving || cards.filter((c) => c.selected).length === 0}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : `Add ${cards.filter((c) => c.selected).length} cards`}
          </button>
        </div>
      )}
    </div>
  );
}
