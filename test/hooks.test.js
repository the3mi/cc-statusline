import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOOKS = path.resolve(__dirname, '..', 'hooks');

// Each hook writes into ~/.claude/<name>.json. We redirect HOME to a temp
// dir per test so we don't touch the real user state.
function withTempHome() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-statusline-test-'));
  fs.mkdirSync(path.join(dir, '.claude'), { recursive: true });
  return dir;
}

function runHook(name, payload, env = {}) {
  const home = env.HOME || withTempHome();
  const r = spawnSync('node', [path.join(HOOKS, name)], {
    input: typeof payload === 'string' ? payload : JSON.stringify(payload),
    encoding: 'utf8',
    env: { ...process.env, HOME: home },
  });
  return { home, code: r.status, err: r.stderr };
}

function readJson(home, name) {
  const p = path.join(home, '.claude', name);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

test('subagent-tracker — SubagentStart records type+desc, Stop moves to done', () => {
  const home = withTempHome();
  runHook('subagent-tracker.js', { hook_event_name: 'SubagentStart', agent_id: 'a1', agent_type: 'Explore', description: 'search hooks dir' }, { HOME: home });
  let s = readJson(home, 'cc-subagents.json');
  assert.equal(s.running.length, 1);
  assert.equal(s.running[0].id, 'a1');
  assert.equal(s.running[0].type, 'Explore');
  assert.equal(s.running[0].desc, 'search hooks dir');

  runHook('subagent-tracker.js', { hook_event_name: 'SubagentStop', agent_id: 'a1' }, { HOME: home });
  s = readJson(home, 'cc-subagents.json');
  assert.equal(s.running.length, 0);
  assert.equal(s.done.length, 1);
  assert.equal(s.done[0].id, 'a1');
  assert.equal(s.done[0].type, 'Explore');
  assert.equal(s.done[0].desc, 'search hooks dir');
});

test('subagent-tracker — Start dedups by agent_id', () => {
  const home = withTempHome();
  runHook('subagent-tracker.js', { hook_event_name: 'SubagentStart', agent_id: 'a1', agent_type: 'X' }, { HOME: home });
  runHook('subagent-tracker.js', { hook_event_name: 'SubagentStart', agent_id: 'a1', agent_type: 'X' }, { HOME: home });
  const s = readJson(home, 'cc-subagents.json');
  assert.equal(s.running.length, 1);
});

test('subagent-tracker — truncates long descriptions', () => {
  const home = withTempHome();
  const longDesc = 'a'.repeat(200);
  runHook('subagent-tracker.js', { hook_event_name: 'SubagentStart', agent_id: 'a1', agent_type: 'X', description: longDesc }, { HOME: home });
  const s = readJson(home, 'cc-subagents.json');
  assert.equal(s.running[0].desc.length, 60);
});

test('subagent-tracker — ignores unknown events', () => {
  const home = withTempHome();
  runHook('subagent-tracker.js', { hook_event_name: 'WeirdEvent', agent_id: 'a1' }, { HOME: home });
  const s = readJson(home, 'cc-subagents.json');
  assert.equal(s, null);
});

test('subagent-tracker — survives invalid JSON without crashing', () => {
  const home = withTempHome();
  const r = runHook('subagent-tracker.js', 'not json', { HOME: home });
  assert.equal(r.code, 0);
});

test('file-tracker — records tool_input.file_path', () => {
  const home = withTempHome();
  runHook('file-tracker.js', { hook_event_name: 'PostToolUse', tool_name: 'Write', tool_input: { file_path: '/foo/a.js' } }, { HOME: home });
  runHook('file-tracker.js', { hook_event_name: 'PostToolUse', tool_name: 'Edit',  tool_input: { file_path: '/foo/b.js' } }, { HOME: home });
  const data = readJson(home, 'cc-edited-files.json');
  assert.deepEqual(data, ['/foo/b.js', '/foo/a.js']);
});

test('file-tracker — moves repeated file to front (dedup)', () => {
  const home = withTempHome();
  runHook('file-tracker.js', { tool_input: { file_path: '/x' } }, { HOME: home });
  runHook('file-tracker.js', { tool_input: { file_path: '/y' } }, { HOME: home });
  runHook('file-tracker.js', { tool_input: { file_path: '/x' } }, { HOME: home });
  const data = readJson(home, 'cc-edited-files.json');
  assert.deepEqual(data, ['/x', '/y']);
});

test('file-tracker — caps history at 5 entries', () => {
  const home = withTempHome();
  for (let i = 0; i < 8; i++) {
    runHook('file-tracker.js', { tool_input: { file_path: `/f${i}` } }, { HOME: home });
  }
  const data = readJson(home, 'cc-edited-files.json');
  assert.equal(data.length, 5);
  assert.equal(data[0], '/f7');
});

test('file-tracker — no file path in payload is a no-op', () => {
  const home = withTempHome();
  runHook('file-tracker.js', { tool_input: {} }, { HOME: home });
  assert.equal(readJson(home, 'cc-edited-files.json'), null);
});

test('message-tracker — appends prompt and truncates content', () => {
  const home = withTempHome();
  const long = 'x'.repeat(500);
  runHook('message-tracker.js', { hook_event_name: 'UserPromptSubmit', prompt: long }, { HOME: home });
  const data = readJson(home, 'cc-messages.json');
  assert.equal(data.length, 1);
  assert.equal(data[0].role, 'user');
  assert.equal(data[0].content.length, 200);
  assert.equal(typeof data[0].ts, 'number');
});

test('message-tracker — caps history at 20 entries', () => {
  const home = withTempHome();
  for (let i = 0; i < 25; i++) {
    runHook('message-tracker.js', { prompt: `msg ${i}` }, { HOME: home });
  }
  const data = readJson(home, 'cc-messages.json');
  assert.equal(data.length, 20);
  // Last 20 entries kept (msg 5..24).
  assert.equal(data[0].content, 'msg 5');
  assert.equal(data[19].content, 'msg 24');
});

test('message-tracker — empty prompt is a no-op', () => {
  const home = withTempHome();
  runHook('message-tracker.js', { prompt: '' }, { HOME: home });
  assert.equal(readJson(home, 'cc-messages.json'), null);
});
