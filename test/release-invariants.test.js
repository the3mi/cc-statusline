import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

test('version is in sync across all three manifest files', () => {
  const pkg = readJson('package.json').version;
  const plugin = readJson('.claude-plugin/plugin.json').version;
  const marketplace = readJson('.claude-plugin/marketplace.json').plugins[0].version;

  assert.equal(plugin, pkg, `.claude-plugin/plugin.json version (${plugin}) != package.json (${pkg})`);
  assert.equal(marketplace, pkg, `.claude-plugin/marketplace.json version (${marketplace}) != package.json (${pkg})`);
});

test('hooks.json uses ${CLAUDE_PLUGIN_ROOT}, never ~/.claude/hooks/', () => {
  const raw = fs.readFileSync(path.join(ROOT, 'hooks/hooks.json'), 'utf8');
  assert.ok(
    !raw.includes('~/.claude/hooks/'),
    'hooks/hooks.json must not reference ~/.claude/hooks/ — use ${CLAUDE_PLUGIN_ROOT}/hooks/ instead',
  );
});

test('every hook command in hooks.json resolves to an existing file', () => {
  const config = readJson('hooks/hooks.json');
  const commands = [];
  for (const entries of Object.values(config.hooks)) {
    for (const entry of entries) {
      for (const h of entry.hooks) commands.push(h.command);
    }
  }

  for (const cmd of commands) {
    const match = cmd.match(/\$\{CLAUDE_PLUGIN_ROOT\}(\/\S+\.js)/);
    assert.ok(match, `hook command missing \${CLAUDE_PLUGIN_ROOT}/...js: ${cmd}`);
    const rel = match[1].replace(/^\//, '');
    assert.ok(
      fs.existsSync(path.join(ROOT, rel)),
      `hook script does not exist: ${rel} (referenced by: ${cmd})`,
    );
  }
});
