const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MODEL = "claude-sonnet-5";

export class ClaudeConfigError extends Error {}

type ClaudeMessage = { role: "user" | "assistant"; content: string };

type AnthropicResponse = {
  content: { type: string; text?: string }[];
};

export async function callClaude({
  system,
  messages,
  maxTokens = 1200,
}: {
  system: string;
  messages: ClaudeMessage[];
  maxTokens?: number;
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new ClaudeConfigError(
      "ANTHROPIC_API_KEY is not set. Add it to your .env file and restart the server to enable AI Mentor features."
    );
  }

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Claude API error (${res.status}): ${text.slice(0, 500)}`);
  }

  const data = (await res.json()) as AnthropicResponse;
  const textBlock = data.content.find((block) => block.type === "text");
  return textBlock?.text ?? "";
}

function stripJsonFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
}

export async function callClaudeJSON<T>({
  system,
  user,
  maxTokens = 1200,
}: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<T> {
  const raw = await callClaude({
    system: `${system}\n\nRespond with ONLY valid JSON matching the requested shape. No markdown code fences, no commentary before or after.`,
    messages: [{ role: "user", content: user }],
    maxTokens,
  });

  const cleaned = stripJsonFences(raw);
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(`Claude returned invalid JSON: ${cleaned.slice(0, 300)}`);
  }
}
