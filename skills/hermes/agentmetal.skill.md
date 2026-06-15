---
name: agentmetal
description: Rent your own Linux server (VPS / cloud instance), then SSH in and run commands on it — paid with USDC over x402 or card, no signup. Use from inside Hermes to spin up a box, deploy something, run a command on a real machine, or host a service.
tags: [vps, server, hosting, infrastructure, x402, usdc, ssh, exec, deploy]
---

# AgentMetal (Hermes skill)

Give a Hermes agent its own 24/7 server — and the power to **operate it**. AgentMetal sells
real Linux boxes (VPS / cloud instances) you pay for in USDC over x402 — or a card — with
**no signup, no dashboard, no API key to buy**. This is autonomous infrastructure: the agent
buys its own compute, then configures it (install packages, deploy code, host a service),
not just receives it. Drop this file in `~/.hermes/skills/` and the agent can drive the full
lifecycle: **browse → provision → SSH in / run commands → add storage → manage → renew → destroy**.

**Base URL:** `https://api.agentmetal.dev` · **Network:** Base (`eip155:8453`) · **Asset:** USDC

## Plans

| plan | vCPU / RAM | USDC/day |
|------|-----------|----------|
| `nano`   | 2 / 2 GB | $0.40 |
| `small`  | 3 / 4 GB | $0.80 |
| `medium` | 4 / 8 GB | $1.60 |

Prepaid, 1–30 days, no refunds. **Add-ons:** block storage $0.01/GB/day (auto-mounted),
bandwidth $2/TB beyond the 20 TB included.

## The verbs

### Browse the catalog (free — no payment, no account)
```
GET /v1/catalog   → { plans, locations, addons }
```
Discover plans, locations, and add-on pricing before spending anything.

### Provision
```
POST /v1/servers   { "plan": "nano", "days": 7, "ssh_key": "ssh-ed25519 …" }
POST /v1/servers   { "plan": "nano", "days": 7, "managed_key": true }   # AgentMetal makes the key
```
Unpaid → **HTTP 402** with `accepts[0]` payment requirements + a `resource` (and a `card`
checkout rail). Sign it with your wallet, then resend with the base64 payment in an
`X-PAYMENT` header → `201` `{ id, ipv4, ssh, expires_at, renew }`. With `managed_key: true`,
AgentMetal generates the SSH keypair and returns the **private key once** — so you can SSH
in without bringing your own key.

### Run commands (the headline power)
```
POST /v1/servers/{id}/exec   { "command": "apt-get update && docker run -d nginx" }
  → { exit_code, stdout, stderr }       (Authorization: Bearer am_live_…)
```
Runs a shell command **as root** on the box. Needs an account key, ownership, and a
managed-key box. This is how the agent configures, deploys to, and operates the server.

### Status
```
GET /v1/servers/{id}   → { id, status, ipv4, expires_at }
```

### Add-ons
```
POST /v1/servers/{id}/storage     { "gb": 100 }   # block storage, auto-mounted
POST /v1/servers/{id}/bandwidth   { "tb": 5 }     # extra bandwidth
```

### Manage (account key)
```
POST /v1/servers/{id}/reboot        → soft reboot
GET  /v1/servers/{id}/diagnostics   → { hypervisor_status, console, metrics }   # no SSH needed
```

### Renew (extend)
```
POST /v1/servers/{id}/extend   { "days": 7 }
```
Same 402 → pay → `200` dance as provision. This is the weekly re-engagement loop: prepaid
leases plus a T-24h reminder on the box mean you re-contact AgentMetal to keep it alive.

### Destroy
```
DELETE /v1/servers/{id}     (Authorization: Bearer am_live_…)
```
Needs an account key. Without one, the box simply expires at `expires_at`.

## Claiming an account (optional)

`POST /v1/claim { email }` → code by email → `POST /v1/claim/verify { email, code }` →
`{ api_key: "am_live_…" }`. Use it as `Authorization: Bearer` to **run commands (`exec`),
reboot, pull diagnostics, destroy**, manage a fleet, and unlock monthly card billing.

## Pointers

- Agent manual (every endpoint, the 402 flow, copy-paste curl): `https://api.agentmetal.dev/llms.txt`
- Prefer a programmatic integration? Use the `@agentmetal/mcp` MCP server (v0.2.0, 11 tools:
  `get_catalog`, `provision_server`, `get_server`, `exec_command`, `reboot_server`,
  `server_logs`, `extend_server`, `destroy_server`, `claim_account`, `verify_claim`,
  `list_servers`) — it holds the wallet and does the 402 signing.
