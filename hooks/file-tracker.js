#!/usr/bin/env node
// PostToolUse hook for Write/Edit. The tool's target file path lives in
// evt.tool_input.file_path (Write/Edit/MultiEdit) or evt.tool_input.path.
const fs = require('fs');
const os = require('os');
const path = require('path');

const dataPath = path.join(os.homedir(), '.claude', 'cc-edited-files.json');
const MAX = 5;

let raw = '';
process.stdin.on('data', c => raw += c);
process.stdin.on('end', () => {
  let evt = {};
  try { evt = JSON.parse(raw); } catch (_) { return; }

  const file = evt?.tool_input?.file_path || evt?.tool_input?.path || evt?.tool_input?.notebook_path;
  if (!file) return;

  let data = [];
  try { data = JSON.parse(fs.readFileSync(dataPath, 'utf8')); } catch (_) {}
  if (!Array.isArray(data)) data = [];

  data = data.filter(f => f !== file);
  data.unshift(file);
  if (data.length > MAX) data = data.slice(0, MAX);

  fs.writeFileSync(dataPath, JSON.stringify(data));
});
