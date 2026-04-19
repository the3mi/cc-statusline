#!/usr/bin/env node
const fs = require('fs');
const os = require('os');
const path = require('path');

const dataPath = path.join(os.homedir(), '.claude', 'cc-compacts.json');

let data = { count: 0 };
try { data = JSON.parse(fs.readFileSync(dataPath, 'utf8')); } catch (e) {}

data.count = (data.count || 0) + 1;

fs.writeFileSync(dataPath, JSON.stringify(data));
