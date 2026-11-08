import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p: string) => readFileSync(join(root, p), 'utf8');

test('clawhub SKILL.md has frontmatter name + provision instructions + the 402 step', () => {
  const s = read('clawhub/SKILL.md');
  assert.match(s, /^---[\s\S]*name:\s*agentmetal/m);
  assert.match(s, /tags:.*\b(vps|server|hosting)\b/);
  assert.ok(s.includes('POST /v1/servers'), 'documents the provision endpoint');
  assert.ok(s.includes('402'), 'teaches the 402 payment step');
  assert.ok(s.includes('X-PAYMENT'), 'names the payment header');
});

test('clawhub ships an executable agentmetal CLI stub', () => {
  const cli = read('clawhub/scripts/agentmetal');
  assert.match(cli, /^#!/, 'has a shebang');
  for (const verb of ['up', 'status', 'extend', 'down']) {
    assert.ok(cli.includes(verb), `CLI knows the "${verb}" verb`);
  }
});

test('hermes skill references the renew/extend flow', () => {
  const s = read('hermes/agentmetal.skill.md');
  assert.ok(s.includes('/extend'), 'documents extend');
  assert.ok(s.includes('402'), 'teaches the payment step');
});

test('claude skill points at the MCP server', () => {
  const s = read('claude/SKILL.md');
  assert.match(s, /mcp/i);
  assert.ok(s.includes('@agentmetal/mcp') || s.includes('agentmetal-mcp'), 'names the MCP package/binary');
});

// The setup block is what an agent copies. A path that only exists in our checkout
// (`node packages/mcp/src/index.ts`) fails for everyone else, which is the bug that shipped.
test('claude skill and plugin skill install from npm and stay identical', () => {
  const skill = read('claude/SKILL.md');
  const plugin = read('../plugins/agentmetal/skills/agentmetal/SKILL.md');
  for (const [name, s] of [['skills/claude', skill], ['plugin', plugin]] as const) {
    assert.ok(!s.includes('packages/mcp/src'), `${name} SKILL.md points at a repo-only path`);
    assert.ok(s.includes('npx -y @agentmetal/mcp') || s.includes('"-y", "@agentmetal/mcp"'), `${name} SKILL.md installs from npm`);
  }
  assert.equal(plugin, skill, 'plugins/agentmetal/skills/agentmetal/SKILL.md drifted from skills/claude/SKILL.md');
});
