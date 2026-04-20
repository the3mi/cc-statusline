// ─── Configuration ─────────────────────────────────────────────────────────
// All user-configurable values live here.
// Override by creating ~/.claude/statusline-config.json or by setting env vars.
import fs from 'fs';
import path from 'path';
import os from 'os';

export const DEFAULT_CONFIG = {
  theme: 'catppuccin',
  powerline: true,
  tokenSpeedWindow: 30,
  quotaBarLen: 6,
  showAccount: true,
  showCompact: true,
  showSubagent: true,
  showMcp: true,
  showEditedFiles: true,
  showDirty: true,
};

export function loadConfig() {
  const home = os.homedir();
  const configPath = path.join(home, '.claude', 'statusline-config.json');
  let userConfig = {};
  try { userConfig = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch (_) {}
  const envConfig = {};
  if (process.env.CC_STATUSLINE_THEME) envConfig.theme = process.env.CC_STATUSLINE_THEME;
  if (process.env.CC_STATUSLINE_POWERLINE === 'false') envConfig.powerline = false;
  if (process.env.CC_STATUSLINE_POWERLINE === 'true') envConfig.powerline = true;
  return { ...DEFAULT_CONFIG, ...userConfig, ...envConfig };
}
