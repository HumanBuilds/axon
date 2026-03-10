"use client";

import { useState } from "react";
import Link from "next/link";
import { createCard, deleteCard, updateCard } from "@/lib/actions/cards";
import { deleteDeck } from "@/lib/actions/decks";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Edit2, Trash2, Plus, Download } from "react-feather";
import type { Card, Deck } from "@/lib/types";

interface Props {
  deck: Deck;
  cards: Card[];
  dueCount: number;
}

export function DeckDetail({ deck, cards, dueCount }: Props) {
  const router = useRouter();
  const { addToast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  async function handleAddCard() {
    if (!front.trim() || !back.trim()) return;
    setSaving(true);
    try {
      await createCard(deck.id, front.trim(), back.trim());
      setFront("");
      setBack("");
      setShowAdd(false);
      addToast.success("Card created");
      router.refresh();
    } catch {
      addToast.error("Failed to create card");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteDeck() {
    if (!confirm("Delete this deck and all its cards?")) return;
    try {
      await deleteDeck(deck.id);
      addToast.success("Deck deleted");
      router.push("/");
    } catch {
      addToast.error("Failed to delete deck");
    }
  }

  async function handleDeleteCard(cardId: string) {
    if (!confirm("Archive this card?")) return;
    try {
      await deleteCard(cardId);
      addToast.success("Card archived");
      router.refresh();
    } catch {
      addToast.error("Failed to archive card");
    }
  }

  function startEditing(card: Card) {
    setEditingCardId(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
  }

  function cancelEditing() {
    setEditingCardId(null);
    setEditFront("");
    setEditBack("");
  }

  async function handleSaveEdit(card: Card) {
    if (!editFront.trim() || !editBack.trim()) return;
    setEditSaving(true);
    try {
      await updateCard(card.id, editFront.trim(), editBack.trim());
      setEditingCardId(null);
      addToast.success("Card updated");
      router.refresh();
    } catch {
      addToast.error("Failed to update card");
    } finally {
      setEditSaving(false);
    }
  }

  const isEditDirty = (card: Card) =>
    editFront.trim() !== card.front || editBack.trim() !== card.back;

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
            <Link
              href={`/decks/${deck.id}/export`}
              className="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              title="Export"
            >
              <Download size={16} />
            </Link>
            <button
              onClick={handleDeleteDeck}
              className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">{cards.length} cards</p>
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white font-medium hover:bg-indigo-700 flex items-center gap-1"
          >
            <Plus size={16} /> Add Card
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
                placeholder="Question or prompt"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Back</label>
              <textarea
                value={back}
                onChange={(e) => setBack(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Answer"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddCard}
                disabled={saving || !front.trim() || !back.trim()}
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Card"}
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
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                {editingCardId === card.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Front</label>
                      <textarea
                        autoFocus
                        value={editFront}
                        onChange={(e) => setEditFront(e.target.value)}
                        rows={3}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        onKeyDown={(e) => {
                          if (e.key === "Escape") cancelEditing();
                          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSaveEdit(card);
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Back</label>
                      <textarea
                        value={editBack}
                        onChange={(e) => setEditBack(e.target.value)}
                        rows={3}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        onKeyDown={(e) => {
                          if (e.key === "Escape") cancelEditing();
                          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSaveEdit(card);
                        }}
                      />
                    </div>
                    {isEditDirty(card) && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(card)}
                          disabled={editSaving || !editFront.trim() || !editBack.trim()}
                          className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {editSaving ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Discard
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {card.front}
                      </p>
                      <p className="mt-1 text-sm text-gray-500 truncate">
                        {card.back}
                      </p>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <button
                        onClick={() => startEditing(card)}
                        className="text-gray-400 hover:text-indigo-500"
                        title="Edit card"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="text-gray-400 hover:text-red-500"
                        title="Archive card"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
