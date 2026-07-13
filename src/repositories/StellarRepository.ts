// ─────────────────────────────────────────────────────────────────────────────
// CenDTrus Remit — StellarRepository.ts
// Typed TypeScript repository that abstracts all data-fetching from the
// Express backend adapter (/api/*). The dashboard components consume this
// service exclusively — no raw fetch() calls in Vue components.
//
// In production, these endpoints proxy to Stellar Horizon and the
// Haskell Conductor off-chain engine. In testnet/hackathon mode,
// the server returns high-fidelity simulated telemetry.
// ─────────────────────────────────────────────────────────────────────────────

import axios, { AxiosInstance } from 'axios'

// ── Type Definitions ──────────────────────────────────────────────────────────

/** Live Stellar account balance for a given asset */
export interface AssetBalance {
  asset: 'USDC' | 'RLUSD' | 'XLM'
  issuer: string
  balance: string          // String-form decimal from Horizon
  balanceUSD: number       // Computed USD equivalent
  limit: string
}

/** Aggregate pipeline telemetry snapshot */
export interface PipelineStatus {
  rail: 'stellar' | 'ripple-odl'
  status: 'ACTIVE' | 'DEGRADED' | 'OFFLINE'
  tps: number              // Transactions per second
  avgSettlementMs: number  // Average time-to-finality in milliseconds
  pendingQueue: number     // Transactions waiting in the pipeline
  totalSettled24h: number  // Total volume settled (USD) in last 24 hours
}

/** Sovereign Shield slippage reading from Aigarth */
export interface SlippageReading {
  basisPoints: number      // e.g. 0.7 = 0.007%
  percentageDisplay: string // e.g. "0.007%"
  status: 'SECURE' | 'WARN' | 'BREACH'
  aiAssessment: string     // Aigarth natural-language assessment
  liquidityDepth: number   // Estimated pool liquidity depth (USD)
  timestamp: string
}

/** A single atomic micro-packet in a sliced transaction */
export interface AtomicPacket {
  id: number               // Packet index (1–10)
  amount: number           // USD amount in this slice
  asset: 'USDC' | 'XLM'
  status: 'PENDING' | 'IN_FLIGHT' | 'SETTLED' | 'FAILED'
  txHash?: string          // Stellar transaction hash once confirmed
  settlementMs?: number    // Time-to-finality for this packet
}

/** A sliced atomic transaction batch (10 micro-packets) */
export interface AtomicTransaction {
  id: string               // Unique transaction ID
  totalAmount: number      // Full transaction amount (USD)
  sender: string           // Sender Stellar public key (truncated)
  recipient: string        // Recipient Stellar public key (truncated)
  corridor: string         // e.g. "PHP → USD"
  packets: AtomicPacket[]
  startTime: string
  completionTime?: string
  overallStatus: 'SLICING' | 'IN_FLIGHT' | 'COMPLETE' | 'HITL_PAUSED'
}

/** Qubic Quorum external audit proof */
export interface QubicAuditProof {
  transactionId: string
  computorCount: number    // Number of Qubic computors that attested
  quorumThreshold: number  // Minimum required (e.g. 451 of 676)
  consensusReached: boolean
  attestationHash: string  // Cryptographic proof hash
  epochVerified: number    // Qubic epoch at verification
  timestamp: string
}

/** Symphony HITL compliance rationale entry */
export interface HITLEntry {
  id: string
  triggeredAt: string
  trigger: 'SLIPPAGE_BREACH' | 'COMPLIANCE_FLAG' | 'LIQUIDITY_THIN' | 'MANUAL'
  transactionId: string
  amount: number
  corridor: string
  // Multi-agent debate transcript
  agentDebate: {
    agent: 'Aigarth' | 'Gemini' | 'Symphony'
    role: string
    verdict: 'APPROVE' | 'REJECT' | 'ESCALATE'
    rationale: string
    confidence: number      // 0–100
  }[]
  finalVerdict: 'APPROVED' | 'REJECTED' | 'ESCALATED'
  humanReviewer?: string
}

// ── Repository Class ──────────────────────────────────────────────────────────

/**
 * StellarRepository
 *
 * Single-entry-point service for all CenDTrus Remit data operations.
 * Wraps the Express backend API with typed methods.
 */
export class StellarRepository {
  private client: AxiosInstance

  constructor(baseURL = '/api') {
    this.client = axios.create({
      baseURL,
      timeout: 10_000,
      headers: {
        'Content-Type': 'application/json',
        'X-CenDTrus-Client': 'stellar-rail-ui/1.0',
      },
    })

    // Global response interceptor — log errors to console in dev
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[StellarRepository] API Error:', error.message)
        return Promise.reject(error)
      },
    )
  }

  // ── Account & Balance ──────────────────────────────────────────────────────

  /**
   * Fetch live asset balances for a Stellar public key.
   * Queries Horizon for USDC (Circle issuer) and RLUSD (Ripple issuer).
   */
  async getAccountBalances(publicKey: string): Promise<AssetBalance[]> {
    const { data } = await this.client.get<AssetBalance[]>('/balances', {
      params: { account: publicKey },
    })
    return data
  }

  // ── Pipeline Status ────────────────────────────────────────────────────────

  /**
   * Get the current operational status of all active settlement rails.
   * Returns one entry per rail (stellar, ripple-odl).
   */
  async getPipelineStatus(): Promise<PipelineStatus[]> {
    const { data } = await this.client.get<PipelineStatus[]>('/pipeline-status')
    return data
  }

  // ── Sovereign Shield / Slippage ────────────────────────────────────────────

  /**
   * Get the current Sovereign Shield slippage reading from Aigarth.
   * @param amount    Transaction amount in USD
   * @param corridor  Source→Target currency pair, e.g. "PHP-USD"
   */
  async getSlippage(amount: number, corridor: string): Promise<SlippageReading> {
    const { data } = await this.client.get<SlippageReading>('/slippage', {
      params: { amount, corridor },
    })
    return data
  }

  // ── Atomic Transaction Slicing ─────────────────────────────────────────────

  /**
   * Submit a transaction for atomic slicing into 10 parallel micro-packets.
   * The Haskell Conductor determines optimal packet sizing based on
   * current liquidity depth and slippage constraints.
   */
  async submitAtomicTransaction(payload: {
    amount: number
    corridor: string
    sender: string
    recipient: string
    asset: 'USDC' | 'XLM'
  }): Promise<AtomicTransaction> {
    const { data } = await this.client.post<AtomicTransaction>('/tx/atomic-slice', payload)
    return data
  }

  /**
   * Poll the status of an in-flight atomic transaction.
   */
  async getAtomicTransactionStatus(txId: string): Promise<AtomicTransaction> {
    const { data } = await this.client.get<AtomicTransaction>(`/tx/${txId}/status`)
    return data
  }

  // ── Qubic Audit ───────────────────────────────────────────────────────────

  /**
   * Request a Qubic Quorum external audit proof for a completed transaction.
   * The 676 Computor network attests to the settlement integrity.
   * For CenDTrus Remit, this is best-effort (not mandatory as in Sovereign).
   */
  async requestQubicAudit(transactionId: string): Promise<QubicAuditProof> {
    const { data } = await this.client.post<QubicAuditProof>('/qubic-audit', {
      transactionId,
    })
    return data
  }

  // ── Symphony HITL ─────────────────────────────────────────────────────────

  /**
   * Fetch the queue of HITL compliance review entries.
   * These are transactions paused by the Sovereign Shield or compliance engine.
   */
  async getHITLQueue(): Promise<HITLEntry[]> {
    const { data } = await this.client.get<HITLEntry[]>('/hitl/queue')
    return data
  }

  /**
   * Submit a human reviewer decision on a HITL-paused transaction.
   */
  async resolveHITL(
    entryId: string,
    decision: 'APPROVE' | 'REJECT',
    reviewer: string,
  ): Promise<{ success: boolean; message: string }> {
    const { data } = await this.client.post(`/hitl/${entryId}/resolve`, {
      decision,
      reviewer,
    })
    return data
  }
}

// Export a singleton instance for use across components
export const stellarRepo = new StellarRepository()
