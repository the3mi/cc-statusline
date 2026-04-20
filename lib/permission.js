// ─── Read the current permission mode ──────────────────────────────────
// Two sources, in order:
//   1. The session JSONL transcript (i.transcript_path) — preferred, since
//      it reflects in-session mode changes (e.g. user pressing shift+tab).
//   2. The ancestor `claude` process's argv — fallback for brand-new
//      sessions where the transcript file doesn't exist yet but the user
//      launched with --dangerously-skip-permissions or --permission-mode.
import fs from 'fs';
import { spawnSync } from 'child_process';

const RX = /"permissionMode":"([^"]+)"/g;

export function getPermissionMode(transcriptPath) {
  return readFromTranscript(transcriptPath) || readFromProcessTree() || '';
}

function readFromTranscript(transcriptPath) {
  if (!transcriptPath) return '';
  let buf;
  try {
    const stat = fs.statSync(transcriptPath);
    if (stat.size === 0) return '';
    const fd = fs.openSync(transcriptPath, 'r');
    const want = Math.min(stat.size, 64 * 1024);
    buf = Buffer.alloc(want);
    fs.readSync(fd, buf, 0, want, stat.size - want);
    fs.closeSync(fd);
  } catch (_) { return ''; }
  const tail = buf.toString('utf8');
  let last = '';
  let m;
  while ((m = RX.exec(tail)) !== null) last = m[1];
  RX.lastIndex = 0;
  return last;
}

// Walk up to 6 levels of ancestor processes looking for one whose command
// line contains "claude". Parse permission flags out of its argv.
export function readFromProcessTree() {
  let pid = process.ppid;
  for (let i = 0; i < 6 && pid && pid !== 1; i++) {
    const cmd = psCommand(pid);
    if (!cmd) break;
    if (/(^|\/)claude(\s|$)/.test(cmd)) return parseModeFromArgv(cmd);
    pid = psParent(pid);
  }
  return '';
}

export function parseModeFromArgv(cmd) {
  if (/--dangerously-skip-permissions(?:\s|$)/.test(cmd)) return 'bypassPermissions';
  const m = cmd.match(/--permission-mode[=\s]+([A-Za-z]+)/);
  if (m) return m[1];
  return '';
}

function psCommand(pid) {
  try {
    const r = spawnSync('ps', ['-o', 'args=', '-p', String(pid)], { encoding: 'utf8', timeout: 1000 });
    return (r.stdout || '').trim();
  } catch (_) { return ''; }
}

function psParent(pid) {
  try {
    const r = spawnSync('ps', ['-o', 'ppid=', '-p', String(pid)], { encoding: 'utf8', timeout: 1000 });
    return parseInt((r.stdout || '').trim(), 10) || 0;
  } catch (_) { return 0; }
}
