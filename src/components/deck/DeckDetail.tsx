"use client";

import { useState } from "react";
import Link from "next/link";
import { createCard, deleteCard } from "@/lib/actions/cards";
import { deleteDeck } from "@/lib/actions/decks";
import { useRouter } from "next/navigation";
import type { Card, Deck } from "@/lib/types";

interface Props {
  deck: Deck;
  cards: Card[];
  dueCount: number;
}

export function DeckDetail({ deck, cards, dueCount }: Props) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAddCard() {
    if (!front.trim() || !back.trim()) return;
    setSaving(true);
    await createCard(deck.id, front.trim(), back.trim());
    setFront("");
    setBack("");
    setShowAdd(false);
    setSaving(false);
    router.refresh();
  }

  async function handleDeleteDeck() {
    if (!confirm("Delete this deck and all its cards?")) return;
    await deleteDeck(deck.id);
    router.push("/");
  }

  async function handleDeleteCard(cardId: string) {
    if (!confirm("Delete this card?")) return;
    await deleteCard(cardId);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-400 hover:text-gray-600">
              &larr;
            </Link>
            <h1 className="text-xl font-bold text-gray-900">{deck.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            {dueCount > 0 && (
              <Link
                href={`/decks/${deck.id}/study`}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white font-medium hover:bg-indigo-700"
              >
                Study ({dueCount} due)
              </Link>
            )}
            <button
              onClick={handleDeleteDeck}
              className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">{cards.length} cards</p>
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white font-medium hover:bg-indigo-700"
          >
            Add Card
          </button>
        </div>

        {showAdd && (
          <div className="mb-6 space-y-3 rounded-lg border border-gray-200 bg-white p-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Front</label>
              <textarea
                autoFocus
                value={front}
                onChange={(e) => setFront(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Question or prompt (supports markdown)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Back</label>
              <textarea
                value={back}
                onChange={(e) => setBack(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Answer (supports markdown)"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddCard}
                disabled={saving || !front.trim() || !back.trim()}
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                Save Card
              </button>
              <button
                onClick={() => { setShowAdd(false); setFront(""); setBack(""); }}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {cards.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p>No cards yet. Add one to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cards.map((card) => (
              <div
                key={card.id}
                className="rounded-lg border border-gray-200 bg-white p-4 flex items-start justify-between"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {card.front}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 truncate">
                    {card.back}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteCard(card.id)}
                  className="ml-4 text-xs text-gray-400 hover:text-red-500"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
