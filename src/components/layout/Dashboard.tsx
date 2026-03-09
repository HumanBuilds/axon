"use client";

import { useState } from "react";
import Link from "next/link";
import { createDeck } from "@/lib/actions/decks";
import { logout } from "@/lib/actions/auth";
import { useToast } from "@/components/ui/Toast";
import { Settings, Plus, BarChart2, Upload, Zap } from "react-feather";

interface DeckWithCount {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  cards: { count: number }[];
  dueCount?: number;
}

export function Dashboard({
  decks,
  dueCounts,
}: {
  decks: DeckWithCount[];
  dueCounts?: Record<string, number>;
}) {
  const { addToast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (!newDeckName.trim()) return;
    setCreating(true);
    try {
      await createDeck(newDeckName.trim());
      setNewDeckName("");
      setShowCreate(false);
      addToast.success("Deck created");
    } catch {
      addToast.error("Failed to create deck");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Axon</h1>
          <div className="flex items-center gap-3">
            <Link href="/stats" className="text-gray-400 hover:text-gray-600" title="Statistics">
              <BarChart2 size={20} />
            </Link>
            <Link href="/generate" className="text-gray-400 hover:text-gray-600" title="Generate with AI">
              <Zap size={20} />
            </Link>
            <Link href="/import" className="text-gray-400 hover:text-gray-600" title="Import">
              <Upload size={20} />
            </Link>
            <Link href="/settings" className="text-gray-400 hover:text-gray-600" title="Settings">
              <Settings size={20} />
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Your Decks</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white font-medium hover:bg-indigo-700 flex items-center gap-1"
          >
            <Plus size={16} /> New Deck
          </button>
        </div>

        {showCreate && (
          <div className="mb-6 flex gap-2">
            <input
              autoFocus
              value={newDeckName}
              onChange={(e) => setNewDeckName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Deck name"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newDeckName.trim()}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create"}
            </button>
            <button
              onClick={() => { setShowCreate(false); setNewDeckName(""); }}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        )}

        {decks.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p>No decks yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map((deck) => {
              const due = dueCounts?.[deck.id] ?? 0;
              return (
                <Link
                  key={deck.id}
                  href={`/decks/${deck.id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-gray-900">{deck.name}</h3>
                  {deck.description && (
                    <p className="mt-1 text-sm text-gray-500">{deck.description}</p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      {deck.cards?.[0]?.count ?? 0} cards
                    </p>
                    {due > 0 && (
                      <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {due} due
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
