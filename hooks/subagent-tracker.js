#!/usr/bin/env node
// Claude Code passes hook event data as JSON on stdin. We use:
//   hook_event_name → 'SubagentStart' | 'SubagentStop'
//   agent_id        → unique key for this subagent run
//   agent_type      → human-readable type (e.g. "general-purpose", "Explore")
//   description     → short user-supplied description of the task
const fs = require('fs');
const os = require('os');
const path = require('path');

const dataPath = path.join(os.homedir(), '.claude', 'cc-subagents.json');
const TRUNC = 60;

let raw = '';
process.stdin.on('data', c => raw += c);
process.stdin.on('end', () => {
  let evt = {};
  try { evt = JSON.parse(raw); } catch (_) { return; }

  const event = evt.hook_event_name || '';
  const id = evt.agent_id || evt.task_id || evt.id || `${evt.agent_type || 'agent'}-${Date.now()}`;
  const type = evt.agent_type || 'agent';
  const desc = String(evt.description || '').slice(0, TRUNC);

  let data = { running: [], done: [] };
  try { data = JSON.parse(fs.readFileSync(dataPath, 'utf8')); } catch (_) {}
  data.running = data.running || [];
  data.done = data.done || [];

  if (event === 'SubagentStart') {
    if (!data.running.find(a => a.id === id)) {
      data.running.push({ id, type, desc, startMs: Date.now() });
    }
  } else if (event === 'SubagentStop') {
    const agent = data.running.find(a => a.id === id);
    if (agent) {
      data.running = data.running.filter(a => a.id !== id);
      data.done = data.done.filter(a => a.id !== id);
      data.done.unshift({ id, type: agent.type, desc: agent.desc, startMs: agent.startMs, stopMs: Date.now() });
      if (data.done.length > 10) data.done = data.done.slice(0, 10);
    }
  } else {
    return;
  }

  fs.writeFileSync(dataPath, JSON.stringify(data));
});
