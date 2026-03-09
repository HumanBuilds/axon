export interface ImportedCard {
  front: string;
  back: string;
  tags?: string[];
}

export interface ImportJSON {
  deck_name: string;
  description?: string;
  cards: ImportedCard[];
}

export function validateImportJSON(data: unknown): {
  valid: boolean;
  result?: ImportJSON;
  error?: string;
} {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Invalid JSON structure" };
  }

  const obj = data as Record<string, unknown>;
  if (!obj.deck_name || typeof obj.deck_name !== "string") {
    return { valid: false, error: "Missing or invalid deck_name" };
  }

  if (!Array.isArray(obj.cards) || obj.cards.length === 0) {
    return { valid: false, error: "Cards must be a non-empty array" };
  }

  const cards: ImportedCard[] = [];
  for (let i = 0; i < obj.cards.length; i++) {
    const card = obj.cards[i] as Record<string, unknown>;
    if (!card.front || typeof card.front !== "string") continue;
    if (!card.back || typeof card.back !== "string") continue;
    cards.push({
      front: card.front,
      back: card.back,
      tags: Array.isArray(card.tags) ? card.tags.filter((t): t is string => typeof t === "string") : [],
    });
  }

  if (cards.length === 0) {
    return { valid: false, error: "No valid cards found (cards need front and back fields)" };
  }

  return {
    valid: true,
    result: {
      deck_name: obj.deck_name as string,
      description: typeof obj.description === "string" ? obj.description : undefined,
      cards,
    },
  };
}
