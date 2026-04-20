# cc-statusline

A lightweight Claude Code statusline dashboard — shows session info, cost tracking, quota bars, subagent status, token speed, and more in your terminal.

## Features

- **Session info** — model name + effort level, cost (delta-tracked across compactions), duration
- **Quota bars** — 5h and 7d rate limit usage with color-coded progress bars
- **Repo/branch** — git owner/repo, branch name, dirty indicator
- **Directory** — current working directory
- **Subagent tracker** — concurrent subagent runs
- **MCP health** — server status monitoring (healthy/failed/needs_auth)
- **Compact count** — context compaction tracking
- **Edited files** — recently modified files
- **Token speed** — rolling average tokens/sec
- **Account email** — shows logged-in account (from ~/.claude.json)
- **Powerline mode** — beautiful separators (requires Nerd fonts)
- **Themes** — default, nord, catppuccin, dracula

## Configuration

All settings are in `lib/config.js`. Override via:

**Option 1: JSON config** — create `~/.claude/statusline-config.json`:
```json
{
  "theme": "catppuccin",
  "powerline": true,
  "tokenSpeedWindow": 30,
  "quotaBarLen": 6,
  "showAccount": true,
  "showCompact": true,
  "showSubagent": true,
  "showMcp": true,
  "showEditedFiles": true,
  "showDirty": true
}
```

**Option 2: Env vars:**
```bash
export CC_STATUSLINE_THEME=dracula
export CC_STATUSLINE_POWERLINE=false
```

## Themes

Available: `default`, `nord`, `catppuccin`, `dracula`

## Installation

```bash
git clone https://github.com/sammylin/cc-statusline ~/.cc-statusline
cp ~/.cc-statusline/statusline.js ~/.claude/statusline.js
cp ~/.cc-statusline/hooks/*.js ~/.claude/hooks/
cp -R ~/.cc-statusline/lib ~/.claude/lib
```

Then add to `~/.claude/settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node ~/.claude/statusline.js",
    "refreshInterval": 30
  },
  "hooks": {
    "SubagentStart": [{ "matcher": ".*", "hooks": [{ "type": "command", "command": "node ~/.claude/hooks/subagent-tracker.js" }] }],
    "SubagentStop": [{ "matcher": ".*", "hooks": [{ "type": "command", "command": "node ~/.claude/hooks/subagent-tracker.js" }] }],
    "PreCompact": [{ "matcher": ".*", "hooks": [{ "type": "command", "command": "node ~/.claude/hooks/compact-monitor.js" }] }],
    "PostToolUse": [{ "matcher": "Write|Edit", "hooks": [{ "type": "command", "command": "node ~/.claude/hooks/file-tracker.js" }] }],
    "UserPromptSubmit": [{ "hooks": [
      { "type": "command", "command": "node ~/.claude/hooks/message-tracker.js" }
    ]}]
  }
}
```

## Hooks

| Hook | Event | Purpose |
|------|-------|---------|
| `subagent-tracker.js` | SubagentStart/Stop | Track subagent runs |
| `compact-monitor.js` | PreCompact | Count compaction events |
| `file-tracker.js` | PostToolUse (Write/Edit) | Record recently edited files |
| `message-tracker.js` | UserPromptSubmit | Cache recent messages |

## License

MIT
