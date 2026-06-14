---
name: agentmetal
description: Rent your own VPS, paid with USDC over x402 — provision, renew, and tear down servers from inside Hermes.
tags: [vps, server, hosting, infrastructure, x402]
---

# AgentMetal (Hermes skill)

Give a Hermes agent its own 24/7 server. AgentMetal sells real Linux boxes you pay for in
USDC over x402 — no signup, no dashboard. Drop this file in `~/.hermes/skills/` and the
agent gains four verbs: **provision, status, extend (renew), destroy**.

**Base URL:** `https://api.agentmetal.dev` · **Network:** Base (`eip155:8453`) · **Asset:** USDC

## Plans

| plan | vCPU / RAM | USDC/day |
|------|-----------|----------|
| `nano`   | 2 / 2 GB | $0.40 |
| `small`  | 3 / 4 GB | $0.80 |
| `medium` | 4 / 8 GB | $1.60 |

Prepaid, 1–30 days, no refunds.

## The verbs

### Provision
```
POST /v1/servers   { "plan": "nano", "days": 7, "ssh_key": "ssh-ed25519 …" }
```
Unpaid → **HTTP 402** with `accepts[0]` payment requirements + a `resource`. Sign it with
your wallet, then resend with the base64 payment in an `X-PAYMENT` header → `201`
`{ id, ipv4, ssh, expires_at, renew }`.

### Status
```
GET /v1/servers/{id}   → { id, status, ipv4, expires_at }
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
`{ api_key: "am_live_…" }`. Use it as `Authorization: Bearer` to destroy or to manage a
fleet, and to unlock monthly card billing.

## Pointers

- Agent manual (every endpoint, the 402 flow, copy-paste curl): `https://api.agentmetal.dev/llms.txt`
- Prefer a programmatic integration? Use the `@agentmetal/mcp` MCP server (tools:
  `provision_server`, `extend_server`, …) — it holds the wallet and does the 402 signing.
