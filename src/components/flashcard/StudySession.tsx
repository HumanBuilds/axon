"use client";

import { useState } from "react";
import Link from "next/link";
import type { Rating } from "@/lib/types";

interface StudyCard {
  id: string;
  front: string;
  back: string;
  state: unknown;
}

interface Props {
  deckId: string;
  deckName: string;
  cards: StudyCard[];
}

export function StudySession({ deckId, deckName, cards }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const card = cards[currentIndex];
  const isComplete = currentIndex >= cards.length;

  async function handleRate(rating: Rating) {
    if (!card) return;
    setSubmitting(true);

    await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ card_id: card.id, rating }),
    });

    setRevealed(false);
    setCurrentIndex((i) => i + 1);
    setSubmitting(false);
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">All caught up!</h2>
          <p className="mt-2 text-gray-500">No cards due for review.</p>
          <Link
            href={`/decks/${deckId}`}
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-500"
          >
            Back to deck
          </Link>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Session complete!</h2>
          <p className="mt-2 text-gray-500">
            You reviewed {cards.length} card{cards.length !== 1 ? "s" : ""}.
          </p>
          <Link
            href={`/decks/${deckId}`}
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-500"
          >
            Back to deck
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href={`/decks/${deckId}`}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            &larr; {deckName}
          </Link>
          <span className="text-sm text-gray-400">
            {currentIndex + 1} / {cards.length}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-1 bg-indigo-600 transition-all duration-300"
            style={{ width: `${((currentIndex) / cards.length) * 100}%` }}
          />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-8 min-h-[300px] flex flex-col justify-center">
            <div className="text-center">
              <p className="text-lg text-gray-900 whitespace-pre-wrap">{card.front}</p>
            </div>

            {revealed && (
              <div className="mt-8 pt-8 border-t border-gray-100 text-center">
                <p className="text-lg text-gray-700 whitespace-pre-wrap">{card.back}</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-center">
            {!revealed ? (
              <button
                onClick={() => setRevealed(true)}
                className="rounded-md bg-indigo-600 px-8 py-3 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Show Answer
              </button>
            ) : (
              <div className="flex gap-3">
                {(
                  [
                    { rating: "again" as Rating, label: "Again", color: "bg-red-500 hover:bg-red-600" },
                    { rating: "hard" as Rating, label: "Hard", color: "bg-orange-500 hover:bg-orange-600" },
                    { rating: "good" as Rating, label: "Good", color: "bg-green-500 hover:bg-green-600" },
                    { rating: "easy" as Rating, label: "Easy", color: "bg-blue-500 hover:bg-blue-600" },
                  ] as const
                ).map(({ rating, label, color }) => (
                  <button
                    key={rating}
                    onClick={() => handleRate(rating)}
                    disabled={submitting}
                    className={`rounded-md px-6 py-3 text-white font-medium ${color} disabled:opacity-50`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
