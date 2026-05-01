import { existsSync, copyFileSync, unlinkSync, readdirSync, readFileSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const RULES_DIR = join(ROOT, '.kilo', 'rules');
const PREFIX_MIN = 20;
const PREFIX_MAX = 39;

function readText(filePath) {
  const buf = readFileSync(filePath);
  const bom16LE = buf[0] === 0xFF && buf[1] === 0xFE;
  const bom16BE = buf[0] === 0xFE && buf[1] === 0xFF;
  const bom8 = buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;

  if (bom16LE) return buf.toString('utf16le').replace(/^\uFEFF/, '');
  if (bom16BE) return buf.toString('utf16be').replace(/^\uFEFF/, '');
  if (bom8) return buf.toString('utf-8').replace(/^\uFEFF/, '');
  return buf.toString('utf-8');
}

function usage() {
  console.log('Usage:');
  console.log('  node scripts/activate-rules.mjs --add <source.md>      Copy a rule into .kilo/rules/ with next available prefix');
  console.log('  node scripts/activate-rules.mjs --remove <name>          Remove a prefixed rule file from .kilo/rules/');
  console.log('  node scripts/activate-rules.mjs --list                   List active prefixed rules');
  console.log('  node scripts/activate-rules.mjs --force --add <src.md>   Overwrite existing rule with same name');
  process.exit(1);
}

function parseYamlFrontmatter(content) {
  const lines = content.split('\n');
  let start = -1;
  let end = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      if (start === -1) start = i;
      else if (end === -1) { end = i; break; }
    }
  }
  if (start === -1 || end === -1) return null;

  const result = {};
  for (let i = start + 1; i < end; i++) {
    const line = lines[i];
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.substring(0, colonIdx).trim();
    const value = line.substring(colonIdx + 1).trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      result[key] = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else {
      result[key] = value.replace(/^["']|["']$/g, '');
    }
  }
  return result;
}

function activeRules() {
  return readdirSync(RULES_DIR)
    .filter(f => f.endsWith('.md') && /^\d+-/.test(f))
    .map(f => {
      const match = f.match(/^(\d+)-(.+)\.md$/);
      if (!match) return null;
      try {
        const content = readText(join(RULES_DIR, f));
        const yaml = parseYamlFrontmatter(content);
        if (yaml && yaml.paths) {
          return { prefix: parseInt(match[1], 10), name: match[2], file: f, paths: yaml.paths };
        }
      } catch { /* skip files that can't be parsed */ }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => a.prefix - b.prefix);
}

function listRules() {
  const rules = activeRules();
  if (rules.length === 0) {
    console.log('No active path-scoped rules found.');
    return;
  }
  console.log('\nActive path-scoped rules:\n');
  for (const r of rules) {
    const paths = r.paths ? ` [${r.paths.join(', ')}]` : '';
    console.log(`  ${r.file}${paths}`);
  }
  console.log('');

  const configContent = readText(join(ROOT, 'kilo.jsonc'));
  const rulesInConfig = rules.filter(r => configContent.includes(`.kilo/rules/${r.file}`));
  const rulesMissing = rules.filter(r => !configContent.includes(`.kilo/rules/${r.file}`));

  if (rulesMissing.length > 0) {
    console.log('\u26A0  Rules NOT in kilo.jsonc instructions:');
    for (const r of rulesMissing) {
      console.log(`    ".kilo/rules/${r.file}",`);
    }
    console.log('');
  }
}

function addRule(sourcePath, force) {
  const srcAbs = join(ROOT, sourcePath);

  if (!existsSync(srcAbs)) {
    console.error(`Error: Source file not found: ${sourcePath}`);
    process.exit(1);
  }

  const content = readText(srcAbs);
  const yaml = parseYamlFrontmatter(content);

  if (!yaml || !yaml.paths) {
    console.error('Error: Source rule file must have valid YAML frontmatter with a paths field.');
    process.exit(1);
  }

  const name = basename(sourcePath).replace('.md', '');
  const active = activeRules();

  const existing = active.find(r => r.name === name);
  if (existing) {
    if (force) {
      unlinkSync(join(RULES_DIR, existing.file));
      console.log(`Overwriting: ${existing.file}`);
    } else {
      console.log(`Skipping "${name}" \u2014 already active (${existing.file}). Use --force to overwrite.`);
      return;
    }
  }

  const usedPrefixes = new Set(activeRules().map(p => p.prefix));
  let nextPrefix = PREFIX_MIN;
  while (usedPrefixes.has(nextPrefix) && nextPrefix <= PREFIX_MAX) {
    nextPrefix++;
  }
  if (nextPrefix > PREFIX_MAX) {
    console.error(`Error: No available prefix slots (${PREFIX_MIN}-${PREFIX_MAX}). Remove a rule first.`);
    process.exit(1);
  }

  const targetName = `${nextPrefix}-${name}.md`;
  const dest = join(RULES_DIR, targetName);
  copyFileSync(srcAbs, dest);

  console.log(`Activated: ${targetName}`);
  console.log(`  Add to kilo.jsonc instructions:`);
  console.log(`    ".kilo/rules/${targetName}",`);
}

function removeRule(name) {
  const active = activeRules();
  const entry = active.find(p => p.name === name);

  if (!entry) {
    console.log(`Rule "${name}" is not active.`);
    return;
  }

  const filePath = join(RULES_DIR, entry.file);
  unlinkSync(filePath);
  console.log(`Removed: ${entry.file}`);
  console.log(`  Remove from kilo.jsonc instructions:`);
  console.log(`    ".kilo/rules/${entry.file}",`);
}

const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  usage();
}

if (args.includes('--list')) {
  listRules();
  process.exit(0);
}

const force = args.includes('--force');

if (args.includes('--add')) {
  const idx = args.indexOf('--add');
  const path = args.slice(idx + 1).filter(a => !a.startsWith('--'))[0];
  if (!path) usage();
  addRule(path, force);
  process.exit(0);
}

if (args.includes('--remove')) {
  const idx = args.indexOf('--remove');
  const name = args.slice(idx + 1).filter(a => !a.startsWith('--'))[0];
  if (!name) usage();
  removeRule(name);
  process.exit(0);
}

usage();
