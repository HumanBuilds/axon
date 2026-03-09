"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { searchCards, bulkDeleteCards, bulkTagCards, bulkMoveCards } from "@/lib/actions/cards";
import { TagInput } from "@/components/ui/TagInput";
import { Search, Trash2, Tag, ArrowRight } from "react-feather";
import type { CardFSRSState, Deck } from "@/lib/types";

interface BrowserCard {
  id: string;
  front: string;
  back: string;
  tags: string[];
  deck_id: string;
  created_at: string;
  card_states: { state: string; due: string }[] | null;
  decks: { name: string } | null;
}

interface Props {
  initialCards: BrowserCard[];
  initialTotal: number;
  decks: Deck[];
  allTags: string[];
}

export function CardBrowser({ initialCards, initialTotal, decks, allTags }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useToast();

  const [cards, setCards] = useState<BrowserCard[]>(initialCards);
  const [total, setTotal] = useState(initialTotal);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [deckFilter, setDeckFilter] = useState(searchParams.get("deck") ?? "");
  const [stateFilter, setStateFilter] = useState(searchParams.get("state") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "created");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const [bulkTags, setBulkTags] = useState<string[]>([]);
  const [moveTarget, setMoveTarget] = useState("");

  const doSearch = useCallback(async (resetPage = true) => {
    setLoading(true);
    const p = resetPage ? 1 : page;
    try {
      const result = await searchCards({
        query: query || undefined,
        deckId: deckFilter || undefined,
        state: (stateFilter as CardFSRSState) || undefined,
        sort: sort as "due" | "created" | "alpha",
        page: p,
        limit: 50,
      });
      setCards(result.cards as unknown as BrowserCard[]);
      setTotal(result.total);
      if (resetPage) setPage(1);
    } catch {
      addToast.error("Search failed");
    } finally {
      setLoading(false);
    }
  }, [query, deckFilter, stateFilter, sort, page, addToast]);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, deckFilter, stateFilter, sort]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === cards.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(cards.map((c) => c.id)));
    }
  }

  async function handleBulkDelete() {
    if (!confirm(`Archive ${selected.size} cards?`)) return;
    try {
      await bulkDeleteCards(Array.from(selected));
      addToast.success(`Archived ${selected.size} cards`);
      setSelected(new Set());
      doSearch();
    } catch {
      addToast.error("Failed to archive cards");
    }
  }

  async function handleBulkTag() {
    if (bulkTags.length === 0) return;
    try {
      await bulkTagCards(Array.from(selected), bulkTags, []);
      addToast.success(`Tagged ${selected.size} cards`);
      setSelected(new Set());
      setBulkAction(null);
      setBulkTags([]);
      doSearch();
    } catch {
      addToast.error("Failed to tag cards");
    }
  }

  async function handleBulkMove() {
    if (!moveTarget) return;
    try {
      await bulkMoveCards(Array.from(selected), moveTarget);
      addToast.success(`Moved ${selected.size} cards`);
      setSelected(new Set());
      setBulkAction(null);
      doSearch();
    } catch {
      addToast.error("Failed to move cards");
    }
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cards..."
            className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-300 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <select
          value={deckFilter}
          onChange={(e) => setDeckFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All decks</option>
          {decks.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All states</option>
          <option value="new">New</option>
          <option value="learning">Learning</option>
          <option value="review">Review</option>
          <option value="relearning">Relearning</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="created">Newest first</option>
          <option value="alpha">Alphabetical</option>
        </select>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 bg-indigo-50 rounded-md p-3">
          <span className="text-sm font-medium text-indigo-700">
            {selected.size} selected
          </span>
          <div className="flex gap-1 ml-auto">
            <button onClick={() => setBulkAction("tag")} className="text-sm px-3 py-1 rounded-md bg-white border border-gray-200 hover:bg-gray-50 flex items-center gap-1">
              <Tag size={14} /> Tag
            </button>
            <button onClick={() => setBulkAction("move")} className="text-sm px-3 py-1 rounded-md bg-white border border-gray-200 hover:bg-gray-50 flex items-center gap-1">
              <ArrowRight size={14} /> Move
            </button>
            <button onClick={handleBulkDelete} className="text-sm px-3 py-1 rounded-md bg-white border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1">
              <Trash2 size={14} /> Archive
            </button>
          </div>
        </div>
      )}

      {bulkAction === "tag" && (
        <div className="p-3 bg-white border border-gray-200 rounded-md space-y-2">
          <p className="text-sm font-medium text-gray-700">Add tags to selected cards</p>
          <TagInput tags={bulkTags} onChange={setBulkTags} suggestions={allTags} />
          <div className="flex gap-2">
            <button onClick={handleBulkTag} className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700">Apply</button>
            <button onClick={() => { setBulkAction(null); setBulkTags([]); }} className="text-sm text-gray-600 px-3 py-1.5">Cancel</button>
          </div>
        </div>
      )}

      {bulkAction === "move" && (
        <div className="p-3 bg-white border border-gray-200 rounded-md space-y-2">
          <p className="text-sm font-medium text-gray-700">Move selected cards to:</p>
          <select value={moveTarget} onChange={(e) => setMoveTarget(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm w-full">
            <option value="">Select deck</option>
            {decks.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <div className="flex gap-2">
            <button onClick={handleBulkMove} disabled={!moveTarget} className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 disabled:opacity-50">Move</button>
            <button onClick={() => { setBulkAction(null); setMoveTarget(""); }} className="text-sm text-gray-600 px-3 py-1.5">Cancel</button>
          </div>
        </div>
      )}

      {/* Card list */}
      <div className="text-sm text-gray-500 mb-2">
        {loading ? "Searching..." : `${total} cards found`}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 px-4 py-2 text-xs text-gray-500 font-medium">
          <input
            type="checkbox"
            checked={selected.size === cards.length && cards.length > 0}
            onChange={toggleSelectAll}
          />
          <span className="flex-1">Front</span>
          <span className="w-20 text-center">State</span>
          <span className="w-24 text-right">Deck</span>
        </div>

        {cards.map((card) => {
          const state = card.card_states?.[0]?.state ?? "new";
          const deckName = card.decks?.name ?? "";
          return (
            <div
              key={card.id}
              className={`flex items-start gap-2 px-4 py-3 rounded-lg border bg-white ${
                selected.has(card.id) ? "border-indigo-200 bg-indigo-50" : "border-gray-200"
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(card.id)}
                onChange={() => toggleSelect(card.id)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{card.front}</p>
                <p className="text-xs text-gray-500 truncate">{card.back}</p>
                {card.tags.length > 0 && (
                  <div className="mt-1 flex gap-1 flex-wrap">
                    {card.tags.map((t) => (
                      <span key={t} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <span className={`w-20 text-center text-xs px-2 py-0.5 rounded-full ${
                state === "new" ? "bg-blue-50 text-blue-700" :
                state === "learning" ? "bg-yellow-50 text-yellow-700" :
                state === "review" ? "bg-green-50 text-green-700" :
                "bg-red-50 text-red-700"
              }`}>
                {state}
              </span>
              <span className="w-24 text-right text-xs text-gray-400 truncate">{deckName}</span>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {total > 50 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => { setPage((p) => Math.max(1, p - 1)); doSearch(false); }}
            disabled={page <= 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {page}</span>
          <button
            onClick={() => { setPage((p) => p + 1); doSearch(false); }}
            disabled={page * 50 >= total}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
