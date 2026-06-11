import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const i18nFacadePath = path.join(process.cwd(), "src/lib/i18n.ts");
const source = fs.readFileSync(i18nFacadePath, "utf8");

const requiredDomains = [
  "auth",
  "shell",
  "search",
  "modules",
  "settings",
  "counts",
  "lists",
  "notes",
  "readLater",
  "watchTopics",
  "notices",
  "showMore",
];

test("i18n facade composes all expected domains for en/no/sv", () => {
  assert.ok(source.includes('const LANGUAGES: AppLanguage[] = ["en", "no", "sv"]'));
  for (const domain of requiredDomains) {
    assert.ok(source.includes(`${domain}:`), `missing "${domain}" in i18n facade composition`);
  }
});
