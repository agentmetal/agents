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
