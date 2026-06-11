import { searchTerms } from "./score.mjs";

function makeSnippet(content, terms, maxLength = 180) {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (!normalized) return "";

  const lower = normalized.toLowerCase();
  const firstMatch = terms
    .map((term) => lower.indexOf(term))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];

  const start = firstMatch === undefined ? 0 : Math.max(firstMatch - 45, 0);
  const snippet = normalized.slice(start, start + maxLength).trim();
  const prefix = start > 0 ? "... " : "";
  const suffix = start + maxLength < normalized.length ? " ..." : "";

  return `${prefix}${snippet}${suffix}`;
}

export function searchNotes(notes, query) {
  const terms = searchTerms(query);
  const phrase = terms.join(" ");

  if (terms.length === 0) return [];

  return notes
    .map((note) => {
      const title = note.title ?? "";
      const content = note.content ?? "";
      const titleLower = title.toLowerCase();
      const contentLower = content.toLowerCase();
      let score = 0;

      if (phrase && titleLower.includes(phrase)) score += 8;
      if (phrase && contentLower.includes(phrase)) score += 4;

      for (const term of terms) {
        if (titleLower.includes(term)) score += 4;
        if (contentLower.includes(term)) score += 1;
      }

      return {
        id: note.id,
        title: title || "Untitled note",
        description: makeSnippet(content, terms),
        score,
        updated_at: note.updated_at,
      };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return String(b.updated_at ?? "").localeCompare(String(a.updated_at ?? ""));
    });
}
