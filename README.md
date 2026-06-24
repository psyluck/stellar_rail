# CenDTrus Remit — Stellar Settlement Rail

> **"We are the Pipe, not the Water."**
>
> 100% non-custodial cross-border remittance infrastructure.
> We orchestrate settlement. We never hold capital.

---

## Stellar Hacks: Real-World ZK Hackathon — June 2026

**Submission:** CenDTrus Remit · Stellar Rail 03
**Track:** Cross-Border Remittance / Institutional-Grade Infrastructure
**Team:** CenTrus Inc. · Legazpi City, Philippines

---

## What Is CenDTrus Remit?

CenDTrus Remit is the **retail and SME-facing settlement tier** of the CenTrus two-product fintech architecture. Where CenTrus Sovereign handles institutional wholesale settlements in the $50M–$1B+ range using Circle Arc and Ripple ODL rails, CenDTrus Remit serves the day-to-day corridor needs of individuals, families, and small businesses moving money across borders — from $100 to $25,000 per transaction.

This repository is the **Stellar connector** — the high-assurance rail that provides sub-3-second, non-custodial settlement using **native USDC** and **RLUSD** on the Stellar network.

---

## The Non-Custodial Thesis: Pipe, Not Water

Traditional remittance systems are custodians. They hold your money, even briefly, while routing it through correspondent banks, FX desks, and settlement queues. CenDTrus Remit rejects this model entirely.

```
Traditional Flow:   Sender → Custodian (holds funds) → Recipient
CenDTrus Flow:      Sender → Stellar DEX Path Payment → Recipient
                             ↑ We orchestrate this. Nothing more.
```

Every transaction is a **direct on-chain path payment**. The Haskell Conductor (off-chain) computes the optimal routing. The Stellar Rail executes it. The assets move from sender wallet to recipient wallet in a single atomic operation. CenTrus never touches the capital.

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

The `stellar-rail/` module is the **isolated Stellar connector** that the Haskell Conductor imports as an external package. It is designed to be independently deployable, testable, and verifiable — meeting the clean-room standard for the Stellar Hacks submission.

### File Structure

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
│   └── StellarAdapter.ts     # @stellar/stellar-sdk wrapper — core logic
│
└── src/
    ├── main.ts               # Vue 3 app entry
    ├── App.vue               # Root shell (nav bar, layout)
    ├── style.css             # Tailwind base + custom utilities
    │
    ├── components/
    │   └── CenDTrusDashboard.vue  # Master dashboard (4 panels)
    │
    └── repositories/
        └── StellarRepository.ts   # Typed API client service
```

---

## The Four Dashboard Panels

### 1. Real-Time Pipeline Status
Live operational telemetry for both the **Stellar Rail 03** (primary) and a read-only view of **Ripple ODL Rail 01** (Sovereign-tier, for context). Displays finality times, TPS, queue depth, and 24-hour settlement volume.

### 2. Sovereign Shield — Aigarth Slippage Monitor
The **Sovereign Shield** is an algorithmic guardrail enforcing a strict **1 basis point (0.01%) slippage ceiling** on all transactions. Aigarth, CenTrus's predictive AI engine, senses DEX pool liquidity depth just-in-time and projects slippage for the pending transaction size.

- **SECURE** (green): Slippage well inside ceiling. Auto-proceed.
- **WARN** (amber): Within 25% of ceiling. Monitoring frequency doubles.
- **BREACH** (red): Ceiling exceeded. Transaction HALTED. HITL automatically triggered.

### 3. Atomic Slicing Terminal
Large remittances are **sliced into 10 parallel atomic micro-packets** before submission to the Stellar network. This strategy:

- Reduces per-packet market impact on DEX liquidity
- Enables parallel settlement across multiple path routes
- Provides graceful degradation (9/10 packets settled is still 90% of funds delivered atomically)

Each packet is an independent Stellar `pathPaymentStrictSend` operation, orchestrated in parallel by the Haskell Conductor.

### 4. Symphony HITL — Multi-Agent Compliance Review
When the Sovereign Shield triggers, transactions enter the **Symphony Human-in-the-Loop** queue. Three AI agents deliberate:

| Agent | Role |
|-------|------|
| **Aigarth** | Liquidity and market risk assessment |
| **Gemini** | Regulatory compliance review (FATF R.16, AML) |
| **Symphony** | HITL coordinator — synthesizes verdict, routes to human |

A human operator reviews the AI debate transcript and makes the final APPROVE / REJECT decision. Symphony is strictly a coordination and communication layer — it does not replace human judgment.

---

## The Haskell Conductor: Off-Chain Brain

The Stellar Rail module (`stellar-rail/`) is the **execution layer**. The intelligence lives in the **Haskell Conductor** — an off-chain engine that:

- Runs a **Z3 SMT Prover** for formal verification of transaction invariants before submission
- Applies the **Sovereign Shield** slippage ceiling in a provably correct way
- Selects the optimal rail (Stellar vs. Morph L2) based on real-time corridor conditions
- Orchestrates the 10-packet atomic slice strategy
- Triggers Qubic Quorum audit requests post-settlement

The Haskell Conductor imports this `stellar-rail/` package as an external TypeScript API via the Node.js adapter, calling `/api/tx/atomic-slice` and `/api/qubic-audit` as orchestrated settlement commands.

---

## Qubic Quorum: External Cryptographic Audit

CenDTrus Remit integrates **Qubic Quorum** as an independent, external audit network. Qubic's **676 Computors** attest to the integrity of completed settlement bundles using distributed consensus — providing cryptographic proof that the settlement occurred as recorded.

**Important distinction:**
- Qubic is **not** an internal CenTrus component
- Qubic is **not** a CenTrus subsidiary or partner product
- Qubic is an **independent external network** used as an audit oracle

For CenDTrus Remit (retail tier), Qubic attestation is **best-effort** — settlement completes regardless of Qubic availability. For CenTrus Sovereign (institutional tier), Qubic attestation is **mandatory** before ledger finality is acknowledged.

---

## Multi-Rail Handoff Logic

```
Incoming Transaction
        │
        ▼
┌───────────────────┐
│  Rail Selector    │  (Haskell Conductor)
│                   │
│  Amount > $50M?   │──YES──► CenTrus Sovereign (Circle Arc / Ripple ODL)
│                   │
│  Amount ≤ $25K?   │──YES──► CenDTrus Remit
│                   │         │
│                   │         ▼
│                   │    Corridor Analysis
│                   │         │
│                   │    Stellar DEX liquidity adequate?
│                   │         │──YES──► Stellar Rail 03 (THIS REPO)
│                   │         │──NO───► Morph L2 Rail 04 (EVM fallback)
└───────────────────┘
```

**Why no EVM bridges on Stellar Rail?** EVM bridge latency (5–15 minutes for finality) is incompatible with the sub-3-second SLA that defines the CenDTrus Remit value proposition. Stellar's native USDC issuance (Circle) and RLUSD issuance (Ripple) eliminate the bridge requirement entirely.

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm 9+
- A Stellar Testnet account (funded via [Friendbot](https://friendbot.stellar.org))

### Installation

```bash
# Clone the repository
git clone https://github.com/centrus-inc/stellar-rail.git
cd stellar-rail

# Install dependencies
npm install
```

### Running in Development

```bash
# Start both the Express server (port 3001) and Vite dev server (port 5173) together
npm run dev
```

The Vue dashboard will be available at `http://localhost:5173`.
The Express API adapter will be available at `http://localhost:3001`.

### Building for Production

```bash
npm run build
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Server health check |
| `GET` | `/api/balances?account=G...` | Live Stellar account balances |
| `GET` | `/api/pipeline-status` | Rail operational telemetry |
| `GET` | `/api/slippage?amount=N&corridor=PHP-USD` | Sovereign Shield slippage reading |
| `POST` | `/api/tx/atomic-slice` | Submit atomic 10-packet transaction |
| `GET` | `/api/tx/:id/status` | Poll transaction status |
| `POST` | `/api/qubic-audit` | Request Qubic external audit proof |
| `GET` | `/api/hitl/queue` | Fetch HITL compliance review queue |
| `POST` | `/api/hitl/:id/resolve` | Submit human reviewer decision |

---

## Asset Support

| Asset | Issuer | Role |
|-------|--------|------|
| **USDC** | Circle (native Stellar issuance) | Primary settlement asset |
| **RLUSD** | Ripple (native Stellar issuance) | Slippage guard / alternative rail |
| **XLM** | Stellar Network | Fee buffer (minimum balance) |

USDT and non-native bridge tokens are explicitly **not supported** on this rail. Bridge-wrapped assets introduce custodial risk and finality uncertainty that violates the "Pipe, not Water" philosophy.

---

## Design System

The CenDTrus Remit dashboard uses a proprietary three-layer palette:

| Token | Value | Role |
|-------|-------|------|
| `bg-mint` | `#F0FDF4` | Page surface — icy crystalline green |
| `bg-navy` | `#0F172A` | Card containers — deep institutional |
| `emerald-accent` | `#10B981` | Live data, status indicators, CTAs |
| `emerald-accent-warn` | `#F59E0B` | Shield warning state |
| `emerald-accent-danger` | `#EF4444` | Shield breach, HITL trigger |

---

## Roadmap

- [ ] Live Stellar Testnet path payment execution (Freighter wallet integration)
- [ ] Haskell Conductor gRPC event bus integration
- [ ] Real Qubic Quorum API attestation calls
- [ ] Morph L2 Rail 04 fallback activation logic
- [ ] ZK proof generation for settlement bundle integrity (ZK Hackathon track)
- [ ] Production Horizon mainnet deployment

---

## License

MIT © 2026 CenTrus Inc. All rights reserved.

---

*Built for the Stellar Hacks: Real-World ZK Hackathon · June 2026*
*CenTrus Inc. · Legazpi City, Philippines*
*"We are the Pipe, not the Water."*
