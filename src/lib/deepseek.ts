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
  const allowedUrls = input.sources.map((source) => source.url);

  const systemPrompt =
    "You create reliability-first news briefings from source snippets. " +
    "Your job is faithful representation, not narrative writing. " +
    "Use only the provided source titles, descriptions, and URLs. " +
    "Do not add facts, causes, dates, numbers, motives, or implications unless directly supported by the provided source text. " +
    "Do not connect unrelated stories causally or thematically unless the sources themselves do. " +
    "If the sources cover multiple unrelated stories, keep them separated in stories and make the top-level summary a neutral overview. " +
    "If the source snippets are thin, explicitly state that the briefing is based on limited source snippets. " +
    "If sources disagree or frame the story differently, describe that in angles without deciding who is right. " +
    "Return valid JSON only.";

  const sourceText = input.sources
    .map(
      (s, i) =>
        `${i + 1}. ${s.title}\nURL: ${s.url}\nDescription: ${s.description ?? ""}`,
    )
    .join("\n\n");

  const userPrompt =
    `Topic: ${input.topicName}\n` +
    `${input.topicDescription ?? ""}\n\n` +
    `Allowed source URLs:\n${allowedUrls.map((url) => `- ${url}`).join("\n")}\n\n` +
    `Sources:\n${sourceText}\n\n` +
    "Return JSON with this exact shape:\n" +
    '{"title":"...","summary":"...","whyItMatters":"...","angles":["..."],"stories":[{"title":"...","summary":"...","sourceUrls":["..."]}]}\n\n' +
    "Reliability rules:\n" +
    "- Prefer factual separation over elegant synthesis.\n" +
    "- If sources cover unrelated stories, stories must contain separate items and the title must not imply one combined event.\n" +
    "- Each story must be supported by at least one sourceUrl from the allowed list.\n" +
    "- sourceUrls must exactly match allowed source URLs; do not invent or alter URLs.\n" +
    "- The top-level summary should be 2-4 sentences and should only summarize what the provided sources cover.\n" +
    "- whyItMatters should be cautious and limited to direct implications supported by the source descriptions; otherwise say implications are unclear from the snippets.\n" +
    "- angles should describe source framing or emphasis, not add new analysis.\n" +
    "- Use cautious language when only one source supports a story.";

  const content = await callDeepSeek(systemPrompt, userPrompt, {
    maxTokens: 850,
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

  if (parsed.stories !== undefined && !Array.isArray(parsed.stories)) {
    throw new DeepSeekError("generateNewsBriefing: stories must be an array");
  }

  if (parsed.stories) {
    const allowedUrlSet = new Set(allowedUrls);
    parsed.stories = parsed.stories
      .filter(
        (story) =>
          typeof story.title === "string" &&
          typeof story.summary === "string" &&
          Array.isArray(story.sourceUrls),
      )
      .map((story) => ({
        ...story,
        sourceUrls: story.sourceUrls.filter((url) => allowedUrlSet.has(url)),
      }))
      .filter((story) => story.sourceUrls.length > 0);
  }

  return parsed;
}
