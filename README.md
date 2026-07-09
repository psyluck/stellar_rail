# CenDTrus Remit — Stellar Settlement Rail

> **"We are the Pipe, not the Water."**
>
> 100% non-custodial cross-border remittance infrastructure.
> We orchestrate settlement. We never hold capital.

---

## APAC Stellar Hackathon 2026

**Submission:** CenDTrus Remit · Stellar Rail 03
**Track:** Cross-Border Remittance / Financial Apps & Payment Solutions
**Team:** CenTrus Inc. · Legazpi City, Bicol Region, Philippines
**Prize Pool:** Up to $60,000 USD · Supported by Rise In & Stellar Development Foundation

> ✅ All transactions in this submission are **live on Stellar Testnet** with real verifiable on-chain hashes queryable at [stellar.expert/explorer/testnet](https://stellar.expert/explorer/testnet)

---

## What Is CenDTrus Remit?

CenDTrus Remit is the **retail and SME-facing settlement tier** of the CenTrus two-product fintech architecture. Where CenTrus Sovereign handles institutional wholesale settlements in the $50M–$1B+ range using Circle Arc and Ripple ODL rails, CenDTrus Remit serves the day-to-day corridor needs of individuals, families, and small businesses moving money across borders — from $100 to $25,000 per transaction.

This repository is the **Stellar connector** — the high-assurance rail that provides sub-3-second, non-custodial settlement using **native USDC** and **XLM** on the Stellar network.

The Philippines remittance corridor is our primary focus. OFWs and Filipino families sending money home deserve sub-3-second finality, not 3-day SWIFT delays.

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
| Qubic Quorum audit attestation | ✅ Simulated (Qubic testnet) |

---

## The Non-Custodial Thesis: Pipe, Not Water

Traditional remittance systems are custodians. They hold your money, even briefly, while routing it through correspondent banks, FX desks, and settlement queues. CenDTrus Remit rejects this model entirely.

```
Traditional Flow:   Sender → Custodian (holds funds) → Recipient
CenDTrus Flow:      Sender → Stellar Payment → Recipient
                             ↑ We orchestrate this. Nothing more.
```

Every transaction is a **direct on-chain payment**. The server signs and submits on behalf of the demo keypair. Assets move from sender wallet to recipient wallet in a single atomic operation. CenTrus never touches the capital.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     CenTrus Two-Product Stack                   │
│                                                                 │
│  ┌──────────────────────────┐  ┌──────────────────────────┐    │
│  │   CenTrus Sovereign      │  │   CenDTrus Remit         │    │
│  │   (Institutional Tier)   │  │   (Retail/SME Tier)      │    │
│  │                          │  │                          │    │
│  │  Rail 01: Ripple ODL     │  │  Rail 03: Stellar ◄──── THIS  │
│  │  Rail 02: Circle Arc     │  │  Rail 04: Morph L2       │    │
│  │                          │  │                          │    │
│  │  $50M – $1B+ per tx      │  │  $100 – $25K per tx      │    │
│  │  Qubic: MANDATORY        │  │  Qubic: BEST-EFFORT      │    │
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
├── index.html                # HTML entry point
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
    ├── App.vue               # Root shell (nav bar, layout, epoch ticker)
    ├── style.css             # Tailwind base + custom utilities
    │
    ├── components/
    │   └── CenDTrusDashboard.vue  # Master dashboard (4 panels + wallet)
    │
    └── repositories/
        └── StellarRepository.ts   # Typed API client — all /api/* calls
```

---

## The Four Dashboard Panels

### 1. Live Wallet — Freighter Testnet
Displays real-time XLM and USDC balances for the connected Freighter account, fetched directly from Stellar Horizon. Balance refreshes automatically after each atomic settlement completes.

### 2. Real-Time Pipeline Status
Live operational telemetry for both the **Stellar Rail 03** (primary) and a read-only view of **Ripple ODL Rail 01** (Sovereign-tier, for context). Displays finality times, TPS, queue depth, and 24-hour settlement volume — refreshing every 5 seconds from the Express backend.

### 3. Sovereign Shield — Aigarth Slippage Monitor
The **Sovereign Shield** enforces a strict **1 basis point (0.01%) slippage ceiling** on all transactions. Aigarth queries the Stellar DEX order book in real time and projects slippage for the pending transaction size.

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
When the Sovereign Shield triggers, transactions enter the **Symphony Human-in-the-Loop** queue. Three AI agents deliberate:

| Agent | Role |
|---|---|
| **Aigarth** | Liquidity and market risk assessment |
| **Gemini** | Regulatory compliance review (FATF R.16, AML) |
| **Symphony** | HITL coordinator — synthesizes verdict, routes to human |

A human operator reviews the AI debate transcript and makes the final APPROVE / REJECT decision.

---

## Novelty Statement

Most hackathon remittance demos submit a single transaction. CenDTrus Remit introduces **atomic transaction slicing** — every payment is decomposed into 10 parallel micro-packets, each producing a real verifiable on-chain Stellar hash.

The **Sovereign Shield** adds an AI-gated compliance layer that monitors the Stellar DEX order book in real time and automatically escalates to a human reviewer if slippage breaches 1 basis point. No other submission in the cross-border track combines atomic micro-settlement with an AI-gated compliance layer and a live HITL override mechanism in a single unified pipeline.

The architecture is **non-custodial by design** — the server never holds keys beyond the duration of a single transaction envelope. The Stellar blockchain is the source of truth.

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm 9+
- A Freighter wallet browser extension (https://freighter.app) set to Testnet
- A Stellar Testnet account funded via [Friendbot](https://friendbot.stellar.org)

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/stellar-rail.git
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

---

## Asset Support

| Asset | Issuer | Status |
|---|---|---|
| **XLM** | Stellar Network (native) | ✅ Live on Testnet |
| **USDC** | Circle (native Stellar issuance) | ✅ Trustline set |
| **RLUSD** | Ripple | 🔲 Mainnet only (no active testnet issuer) |

---

## Corridors

| From | To | Asset | Status |
|---|---|---|---|
| PHP | USD | XLM | ✅ Live on Testnet |
| PHP | SGD | XLM → USDC | 🔲 Planned |
| PHP | AED | XLM → USDC | 🔲 Planned |
| PHP | JPY | XLM → USDC | 🔲 Planned |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3, TypeScript, Tailwind CSS, Vite |
| Backend | Node.js, Express, TypeScript, tsx |
| Stellar SDK | @stellar/stellar-sdk v12+ |
| Wallet | Freighter (Stellar browser extension) |
| Network | Stellar Testnet (Horizon) |
| Runtime | Node.js v24 |

---

## Roadmap

- [ ] Freighter in-browser signing flow (client-side key management)
- [ ] Redis transaction store (replace in-memory Map)
- [ ] Postgres append-only audit ledger
- [ ] Parallel packet submission (true concurrent settlement)
- [ ] Real USDC funding via Circle testnet faucet
- [ ] Haskell Conductor gRPC event bus integration
- [ ] Real Qubic Quorum API attestation calls
- [ ] Morph L2 Rail 04 fallback activation
- [ ] Mainnet deployment with real liquidity pools

---

## License

MIT © 2026 CenTrus Inc. All rights reserved.

---

*Built for the **APAC Stellar Hackathon 2026** · Rise In & Stellar Development Foundation*
*CenTrus Inc. · Legazpi City, Bicol Region, Philippines*
*"We are the Pipe, not the Water."*
