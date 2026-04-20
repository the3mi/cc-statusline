#!/usr/bin/env node
// Refresh ~/.claude/mcp-status-cache.json by running `claude mcp list`.
// Designed to be invoked in the background by statusline.js (and also wired
// as a SessionStart / UserPromptSubmit hook for deterministic refresh).
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CACHE = path.join(os.homedir(), '.claude', 'mcp-status-cache.json');
const STALE_MS = 90 * 1000;

const atomicWrite = (f, data) => {
  const tmp = `${f}.${process.pid}.${Date.now()}.tmp`;
  try { fs.writeFileSync(tmp, data); fs.renameSync(tmp, f); }
  catch (e) { try { fs.unlinkSync(tmp); } catch (_) {} }
};

// Skip if cache is still fresh.
try {
  const stat = fs.statSync(CACHE);
  if (Date.now() - stat.mtimeMs < STALE_MS) process.exit(0);
} catch (e) {}

function findClaude() {
  const candidates = [
    path.join(os.homedir(), '.local', 'bin', 'claude'),
    path.join(os.homedir(), '.claude', 'local', 'claude'),
    '/usr/local/bin/claude',
    '/opt/homebrew/bin/claude',
  ];
  for (const c of candidates) { try { if (fs.existsSync(c)) return c; } catch (e) {} }
  return null;
}

const targetCwd = process.argv[2] && fs.existsSync(process.argv[2]) ? process.argv[2] : os.homedir();
const opts = { encoding: 'utf8', timeout: 15000, cwd: targetCwd, windowsHide: true };
const bin = findClaude();
const r = bin
  ? spawnSync(bin, ['mcp', 'list'], opts)
  : spawnSync(process.platform === 'win32' ? 'claude.cmd' : 'claude', ['mcp', 'list'], { ...opts, shell: true });

const out = (r.stdout || '') + (r.stderr || '');
if (!out.trim()) process.exit(0);

const servers = [];
for (const raw of out.split('\n')) {
  const line = raw.trim();
  if (!line || /^Checking/i.test(line)) continue;
  // Lines look like: "name: details - <status>"
  // Split on the LAST " - " so server names containing ":" or "-" still parse.
  const sepIdx = line.lastIndexOf(' - ');
  if (sepIdx < 0) continue;
  const left = line.slice(0, sepIdx);
  const statusRaw = line.slice(sepIdx + 3).trim().toLowerCase();
  const colonIdx = left.indexOf(': ');
  if (colonIdx < 0) continue;
  const name = left.slice(0, colonIdx).trim();

  let status = 'unknown';
  if (/auth|sign[- ]?in|login/.test(statusRaw)) status = 'needs_auth';
  else if (/fail|error|disconnect|✗|x$/.test(statusRaw)) status = 'failed';
  else if (/ok|connected|ready|✓|healthy/.test(statusRaw)) status = 'ok';

  servers.push({ name, status });
}

atomicWrite(CACHE, JSON.stringify({ servers, refreshedAt: Date.now() }));
