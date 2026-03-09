import { createClient } from "@/lib/supabase/server";
import { getEmbeddingService } from "./openai";

export async function generateAndStoreEmbedding(
  cardId: string,
  front: string,
  back: string
) {
  const service = getEmbeddingService();
  if (!service) return; // Embeddings not configured

  try {
    const text = `${front} ${back}`;
    const embedding = await service.embed(text);
    const supabase = await createClient();

    await supabase
      .from("cards")
      .update({ embedding: JSON.stringify(embedding) })
      .eq("id", cardId);
  } catch {
    // Non-critical: card works without embedding
    console.error(`Failed to generate embedding for card ${cardId}`);
  }
}

export async function generateBatchEmbeddings(
  cards: { id: string; front: string; back: string }[]
) {
  const service = getEmbeddingService();
  if (!service || cards.length === 0) return;

  const supabase = await createClient();
  const batchSize = 50;

  for (let i = 0; i < cards.length; i += batchSize) {
    const batch = cards.slice(i, i + batchSize);
    const texts = batch.map((c) => `${c.front} ${c.back}`);

    try {
      const embeddings = await service.embedBatch(texts);

      for (let j = 0; j < batch.length; j++) {
        await supabase
          .from("cards")
          .update({ embedding: JSON.stringify(embeddings[j]) })
          .eq("id", batch[j].id);
      }
    } catch {
      console.error(`Failed to generate batch embeddings (offset ${i})`);
    }
  }
}
