#!/usr/bin/env node
// UserPromptSubmit hook. Records the user's prompt (truncated) so the
// statusline / consumers can show recent message context.
const fs = require('fs');
const os = require('os');
const path = require('path');

const dataPath = path.join(os.homedir(), '.claude', 'cc-messages.json');
const MAX = 20;
const TRUNC = 200;

let raw = '';
process.stdin.on('data', c => raw += c);
process.stdin.on('end', () => {
  let evt = {};
  try { evt = JSON.parse(raw); } catch (_) { return; }

  const prompt = evt.prompt || evt.message || evt.user_message || '';
  if (!prompt) return;

  let data = [];
  try { data = JSON.parse(fs.readFileSync(dataPath, 'utf8')); } catch (_) {}
  if (!Array.isArray(data)) data = [];

  data.push({ role: 'user', content: String(prompt).slice(0, TRUNC), ts: Date.now() });
  if (data.length > MAX) data = data.slice(-MAX);

  fs.writeFileSync(dataPath, JSON.stringify(data));
});
