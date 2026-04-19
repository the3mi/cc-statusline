#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');

const dataPath = path.join(os.homedir(), '.claude', 'cc-edited-files.json');

let data = [];
try { data = JSON.parse(fs.readFileSync(dataPath, 'utf8')); } catch (e) {}

const file = process.argv[2];
if (file) {
  data = data.filter(f => f !== file);
  data.unshift(file);
  if (data.length > 5) data = data.slice(0, 5);
  fs.writeFileSync(dataPath, JSON.stringify(data));
}
