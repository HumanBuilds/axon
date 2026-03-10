import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient } from "@/lib/agents/client";
import { checkRateLimit, GENERATOR_LIMIT } from "@/lib/agents/rate-limit";

const SYSTEM_PROMPT = `You are an expert flashcard author. Given a topic, generate comprehensive
flashcards covering key concepts, terms, and relationships.

Principles:
- One idea per card (minimum information principle)
- Mix types: definition, explanation, example-based, comparison
- Order from foundational to advanced
- Clear, unambiguous language
- Tag each card with relevant subtopics

Respond ONLY with a valid JSON array of cards, no other text:
[{ "front": "...", "back": "...", "tags": ["..."] }]`;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed, retryAfterMs } = checkRateLimit(
    `generate:${user.id}`,
    GENERATOR_LIMIT.max,
    GENERATOR_LIMIT.windowMs
  );

  if (!allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${Math.ceil(retryAfterMs / 60000)} minutes.` },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  const { topic, depth, card_count, notes } = await request.json();
  if (!topic) {
    return NextResponse.json({ error: "Missing topic" }, { status: 400 });
  }

  try {
    const anthropic = getAnthropicClient();

    let prompt = `Generate flashcards about: ${topic}`;
    if (depth) prompt += `\nDifficulty level: ${depth}`;
    if (card_count) prompt += `\nGenerate exactly ${card_count} cards`;
    if (notes) prompt += `\nAdditional notes: ${notes}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content
      .filter((c) => c.type === "text")
      .map((c) => {
        if (c.type === "text") return c.text;
        return "";
      })
      .join("");

    // Parse the JSON array from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse generated cards" }, { status: 500 });
    }

    const cards = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ cards });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
