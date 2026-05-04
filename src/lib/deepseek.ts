export class DeepSeekError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "DeepSeekError";
  }
}

interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface DeepSeekChoice {
  message: DeepSeekMessage;
  finish_reason: string;
}

interface DeepSeekResponse {
  choices: DeepSeekChoice[];
}

export interface SearchResultItem {
  title: string;
  description: string;
  url: string;
}

interface SummaryResponse {
  summary: string;
  suggestions: string[];
}

export interface NewsBriefingStory {
  title: string;
  summary: string;
  sourceUrls: string[];
}

export interface GeneratedNewsBriefing {
  title: string;
  summary: string;
  whyItMatters: string;
  angles: string[];
  stories?: NewsBriefingStory[];
}

async function callDeepSeek(
  systemPrompt: string,
  userPrompt: string,
  options?: { maxTokens?: number; temperature?: number },
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new DeepSeekError(
      "DEEPSEEK_API_KEY environment variable is not set",
    );
  }

  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

  const response = await fetch(
    "https://api.deepseek.com/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: options?.maxTokens ?? 256,
        temperature: options?.temperature ?? 0.7,
      }),
    },
  );

  if (!response.ok) {
    throw new DeepSeekError(
      `DeepSeek API returned ${response.status}: ${response.statusText}`,
      response.status,
    );
  }

  const data: DeepSeekResponse = await response.json();

  if (!data.choices?.[0]?.message?.content) {
    throw new DeepSeekError("DeepSeek API returned empty response");
  }

  return data.choices[0].message.content;
}

export async function rewriteQuery(query: string): Promise<string> {
  const systemPrompt =
    "You are a search query optimizer. Rewrite the user's query to be " +
    "more specific and likely to return high-quality web results. " +
    "Preserve the original intent. Return ONLY the rewritten query, no explanation.";

  const result = await callDeepSeek(systemPrompt, query, {
    maxTokens: 100,
    temperature: 0.3,
  });

  const trimmed = result.trim();
  if (!trimmed) {
    throw new DeepSeekError("rewriteQuery returned empty string");
  }

  return trimmed;
}

export async function summarizeResults(
  query: string,
  results: SearchResultItem[],
): Promise<SummaryResponse> {
  const systemPrompt =
    "You are a search result summarizer. Given the search query and the top search results, " +
    "produce a concise summary of the key findings (approximately 400 tokens) and two related " +
    "follow-up questions the user might want to explore next.\n\n" +
    "Respond with valid JSON only, using this exact format:\n" +
    '{"summary": "...", "suggestions": ["...", "..."]}\n' +
    "Do not include any text outside the JSON object.";

  const resultItems = results
    .map(
      (r, i) =>
        `${i + 1}. ${r.title}\n   URL: ${r.url}\n   Description: ${r.description}`,
    )
    .join("\n\n");

  const userPrompt = `Query: ${query}\n\nResults:\n${resultItems}`;

  const content = await callDeepSeek(systemPrompt, userPrompt, {
    maxTokens: 600,
    temperature: 0.5,
  });

  let parsed: SummaryResponse;

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new DeepSeekError(
      "summarizeResults: failed to parse JSON from API response",
    );
  }

  if (
    typeof parsed.summary !== "string" ||
    !Array.isArray(parsed.suggestions) ||
    parsed.suggestions.length === 0
  ) {
    throw new DeepSeekError(
      "summarizeResults: response missing required fields",
    );
  }

  return parsed;
}

export async function generateNewsBriefing(input: {
  topicName: string;
  topicDescription?: string;
  sources: { title: string; url: string; description?: string }[];
}): Promise<GeneratedNewsBriefing> {
  const systemPrompt =
    "You write concise news briefings for a personal browser start page. " +
    "Use only the provided sources. Do not invent facts, causes, numbers, dates, or implications. " +
    "Do not force unrelated sources into one causal narrative. " +
    "If the sources cover multiple distinct stories under the same topic, represent that in the stories array. " +
    "If sources emphasize different angles, explicitly capture those in the angles array. " +
    "If evidence is thin or uncertain, say so. Return valid JSON only.";

  const sourceText = input.sources
    .map(
      (s, i) =>
        `${i + 1}. ${s.title}\nURL: ${s.url}\nDescription: ${s.description ?? ""}`,
    )
    .join("\n\n");

  const userPrompt =
    `Topic: ${input.topicName}\n` +
    `${input.topicDescription ?? ""}\n\n` +
    `Sources:\n${sourceText}\n\n` +
    "Return JSON with this shape exactly:\n" +
    '{"title":"...","summary":"...","whyItMatters":"...","angles":["..."],"stories":[{"title":"...","summary":"...","sourceUrls":["..."]}]}\n' +
    "Rules:\n" +
    "- summary should be 3-5 sentences.\n" +
    "- whyItMatters should be 1-3 sentences.\n" +
    "- angles should mention meaningful differences in source framing or emphasis.\n" +
    "- stories should contain 1 item for a narrow coherent topic, or 2-3 items if sources clearly cover multiple distinct stories.\n" +
    "- sourceUrls must only contain URLs from the provided sources.";

  const content = await callDeepSeek(systemPrompt, userPrompt, {
    maxTokens: 800,
    temperature: 0.3,
  });

  let parsed: GeneratedNewsBriefing;

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new DeepSeekError("generateNewsBriefing: failed to parse JSON");
  }

  if (
    typeof parsed.title !== "string" ||
    typeof parsed.summary !== "string" ||
    typeof parsed.whyItMatters !== "string" ||
    !Array.isArray(parsed.angles)
  ) {
    throw new DeepSeekError("generateNewsBriefing: response missing required fields");
  }

  return parsed;
}
