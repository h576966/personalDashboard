import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LOGS_DIR = join(ROOT, 'logs');

function collectEvents() {
  if (!existsSync(LOGS_DIR)) return [];

  const files = readdirSync(LOGS_DIR)
    .filter(f => f.startsWith('agent-events') && f.endsWith('.jsonl'))
    .sort();

  const events = [];
  for (const file of files) {
    const content = readFileSync(join(LOGS_DIR, file), 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        events.push(JSON.parse(line));
      } catch { /* skip malformed lines */ }
    }
  }
  return events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function main() {
  const events = collectEvents();

  if (events.length === 0) {
    console.log('No events logged yet.');
    process.exit(0);
  }

  const types = {};
  for (const e of events) {
    if (!types[e.event_type]) {
      types[e.event_type] = { count: 0, lastSeen: e.timestamp };
    }
    types[e.event_type].count++;
    if (e.timestamp > types[e.event_type].lastSeen) {
      types[e.event_type].lastSeen = e.timestamp;
    }
  }

  const fingerprints = {};
  const agentFingerprints = {};
  for (const e of events) {
    if (!fingerprints[e.hash]) {
      fingerprints[e.hash] = { count: 0, reason: e.short_reason, agents: new Set() };
    }
    fingerprints[e.hash].count++;
    fingerprints[e.hash].agents.add(e.agent);
  }

  const agents = {};
  for (const e of events) {
    if (!agents[e.agent]) {
      agents[e.agent] = { total: 0, escalated: 0, cancelled: 0 };
    }
    agents[e.agent].total++;
    if (e.event_type === 'escalation_prompted') agents[e.agent].escalated++;
    if (e.event_type === 'user_cancelled') agents[e.agent].cancelled++;
  }

  console.log('\n=== Event Counts by Type ===\n');
  const typeEntries = Object.entries(types).sort((a, b) => b[1].count - a[1].count);
  for (const [type, data] of typeEntries) {
    console.log(`  ${type}: ${data.count} (last: ${data.lastSeen.slice(0, 19).replace('T', ' ')})`);
  }

  const topFingerprints = Object.entries(fingerprints)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);

  if (topFingerprints.length > 0) {
    console.log('\n=== Top Recurring Fingerprints ===\n');
    for (const [hash, data] of topFingerprints) {
      const agentsList = [...data.agents].join(', ');
      const reason = data.reason.length > 80 ? data.reason.slice(0, 77) + '...' : data.reason;
      console.log(`  ${hash}: ${data.count}\u00D7 \u2014 "${reason}" (agents: ${agentsList})`);
    }
  }

  console.log('\n=== Agent-Level Breakdown ===\n');
  const agentEntries = Object.entries(agents).sort((a, b) => b[1].total - a[1].total);
  for (const [agent, data] of agentEntries) {
    const escRate = data.total > 0 ? ((data.escalated / data.total) * 100).toFixed(0) : 0;
    const cancRate = data.total > 0 ? ((data.cancelled / data.total) * 100).toFixed(0) : 0;
    console.log(`  ${agent}: ${data.total} events, ${escRate}% escalated, ${cancRate}% cancelled`);
  }

  console.log('\n=== Recent Events (last 20) ===\n');
  const recent = events.slice(-20);
  for (const e of recent) {
    const ts = e.timestamp.slice(0, 19).replace('T', ' ');
    const reason = e.short_reason.length > 60 ? e.short_reason.slice(0, 57) + '...' : e.short_reason;
    console.log(`  ${ts} | ${e.event_type} | ${e.agent} | ${e.result} | ${reason}`);
  }

  console.log(`\nTotal events: ${events.length}\n`);
  process.exit(0);
}

main();
