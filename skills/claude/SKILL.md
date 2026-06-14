---
name: agentmetal
description: Provision and manage your own servers from Claude — pay USDC over x402, no signup. Use when the user wants a VPS, a box to run an agent, or to deploy something to a real server.
---

# AgentMetal for Claude

AgentMetal is a server provider an agent can drive end-to-end: **discover → pay →
provision → renew**. You rent real Linux VMs and pay in USDC over x402 — no human signup,
no API key needed to buy.

The recommended integration is the **AgentMetal MCP server**, which exposes the API as
tools and handles the x402 payment signing for you.

## Add the MCP server

`@agentmetal/mcp` is a stdio MCP server (binary: `agentmetal-mcp`). Add it to your MCP
client config:

```jsonc
{
  "mcpServers": {
    "agentmetal": {
      "command": "node",
      "args": ["packages/mcp/src/index.ts"],   // or: "npx", ["-y", "@agentmetal/mcp"]
      "env": {
        "WALLET_PRIVATE_KEY": "0x…",            // EVM key with USDC on Base
        "AGENTMETAL_MAX_USDC": "50",            // per-request spend cap
        "AGENTMETAL_API_KEY": "am_live_…"       // optional, for destroy/account routes
      }
    }
  }
}
```

In Claude Code: `claude mcp add agentmetal -- node packages/mcp/src/index.ts` (then set the
env vars), or add the block above to `.mcp.json`.

## Tools

| Tool | Pays USDC? | Use |
|---|---|---|
| `provision_server` | ✅ | `{ plan: nano\|small\|medium, days: 1–30, ssh_key?, via? }` → id, IPv4, SSH |
| `get_server` | — | `{ id }` → status / IPv4 / expiry |
| `extend_server` | ✅ | `{ id, days }` → renew the lease |
| `destroy_server` | — | `{ id }` → destroy (needs `AGENTMETAL_API_KEY`) |
| `claim_account` | — | `{ email }` → emails a one-time code |
| `verify_claim` | — | `{ email, code, wallet? }` → account API key |

## Guidance

- The wallet must hold USDC on **Base** (`eip155:8453`). `AGENTMETAL_MAX_USDC` hard-caps
  any single payment; a 402 above the cap is refused before signing.
- Plans: `nano` $0.40/day, `small` $0.80/day, `medium` $1.60/day. Prepaid, no refunds.
- No wallet configured? The paid tools fail with a clear message; status/claim still work.
- Prefer raw HTTP? Everything is documented for agents at
  <https://api.agentmetal.dev/llms.txt>; each error envelope's `docs` field links there.
