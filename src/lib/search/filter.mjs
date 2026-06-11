import { isBlocked } from "./quality.mjs";

const TRACKING_PARAMS = new Set([
  "fbclid",
  "gclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "ref",
  "spm",
  "utm_campaign",
  "utm_content",
  "utm_medium",
  "utm_source",
  "utm_term",
]);

export function stripHtml(text) {
  return text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export function canonicalUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, "");

    for (const param of [...url.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(param.toLowerCase())) {
        url.searchParams.delete(param);
      }
    }

    if (url.pathname.length > 1) {
      url.pathname = url.pathname.replace(/\/+$/, "");
    }

    return url.toString();
  } catch {
    return value.trim().toLowerCase();
  }
}

export function filterResults(results) {
  const seen = new Set();
  const filtered = [];

  for (const result of results) {
    const title = result.title?.trim();
    const url = result.url?.trim();

    if (!title || !url || isBlocked(url)) {
      continue;
    }

    const normalizedUrl = canonicalUrl(url);

    if (seen.has(normalizedUrl)) {
      continue;
    }

    seen.add(normalizedUrl);
    filtered.push({
      title,
      url: normalizedUrl,
      description: stripHtml(result.description ?? ""),
      age: result.age,
    });
  }

  return filtered;
}
