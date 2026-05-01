import { appendFileSync, existsSync, mkdirSync, statSync, renameSync, unlinkSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LOGS_DIR = join(ROOT, 'logs');
const LOG_FILE = join(LOGS_DIR, 'agent-events.jsonl');
const MAX_SIZE = 5 * 1024 * 1024;
const MAX_ROTATED = 3;

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function rotateLog() {
  if (!existsSync(LOG_FILE)) return;
  const stat = statSync(LOG_FILE);
  if (stat.size < MAX_SIZE) return;

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const rotatedName = `agent-events-${dateStr}.jsonl`;
  const rotatedPath = join(LOGS_DIR, rotatedName);

  renameSync(LOG_FILE, rotatedPath);

  const rotatedFiles = readdirSync(LOGS_DIR)
    .filter(f => f.startsWith('agent-events-') && f.endsWith('.jsonl'))
    .sort();
  while (rotatedFiles.length > MAX_ROTATED) {
    unlinkSync(join(LOGS_DIR, rotatedFiles.shift()));
  }
}

function makeHash(event_type, agent, short_reason) {
  return createHash('sha256').update(`${event_type}:${agent}:${short_reason}`).digest('hex').slice(0, 8);
}

export function logEvent({ event_type, agent, result, short_reason, command } = {}) {
  try {
    ensureDir(LOGS_DIR);
    rotateLog();

    const reason = typeof short_reason === 'string' ? short_reason.slice(0, 200) : (short_reason || '').toString().slice(0, 200);
    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      agent: agent || '',
      event_type: event_type || '',
      command: command || '',
      result: result || '',
      short_reason: reason,
      hash: makeHash(event_type || '', agent || '', reason),
    });

    appendFileSync(LOG_FILE, line + '\n', 'utf-8');
    return true;
  } catch {
    return false;
  }
}

if (process.argv[1]?.endsWith('log-event.mjs')) {
  const args = process.argv.slice(2);
  const [event_type = '', agent = '', result = '', ...reasonParts] = args;
  const short_reason = reasonParts.join(' ');

  const ok = logEvent({ event_type, agent, result, short_reason });
  if (!ok) {
    console.error('Failed to write log event');
  }
  process.exit(ok ? 0 : 1);
}
