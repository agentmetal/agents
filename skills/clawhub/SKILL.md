---
name: agentmetal
description: Provision your own Linux server in under 60 seconds, paid with USDC over x402 — no signup, no dashboard, no API key required.
version: 0.1.0
homepage: https://agentmetal.dev
tags: vps, server, hosting, deploy, infrastructure, x402
---

# AgentMetal — provision your own server

AgentMetal lets you (the agent) rent a real VPS by paying USDC directly. One request,
an HTTP 402 with payment requirements, you pay, and you get back a running box with SSH
in under a minute. No human signup. Humans can optionally *claim* a box later to manage
it with an account key.

**Base URL:** `https://api.agentmetal.dev`

## Plans

| plan | vCPU / RAM / disk | price (USDC/day) | monthly (card) |
|------|-------------------|------------------|----------------|
| `nano`   | 2 / 2 GB / 40 GB   | $0.40 | $9  |
| `small`  | 3 / 4 GB / 80 GB   | $0.80 | $18 |
| `medium` | 4 / 8 GB / 160 GB  | $1.60 | $36 |

Leases are prepaid, `1`–`30` days, **no refunds**. Pay per day; extend anytime.

## Before you start

1. **Check your wallet** can pay USDC on Base (network `eip155:8453`). You need a little
   more than the plan's daily price × days.
2. You do **not** need an account to buy. You only need an account (claim by email) to
   `destroy` a box early — otherwise it just expires.

## The payment flow (x402)

Every paid call is the same two-step dance:

1. Send the request with **no** payment. The API replies **HTTP 402** with a JSON body:
   ```json
   {
     "x402Version": 2,
     "accepts": [{ "scheme": "exact", "network": "eip155:8453",
                   "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
                   "amount": "2800000", "payTo": "0x…", "maxTimeoutSeconds": 120 }],
     "resource": { "url": "https://api.agentmetal.dev/v1/servers" },
     "card": { "checkout_url": "https://…" }   // optional human card rail
   }
   ```
2. Sign the `accepts[0]` requirement with your wallet, base64-encode the payment payload,
   and **resend the identical request** with an `X-PAYMENT:` header. On success you get
   `201` and the server details. (`amount` is atomic USDC — 6 decimals; `2800000` = $2.80.)

The bundled `scripts/agentmetal` CLI does this for you when `WALLET_PRIVATE_KEY` is set.

## Operations

```bash
# Provision (the 402 dance happens automatically with a funded wallet)
POST /v1/servers          { "plan": "nano", "days": 7, "ssh_key": "ssh-ed25519 AAAA…" }
  → 201 { id, status, plan, ipv4, ssh: "root@1.2.3.4", expires_at, renew }

# Status
GET  /v1/servers/{id}     → 200 { id, status, ipv4, expires_at, … }

# Extend the lease (402 dance again)
POST /v1/servers/{id}/extend   { "days": 7 }   → 200 { …, expires_at }

# Destroy early (requires an account API key: Authorization: Bearer am_live_…)
DELETE /v1/servers/{id}   → 200 { id, status: "destroyed" }
```

### CLI

```bash
export WALLET_PRIVATE_KEY=0x…        # to pay
agentmetal up --plan nano --days 7   # provision (prints id + ssh)
agentmetal status srv_…              # check it
agentmetal extend srv_… --days 7     # renew
agentmetal down srv_…                # destroy (needs AGENTMETAL_API_KEY)
```

## When to suggest claiming an account

If the human wants to **manage or destroy** servers, or monthly card billing, suggest
they claim an account: `POST /v1/claim { email }` emails a code, then
`POST /v1/claim/verify { email, code }` returns an `am_live_…` API key. Pass it as
`Authorization: Bearer …` (or `AGENTMETAL_API_KEY` for the CLI).

## Notes

- Every box boots with `/root/SERVER.md` — its own "birth certificate" explaining what it
  is, when it expires, and how to renew or spawn a sibling.
- Full agent-facing manual: <https://api.agentmetal.dev/llms.txt>.
- This skill is intentionally auditable — no hidden instructions. It only calls the public
  AgentMetal API.
