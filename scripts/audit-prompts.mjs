import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const TARGET_DIRS = [
  '.kilo/agents',
  '.kilo/commands',
  '.kilo/rules',
];

const TARGET_FILES = [
  'AGENTS.md',
  'README.md',
  'kilo.jsonc',
];

const FORBIDDEN_PATTERNS = [
  {
    name: 'non-existent question tool',
    pattern: /\bquestion\s+tool\b|`question`\s+tool|use\s+the\s+`question`/i,
    reason: 'Agents should present actionable options directly in chat, not call a question tool.',
  },
  {
    name: 'answer.includes flow',
    pattern: /\banswer\.includes\s*\(/i,
    reason: 'Agents do not receive an answer variable from a question tool; wait for explicit user instruction instead.',
  },
  {
    name: 'removed pro-plan agent',
    pattern: /\bpro-plan\b/i,
    reason: 'Planning is single-agent and Flash-first; V4 Pro is a manual rerun path, not a separate agent.',
  },
];

function walk(dir) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) return [];

  const out = [];
  for (const entry of readdirSync(abs, { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...walk(rel));
    else if (entry.isFile() && entry.name.endsWith('.md')) out.push(rel);
  }
  return out;
}

function read(rel) {
  return readFileSync(join(ROOT, rel), 'utf-8');
}

function lineNumber(content, index) {
  return content.slice(0, index).split('\n').length;
}

const files = [
  ...TARGET_DIRS.flatMap(walk),
  ...TARGET_FILES.filter(file => existsSync(join(ROOT, file))),
];

const failures = [];

for (const file of files) {
  const content = read(file);
  for (const rule of FORBIDDEN_PATTERNS) {
    const match = rule.pattern.exec(content);
    if (match) {
      // Skip matches where the surrounding line is a prohibition (e.g., "do not call a question tool")
      const lineIdx = lineNumber(content, match.index) - 1;
      const line = content.split('\n')[lineIdx] || '';
      if (/\b(?:do\s+\*{0,2}not\*{0,2}|don't|never|avoid)\b.*\bquestion\b/i.test(line)) {
        continue;
      }
      failures.push({
        file,
        line: lineNumber(content, match.index),
        rule: rule.name,
        reason: rule.reason,
        match: match[0],
      });
    }
  }
}

if (failures.length > 0) {
  console.error('\nPrompt audit failed.\n');
  for (const failure of failures) {
    console.error(`- ${failure.file}:${failure.line} — ${failure.rule}`);
    console.error(`  Found: ${failure.match}`);
    console.error(`  ${failure.reason}`);
  }
  console.error('');
  process.exit(1);
}

console.log(`Prompt audit passed (${files.length} files checked).`);