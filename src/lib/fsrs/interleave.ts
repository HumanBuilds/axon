import { cosineSimilarity } from "@/lib/embeddings/similarity";

interface CardWithEmbedding {
  id: string;
  front: string;
  back: string;
  tags: string[];
  embedding: number[] | null;
  [key: string]: unknown;
}

export function interleaveCards(
  dueCards: CardWithEmbedding[],
  options: { similarityThreshold?: number; minTopicSwitch?: number } = {}
): CardWithEmbedding[] {
  if (dueCards.length <= 2) return dueCards;

  const threshold = options.similarityThreshold ?? 0.7;
  const cardsWithEmbeddings = dueCards.filter((c) => c.embedding !== null);

  // If not enough embeddings, return original order
  if (cardsWithEmbeddings.length < 3) return dueCards;

  const result: CardWithEmbedding[] = [];
  const remaining = [...dueCards];

  // Start with the first due card
  result.push(remaining.shift()!);

  while (remaining.length > 0) {
    const current = result[result.length - 1];

    if (!current.embedding) {
      // No embedding for current card, just take next
      result.push(remaining.shift()!);
      continue;
    }

    // Score each remaining card
    let bestIdx = 0;
    let bestScore = -1;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      if (!candidate.embedding) continue;

      const similarity = cosineSimilarity(current.embedding, candidate.embedding);

      // Prefer cards that are similar but from different tag clusters
      const sameTagCluster =
        candidate.tags.length > 0 &&
        current.tags.length > 0 &&
        candidate.tags.some((t) => current.tags.includes(t));

      const score = similarity >= threshold
        ? similarity * (sameTagCluster ? 0.3 : 1.0)
        : similarity;

      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }

    result.push(remaining.splice(bestIdx, 1)[0]);
  }

  return result;
}
