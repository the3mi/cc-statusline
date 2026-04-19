#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');

const dataPath = path.join(os.homedir(), '.claude', 'cc-subagents.json');

let data = { running: [], done: [] };
try { data = JSON.parse(fs.readFileSync(dataPath, 'utf8')); } catch (e) {}

const name = process.argv[2] || 'agent';
const event = process.argv[3] || process.env.CLAUDE_EVENT || '';

if (event === 'SubagentStart' || (process.argv.includes('start'))) {
  const now = Date.now();
  // Remove from done if re-running
  data.done = data.done.filter(a => a.name !== name);
  // Add to running if not already
  if (!data.running.find(a => a.name === name)) {
    data.running.push({ name, startMs: now });
  }
} else if (event === 'SubagentStop' || (process.argv.includes('stop'))) {
  const now = Date.now();
  // Move from running to done
  const agent = data.running.find(a => a.name === name);
  if (agent) {
    data.running = data.running.filter(a => a.name !== name);
    data.done = data.done.filter(a => a.name !== name); // dedup done
    data.done.unshift({ name, startMs: agent.startMs, stopMs: now });
    if (data.done.length > 10) data.done = data.done.slice(0, 10);
  }
}

fs.writeFileSync(dataPath, JSON.stringify(data));
