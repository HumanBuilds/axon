import type { EmbeddingService } from "./types";

const DIMENSIONS = 512;

export class OpenAIEmbeddingService implements EmbeddingService {
  dimensions = DIMENSIONS;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async embed(text: string): Promise<number[]> {
    const result = await this.embedBatch([text]);
    return result[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: texts,
        dimensions: DIMENSIONS,
      }),
    });

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data
      .sort((a: { index: number }, b: { index: number }) => a.index - b.index)
      .map((d: { embedding: number[] }) => d.embedding);
  }
}

let service: EmbeddingService | null = null;

export function getEmbeddingService(): EmbeddingService | null {
  if (service) return service;

  const apiKey = process.env.EMBEDDING_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  service = new OpenAIEmbeddingService(apiKey);
  return service;
}
