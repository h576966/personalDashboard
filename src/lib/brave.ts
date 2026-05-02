export interface BraveWebResult {
  title: string;
  url: string;
  description: string;
  age?: string;
  language?: string;
}

export interface BraveSearchResponse {
  web: {
    results: BraveWebResult[];
  };
}

export class BraveSearchError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "BraveSearchError";
  }
}

export async function searchBrave(
  query: string,
  count: number = 10,
  freshness?: "pd" | "pw" | "pm" | "py",
  country?: string,
): Promise<BraveSearchResponse> {
  const apiKey = process.env.BRAVE_API_KEY;

  if (!apiKey) {
    throw new BraveSearchError(
      "BRAVE_API_KEY environment variable is not set",
    );
  }

  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(Math.min(count, 20)));

  if (freshness) {
    url.searchParams.set("freshness", freshness);
  }

  if (country) {
    url.searchParams.set("country", country);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": apiKey,
    },
  });

  if (!response.ok) {
    throw new BraveSearchError(
      `Brave API returned ${response.status}: ${response.statusText}`,
      response.status,
    );
  }

  const data: BraveSearchResponse = await response.json();
  return data;
}
