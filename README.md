# CenDTrus Remit — Stellar Settlement Rail

> **"We are the Pipe, not the Water."**
>
> 100% non-custodial cross-border remittance infrastructure.
> We orchestrate settlement. We never hold capital.

---

## APAC Stellar Hackathon 2026

**Submission:** CenDTrus Remit · Stellar Rail 03
**Track:** Cross-Border Remittance / Financial Apps & Payment Solutions
**Team:** CenDTrus Remit Philippines · Legazpi City, Bicol Region, Philippines
**Prize Pool:** Up to $60,000 USD · Supported by Rise In & Stellar Development Foundation

> ✅ All transactions in this submission are **live on Stellar Testnet** with real verifiable on-chain hashes queryable at [stellar.expert/explorer/testnet](https://stellar.expert/explorer/testnet)

---

## What Is CenDTrus Remit?

CenDTrus Remit is the **SME and mid-market-facing settlement tier** of the CenTrus two-product fintech architecture. Where CenTrus Sovereign handles institutional wholesale settlements at high volume using **Circle's USDC Arc Network**, CenDTrus Remit serves the day-to-day corridor needs of businesses, MTOs, and fintech platforms moving money across borders.

This repository is the **Stellar connector** — the high-assurance rail that provides sub-5-second, non-custodial settlement using **native XLM** and **USDC** on the Stellar network.

**One API. Global settlement. Infinite corridors.**

---

## Live Demo — What's Real Right Now

| Component | Status |
|---|---|
| Stellar Testnet account balances via Horizon | ✅ Live |
| 10-packet atomic slice submitted to real Horizon | ✅ Live |
| Real Stellar tx hashes per packet | ✅ Live |
| Freighter wallet as recipient | ✅ Live |
| Pipeline telemetry (TPS, finality, volume) | ✅ Live |
| Sovereign Shield slippage monitor | ✅ Live |
| Symphony HITL compliance queue | ✅ Live |
| Institutional unsigned XDR builder | ✅ Live |
| Qubic Quorum audit attestation | ✅ Simulated (Qubic testnet) |

---

## The Non-Custodial Thesis: Pipe, Not Water

Traditional remittance systems are custodians. They hold your money, even briefly, while routing it through correspondent banks, FX desks, and settlement queues. CenDTrus Remit rejects this model entirely.

```
Traditional Flow:   Sender → Custodian (holds funds) → Recipient
CenDTrus Flow:      Sender → Stellar Payment → Recipient
                             ↑ We orchestrate this. Nothing more.
```

Every transaction is a **direct on-chain payment**. Assets move from sender to recipient in a single atomic operation. CenDTrus Remit never touches the capital.

**Non-custodial — not just for the money, but for the judgment.**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     CenTrus Two-Product Stack                   │
│                                                                 │
│  ┌──────────────────────────┐  ┌──────────────────────────┐    │
│  │   CenTrus Sovereign      │  │   CenDTrus Remit         │    │
│  │   (Institutional Tier)   │  │   (SME & Mid-Market)     │    │
│  │                          │  │                          │    │
│  │  Rail 01: Circle Arc     │  │  Rail 03: Stellar ◄──── THIS  │
│  │  Rail 02: Circle USDC    │  │                          │    │
│  │                          │  │                          │    │
│  │  High-volume & Tier-1    │  │  No hard limit —         │    │
│  │  Qubic: MANDATORY        │  │  liquidity routed        │    │
│  │                          │  │  Qubic: BEST-EFFORT      │    │
│  └──────────────────────────┘  └──────────────────────────┘    │
│                                                                 │
│              ┌─────────────────────────┐                        │
│              │   Haskell Conductor     │                        │
│              │   (Off-Chain Brain)     │                        │
│              │                         │                        │
│              │  • Z3 SMT Prover        │                        │
│              │  • Sovereign Shield     │                        │
│              │  • Rail Selector        │                        │
│              │  • Aigarth AI Engine    │                        │
│              └─────────────────────────┘                        │
│                                                                 │
│  Auto-routing: Substantial volumes escalate from               │
│  CenDTrus Remit → CenTrus Sovereign seamlessly.                │
│  The client never sees the switch.                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## This Repository: `stellar-rail/`

```
stellar-rail/
│
├── package.json              # Dependencies: Vue 3, Vite, Stellar SDK v12+
├── vite.config.ts            # Vite dev server with /api proxy
├── tailwind.config.js        # Custom CenTrus palette (navy, mint, emerald)
├── tsconfig.json             # TypeScript configuration
├── postcss.config.js         # Autoprefixer + Tailwind
├── index.html                # HTML entry point / Landing page
│
├── server.ts                 # Express adapter — all /api/* endpoints
│
├── services/
│   └── StellarAdapter.ts     # @stellar/stellar-sdk v12+ wrapper
│
├── scripts/
│   └── setup-trustlines.ts   # One-time USDC trustline setup
│
└── src/
    ├── main.ts               # Vue 3 app entry
    ├── App.vue               # Root shell + sidebar navigation
    ├── style.css             # Tailwind base + custom utilities
    │
    ├── components/
    │   ├── CenDTrusDashboard.vue   # Master dashboard (5 panels + wallet)
    │   ├── TransactionHistory.vue  # Settlement ledger + real tx hashes
    │   └── CorridorPanel.vue       # APAC corridor management
    │
    └── repositories/
        └── StellarRepository.ts    # Typed API client — all /api/* calls
```

---

## The Five Dashboard Panels

### 1. Live Wallet — Freighter Testnet
Displays real-time XLM and USDC balances for the connected Freighter account, fetched directly from Stellar Horizon. Balance refreshes automatically after each atomic settlement completes.

### 2. Real-Time Pipeline Status
Live operational telemetry for **Stellar Rail 03** (primary) and a read-only visibility layer for the **CenTrus Sovereign institutional tier**. Displays finality times, TPS, queue depth, and 24-hour settlement volume — refreshing every 5 seconds from the Express backend.

### 3. Sovereign Shield — Slippage Monitor
The **Sovereign Shield** enforces a strict **1 basis point (0.01%) slippage ceiling** on all transactions. The shield queries the Stellar DEX order book in real time and projects slippage for the pending transaction size.

| Status | Meaning |
|---|---|
| 🟢 SECURE | Slippage well inside ceiling. Auto-proceed. |
| 🟡 WARN | Within 25% of ceiling. Monitoring frequency doubles. |
| 🔴 BREACH | Ceiling exceeded. Transaction HALTED. HITL triggered. |

### 4. Atomic Slicing Terminal ← Core Innovation
Every remittance is **sliced into 10 independent atomic micro-packets**. Each packet is a real Stellar payment transaction submitted to Horizon individually. Watch them settle live — each packet produces a real on-chain hash, clickable directly to Stellar Expert.

```
$1 Remittance → [PKT-01: 0.1 XLM] [PKT-02: 0.1 XLM] ... [PKT-10: 0.1 XLM]
                      ↓                   ↓                      ↓
               Stellar Testnet     Stellar Testnet        Stellar Testnet
               TX: a0e95807...     TX: 424b92ac...        TX: d0bd8333...
```

### 5. Symphony HITL — Multi-Agent Compliance Review
When the Sovereign Shield triggers, transactions enter the **Symphony Human-in-the-Loop** queue. The decision escalates directly to the **client's own compliance officer** — not to CenDTrus.

| Agent | Role |
|---|---|
| **Aigarth** | Liquidity and market risk assessment |
| **Gemini** | Regulatory compliance review (FATF R.16, AML) |
| **Symphony** | HITL coordinator — synthesizes verdict, routes to client |

The client's authorized reviewer makes the final APPROVE / REJECT decision. We surface the intelligence. They make the call.

---

## Novelty Statement

Most hackathon remittance demos submit a single transaction. CenDTrus Remit introduces **atomic transaction slicing** — every payment is decomposed into 10 parallel micro-packets, each producing a real verifiable on-chain Stellar hash.

The **Sovereign Shield** adds a compliance circuit breaker that monitors the Stellar DEX order book in real time and automatically escalates to the client's human reviewer if slippage breaches 1 basis point. No other submission in the cross-border track combines atomic micro-settlement with a real-time slippage circuit breaker and a live client-controlled HITL override mechanism in a single unified pipeline.

The architecture is **non-custodial by design** — the server never holds keys beyond the duration of a single transaction envelope. The Stellar blockchain is the source of truth.

The **Institutional XDR Builder** extends this non-custodial guarantee to enterprise clients: corporate operators (MTOs, banks, payment processors) can build a fully-formed `PathPaymentStrictReceive` transaction envelope server-side and receive an unsigned XDR string — ready for signing inside their own enterprise HSM or cloud KMS vault. CenDTrus never sees a private key.

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm 9+
- A Freighter wallet browser extension (https://freighter.app) set to Testnet
- A Stellar Testnet account funded via [Friendbot](https://friendbot.stellar.org)

### Installation

```bash
git clone https://github.com/psyluck/stellar_rail.git
cd stellar-rail
npm install
```

### Configure Environment

Create `.env` in the project root:

```env
STELLAR_NETWORK=TESTNET
HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_PUBLIC_KEY=G...your_freighter_public_key...
STELLAR_DEMO_SECRET=S...fresh_testnet_only_keypair...
PORT=3001
ALLOWED_ORIGIN=http://localhost:5173

# Institutional XDR builder settings
STELLAR_BASE_FEE=100
STELLAR_TX_TIMEOUT_S=180
```

### Fund the Demo Keypair

```bash
curl "https://friendbot.stellar.org/?addr=YOUR_DEMO_PUBLIC_KEY"
```

### Set Up Trustlines

```bash
npx tsx scripts/setup-trustlines.ts
```

### Run

```bash
# Terminal 1 — Backend
npx tsx server.ts

# Terminal 2 — Frontend
npm run dev
```

Open `http://localhost:5173` — the dashboard loads with live Horizon data immediately.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Server health check |
| GET | `/api/balances?account=G...` | Live Stellar account balances |
| GET | `/api/pipeline-status` | Rail operational telemetry |
| GET | `/api/slippage?amount=N&corridor=PHP-USD` | Sovereign Shield slippage reading |
| POST | `/api/tx/atomic-slice` | Submit 10-packet atomic transaction |
| GET | `/api/tx/:id/status` | Poll transaction status |
| POST | `/api/qubic-audit` | Request Qubic external audit proof |
| GET | `/api/hitl/queue` | Fetch HITL compliance queue |
| POST | `/api/hitl/:id/resolve` | Submit human reviewer decision |
| POST | `/api/institutional/build-xdr` | Build unsigned `PathPaymentStrictReceive` XDR for client-side HSM/KMS signing |

### Institutional XDR Builder — Request Body

`POST /api/institutional/build-xdr`

```json
{
  "sourcePublicKey":      "G... (corporate sender account)",
  "destinationPublicKey": "G... (beneficiary / destination anchor)",
  "sendAssetCode":        "USDC",
  "sendAssetIssuer":      "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
  "destAssetCode":        "USDC",
  "destAssetIssuer":      "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
  "destAmount":           "500.00",
  "sendMax":              "502.50",
  "memo":                 "CTR-PHP-USD-001"
}
```

### Institutional XDR Builder — Response

```json
{
  "unsignedXdr": "AAAAAgAAAAA...",
  "sequence": "1234567890123456",
  "operationSummary": {
    "type": "PathPaymentStrictReceive",
    "sendAsset": "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    "destAsset": "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    "destAmount": "500.0000000",
    "sendMax": "502.5000000",
    "sourcePublicKey": "G...",
    "destinationPublicKey": "G...",
    "network": "Stellar Testnet"
  },
  "builtAt": "2026-08-15T13:00:00.000Z",
  "notice": "This XDR is unsigned. Sign it with your enterprise HSM or cloud KMS and submit to Stellar Horizon POST /transactions. CenDTrus never holds or transmits private keys."
}
```

> The client signs `unsignedXdr` locally using their own key management infrastructure and submits directly to Horizon. CenDTrus is never in the signing path.

---

## Asset Support

| Asset | Issuer | Network | Status |
|---|---|---|---|
| **XLM** | Stellar Network (native) | Stellar | ✅ Live on Testnet |
| **USDC** | Circle (native Stellar issuance) | Stellar | ✅ Trustline set |

---

## Corridors

| Region | From | To | Asset | Status |
|---|---|---|---|---|
| APAC | PHP | USD | XLM | ✅ Live on Testnet |
| APAC | PHP | SGD | XLM → USDC | 🔲 Coming Soon |
| APAC | PHP | AED | XLM → USDC | 🔲 Planned |
| APAC | PHP | JPY | XLM → USDC | 🔲 Planned |
| US/EUR | USD | EUR | USDC | 🔲 Planned |
| US/EUR | GBP | USD | USDC | 🔲 Planned |
| MENA | USD | SAR | USDC | 🔲 Roadmap |

**One API. Global settlement. Infinite corridors.**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3, TypeScript, Tailwind CSS, Vite |
| Backend | Node.js, Express, TypeScript, tsx |
| Stellar SDK | @stellar/stellar-sdk v12.3.0 |
| Settlement Assets | XLM (native) · USDC (Circle, native Stellar) |
| Wallet | Freighter (Stellar browser extension) |
| Network | Stellar Testnet (Horizon) |
| Runtime | Node.js v24 |

---

## Changelog

### August 2026

**`server.ts`**
- Added `POST /api/institutional/build-xdr` — stateless unsigned `PathPaymentStrictReceive` XDR builder for institutional clients operating their own HSM or cloud KMS signing infrastructure
- Added `BuildXdrRequest` and `BuildXdrResponse` TypeScript interfaces
- Added `STELLAR_BASE_FEE` and `STELLAR_TX_TIMEOUT_S` environment variable support
- Removed all Ripple ODL / RLUSD references — CenDTrus Remit is Stellar + Circle USDC exclusively

**`services/StellarAdapter.ts`**
- Added public `loadAccount(publicKey)` method exposing `Horizon.AccountResponse` for external XDR construction without custody of private keys
- Fixed `Networks.MAINNET` → `Networks.PUBLIC` — breaking rename in `@stellar/stellar-base` v12.3.0

---

## Roadmap

- [ ] Freighter in-browser client-side signing flow
- [ ] Redis transaction store (replace in-memory Map)
- [ ] Postgres append-only audit ledger
- [ ] Parallel packet submission (true concurrent settlement)
- [ ] Real USDC via Circle testnet faucet
- [ ] Haskell Conductor gRPC event bus integration
- [ ] Real Qubic Quorum API attestation calls
- [ ] Mainnet deployment with real liquidity pools
- [ ] APAC, US/EUR, and MENA corridor expansion

---

## License

MIT © 2026 CenDTrus Remit Philippines. All rights reserved.

---

*Built for the **APAC Stellar Hackathon 2026** · Rise In & Stellar Development Foundation*
*CenDTrus Remit Philippines · Legazpi City, Bicol Region, Philippines*
*"We are the Pipe, not the Water."*
