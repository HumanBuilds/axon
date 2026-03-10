import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient } from "@/lib/agents/client";
import { checkRateLimit, COACH_LIMIT } from "@/lib/agents/rate-limit";

const SYSTEM_PROMPT = `You are an expert flashcard coach. You follow evidence-based principles:
- Minimum information principle: each card should test one atomic idea
- No ambiguity: the question should have exactly one correct answer
- Avoid sets and enumerations unless broken into individual cards
- Include context and connections to aid encoding
- Use concrete examples over abstract definitions

You will receive a card's front and back. Provide specific, actionable suggestions.
If the card is already good, say so briefly.`;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { allowed, retryAfterMs } = checkRateLimit(
    `coach:${user.id}`,
    COACH_LIMIT.max,
    COACH_LIMIT.windowMs
  );

  if (!allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Try again in ${Math.ceil(retryAfterMs / 60000)} minutes.` },
      { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  const { front, back } = await request.json();
  if (!front || !back) {
    return NextResponse.json({ error: "Missing front or back" }, { status: 400 });
  }

  try {
    const anthropic = getAnthropicClient();
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        { role: "user", content: `Review this flashcard:\n\nFront: ${front}\n\nBack: ${back}` },
      ],
      tools: [
        {
          name: "submit_review",
          description: "Submit the structured card review",
          input_schema: {
            type: "object" as const,
            properties: {
              suggestions: { type: "string", description: "Markdown-formatted feedback" },
              revised_front: { type: "string", description: "Suggested rewrite of front, or empty if no change needed" },
              revised_back: { type: "string", description: "Suggested rewrite of back, or empty if no change needed" },
              should_split: { type: "boolean", description: "Whether the card should be split into multiple cards" },
            },
            required: ["suggestions"],
          },
        },
      ],
      tool_choice: { type: "tool" as const, name: "submit_review" },
    });

    // Extract tool use result
    const toolUse = response.content.find((c) => c.type === "tool_use");
    if (toolUse && toolUse.type === "tool_use") {
      return NextResponse.json(toolUse.input);
    }

    return NextResponse.json({ suggestions: "No suggestions available." });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Agent error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
