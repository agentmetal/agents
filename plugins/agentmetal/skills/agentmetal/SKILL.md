---
name: agentmetal
description: Spin up, SSH into, run commands on, and tear down your own Linux servers from Claude — pay with USDC over x402 or card, no signup. Use when the user wants to rent a VPS or cloud instance, deploy something, run a command on a real machine, or give an agent its own box.
---

# AgentMetal for Claude

AgentMetal is a server provider an agent can drive end-to-end: **browse → pay →
provision → SSH in → run commands → manage → renew → destroy**. You rent real Linux VMs
(VPS / cloud instances) and pay in USDC over x402 — or a card — with **no human signup and
no API key needed to buy**. This is autonomous infrastructure: the agent buys its own
compute, then *configures and operates* the box, not just receives it.

The headline power: with a managed SSH key you can **run shell commands as root on the box**
(`exec_command`) — install packages, deploy code, host a service, configure anything —
without bringing your own key.

The recommended integration is the **AgentMetal MCP server** (`@agentmetal/mcp`, v0.2.0,
**11 tools**), which exposes the API as tools and handles the x402 payment signing for you.

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
        "AGENTMETAL_API_KEY": "am_live_…"       // optional, unlocks reboot/diagnostics/exec/destroy
      }
    }
  }
}
```

In Claude Code: `claude mcp add agentmetal -- node packages/mcp/src/index.ts` (then set the
env vars), or add the block above to `.mcp.json`.

## Tools (11)

| Tool | Pays USDC? | Use |
|---|---|---|
| `get_catalog` | — | free browse: plans, locations, add-on pricing — no payment/account |
| `provision_server` | ✅ | `{ plan: nano\|small\|medium, days: 1–30, ssh_key?, managed_key? }` → id, IPv4, SSH (set `managed_key: true` to have AgentMetal generate the keypair and return the private key **once**) |
| `get_server` | — | `{ id }` → status / IPv4 / expiry |
| `exec_command` | — | `{ id, command }` → run a shell command **as root** on the box, returns stdout/stderr (needs account key + ownership + a managed-key box) |
| `reboot_server` | — | `{ id }` → soft reboot (needs account key) |
| `server_logs` | — | `{ id }` → diagnostics: hypervisor status, console, metrics — no SSH needed (needs account key) |
| `extend_server` | ✅ | `{ id, days }` → renew the lease |
| `destroy_server` | — | `{ id }` → destroy (needs account key) |
| `claim_account` | — | `{ email }` → emails a one-time code |
| `verify_claim` | — | `{ email, code, wallet? }` → `am_live_…` account API key |
| `list_servers` | — | your fleet (needs account key) |

## Lifecycle, end to end

1. **Browse free** — `get_catalog` to see plans, locations, and add-on pricing. No payment, no account.
2. **Provision** — `provision_server { plan, days, managed_key: true }`. The 402 → pay (USDC or
   card) → running box with SSH in <60s. With `managed_key`, you get the private key back **once**
   so you can SSH in without bringing your own key.
3. **Run commands / SSH in** — `exec_command { id, command }` runs anything as root: install
   packages, deploy code, host a service, configure the box. Pair with an account key (claim by email).
4. **Add storage / bandwidth** — block storage at $0.01/GB/day (auto-mounted) and bandwidth at
   $2/TB beyond the 20 TB included (raw HTTP: `POST /v1/servers/{id}/storage {gb}` and `/bandwidth {tb}`).
5. **Manage** — `reboot_server`, `server_logs` (diagnostics without SSH), `list_servers`.
6. **Extend / destroy** — `extend_server` to renew the lease; `destroy_server` to tear it down early.

## Guidance

- The wallet must hold USDC on **Base** (`eip155:8453`). `AGENTMETAL_MAX_USDC` hard-caps
  any single payment; a 402 above the cap is refused before signing.
- Plans: `nano` $0.40/day, `small` $0.80/day, `medium` $1.60/day. Prepaid, no refunds.
  Add-ons: storage $0.01/GB/day, bandwidth $2/TB beyond 20 TB included.
- An **account** is optional but unlocks reboot, diagnostics, exec (run commands), destroy, and
  fleet management: `claim_account` → `verify_claim` (email OTP → `am_live_…` key).
- No wallet configured? The paid tools fail with a clear message; catalog/status/claim still work.
- Prefer raw HTTP? Everything is documented for agents at
  <https://api.agentmetal.dev/llms.txt>; each error envelope's `docs` field links there.
