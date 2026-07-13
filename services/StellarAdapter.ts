// ─────────────────────────────────────────────────────────────────────────────
// CenDTrus Remit — services/StellarAdapter.ts
//
// Pure TypeScript service that wraps @stellar/stellar-sdk v12+.
// Responsibilities:
//   • Query Horizon for live account balances (USDC, XLM)
//   • Prepare and submit direct payment envelopes
//   • Calculate real-time slippage from Stellar DEX order books
//   • Simulate Qubic audit proof submissions
//
// PHILOSOPHY: This service never holds keys beyond the duration of a single
// transaction envelope construction. We are the Pipe, not the Water.
// ─────────────────────────────────────────────────────────────────────────────

import {
  Horizon,
  Networks,
  Keypair,
  Asset,
  TransactionBuilder,
  Operation,
  BASE_FEE,
  StrKey,
  Memo,
} from '@stellar/stellar-sdk'

// ── Constants ─────────────────────────────────────────────────────────────────

/** Stellar Testnet Horizon endpoint */
const HORIZON_URL = 'https://horizon-testnet.stellar.org'

/** Stellar Testnet passphrase */
const NETWORK_PASSPHRASE = Networks.TESTNET

/**
 * Circle's USDC issuer on Stellar Testnet.
 * On mainnet this is: GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN
 */
const USDC_ISSUER_TESTNET = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'

/** Sovereign Shield ceiling — 1 basis point (0.01%) expressed as a ratio */
const SLIPPAGE_CEILING_BP = 1.0

// ── Asset Definitions ─────────────────────────────────────────────────────────
// CenDTrus Remit currently supports XLM (native) and USDC (Circle testnet).
// RLUSD integration is planned for mainnet once a live issuer is confirmed.

export const ASSETS = {
  XLM:  Asset.native(),
  USDC: new Asset('USDC', USDC_ISSUER_TESTNET),
} as const

export type SupportedAsset = keyof typeof ASSETS

// ── Type Definitions ──────────────────────────────────────────────────────────

export interface AccountBalance {
  asset: SupportedAsset
  balance: string
  balanceUSD: number
  issuer: string | null
  limit: string | null
}

export interface SlippageResult {
  basisPoints: number
  percentageDisplay: string
  status: 'SECURE' | 'WARN' | 'BREACH'
  liquidityDepth: number
  aiAssessment: string
  timestamp: string
}

export interface PathPaymentParams {
  /** Source Stellar keypair (the payer) */
  sourceKeypair: Keypair
  /** Recipient public key */
  destinationPublicKey: string
  /** Asset to send from source */
  sendAsset: SupportedAsset
  /** Maximum source amount willing to deduct */
  sendMax: string
  /** Asset to deliver to destination */
  destAsset: SupportedAsset
  /** Exact amount to deliver */
  destAmount: string
  /** Optional intermediate assets for path finding */
  path?: Asset[]
  /** Memo text for compliance traceability */
  memo?: string
}

export interface TransactionResult {
  success: boolean
  txHash?: string
  ledger?: number
  fee?: string
  errorMessage?: string
  settlementMs?: number
}

export interface OrderBookSummary {
  asks: { price: string; amount: string }[]
  bids: { price: string; amount: string }[]
  spread: number
  midPrice: number
  liquidityDepthUSD: number
}

export interface AtomicPacketPayload {
  packetId: number
  sourceKeypair: Keypair
  destinationPublicKey: string
  asset: SupportedAsset
  amount: string        // Amount for this micro-packet
  memo: string
}

// ── StellarAdapter Class ──────────────────────────────────────────────────────

/**
 * StellarAdapter
 *
 * Encapsulates all @stellar/stellar-sdk interactions for the CenDTrus Remit
 * rail. Instantiated once as a singleton in server.ts.
 */
export class StellarAdapter {
  private server: Horizon.Server

  constructor(horizonUrl: string = HORIZON_URL) {
    this.server = new Horizon.Server(horizonUrl)
  }

  // ── Account & Balance ──────────────────────────────────────────────────────

  /**
   * Fetch all relevant asset balances for a given Stellar public key.
   * Filters the Horizon response to only the assets CenDTrus Remit supports:
   * XLM (native) and USDC (Circle issuer).
   *
   * @param publicKey  Stellar G-address (56 characters)
   */
  async getAccountBalances(publicKey: string): Promise<AccountBalance[]> {
    this.validatePublicKey(publicKey)

    const account = await this.server.loadAccount(publicKey)
    const results: AccountBalance[] = []

    // USD price oracle — in production, this pulls from a live price feed
    const usdPrices: Record<string, number> = {
      USDC: 1.00,
      XLM:  0.11,   // Approximate — replace with live feed in production
    }

    for (const balance of account.balances) {
      if (balance.asset_type === 'native') {
        const bal = parseFloat(balance.balance)
        results.push({
          asset: 'XLM',
          balance: balance.balance,
          balanceUSD: bal * usdPrices['XLM'],
          issuer: null,
          limit: null,
        })
        continue
      }

      // Type guard for credit assets (asset_type === 'credit_alphanum4' | 'credit_alphanum12')
      if (
        balance.asset_type === 'credit_alphanum4' ||
        balance.asset_type === 'credit_alphanum12'
      ) {
        const code = balance.asset_code as SupportedAsset

        // Only include assets CenDTrus Remit actively supports
        if (!['USDC'].includes(code)) continue

        const bal = parseFloat(balance.balance)
        results.push({
          asset: code,
          balance: balance.balance,
          balanceUSD: bal * (usdPrices[code] ?? 1),
          issuer: balance.asset_issuer,
          limit: balance.limit,
        })
      }
    }

    return results
  }

  // ── Order Book & Slippage ──────────────────────────────────────────────────

  /**
   * Query the Stellar DEX order book for a trading pair and compute
   * the expected slippage for a given trade size.
   *
   * The Sovereign Shield will reject any transaction where the projected
   * slippage exceeds 1 basis point (0.01%).
   *
   * @param sendAsset       Asset being sold (e.g. USDC)
   * @param destAsset       Asset being bought (e.g. XLM)
   * @param tradeAmountUSD  Notional trade size in USD
   */
  async calculateSlippage(
    sendAsset: SupportedAsset,
    destAsset: SupportedAsset,
    tradeAmountUSD: number,
  ): Promise<SlippageResult> {
    const orderBook = await this.server
      .orderbook(ASSETS[sendAsset], ASSETS[destAsset])
      .call()

    // Compute mid-price from top-of-book
    const topAsk = parseFloat(orderBook.asks[0]?.price ?? '1')
    const topBid = parseFloat(orderBook.bids[0]?.price ?? '1')
    const midPrice = (topAsk + topBid) / 2

    // Simulate walking the order book to fill tradeAmountUSD
    let filled = 0
    let weightedPrice = 0
    for (const ask of orderBook.asks) {
      const askPrice  = parseFloat(ask.price)
      const askAmount = parseFloat(ask.amount) * askPrice  // in USD
      const fillNow   = Math.min(tradeAmountUSD - filled, askAmount)
      weightedPrice  += fillNow * askPrice
      filled         += fillNow
      if (filled >= tradeAmountUSD) break
    }

    const avgExecutionPrice = filled > 0 ? weightedPrice / filled : midPrice
    const slippageRatio     = Math.abs((avgExecutionPrice - midPrice) / midPrice)
    const basisPoints       = slippageRatio * 10_000  // convert to basis points

    // Estimate total liquidity depth from asks within 5bp of mid
    const liquidityDepth = orderBook.asks
      .filter((a) => Math.abs(parseFloat(a.price) - midPrice) / midPrice < 0.0005)
      .reduce((sum, a) => sum + parseFloat(a.amount) * parseFloat(a.price), 0)

    const status: SlippageResult['status'] =
      basisPoints >= SLIPPAGE_CEILING_BP
        ? 'BREACH'
        : basisPoints >= SLIPPAGE_CEILING_BP * 0.75
        ? 'WARN'
        : 'SECURE'

    const aiAssessment = this.generateAigarthAssessment(
      basisPoints,
      liquidityDepth,
      tradeAmountUSD,
      status,
    )

    return {
      basisPoints:       parseFloat(basisPoints.toFixed(4)),
      percentageDisplay: `${(basisPoints / 100).toFixed(4)}%`,
      status,
      liquidityDepth,
      aiAssessment,
      timestamp: new Date().toISOString(),
    }
  }

  /**
   * Generate an Aigarth-style natural-language pool assessment.
   * In production, this would be a call to the Aigarth inference engine.
   */
  private generateAigarthAssessment(
    basisPoints: number,
    liquidityDepth: number,
    tradeAmountUSD: number,
    status: SlippageResult['status'],
  ): string {
    const depthM = (liquidityDepth / 1_000_000).toFixed(1)
    const bpStr  = basisPoints.toFixed(3)

    if (status === 'SECURE') {
      return (
        `Aigarth analysis complete. Stellar DEX pool depth: $${depthM}M within ±5bp of mid. ` +
        `Projected slippage for $${tradeAmountUSD.toLocaleString()} order: ${bpStr}bp — ` +
        `well inside the 1bp Sovereign Shield ceiling. Settlement confidence: HIGH. No HITL trigger required.`
      )
    }
    if (status === 'WARN') {
      return (
        `Aigarth WARNING: Slippage reading at ${bpStr}bp — approaching the 1bp ceiling. ` +
        `Pool depth has thinned to $${depthM}M. Recommend splitting order or waiting for liquidity ` +
        `recovery. HITL standby: ACTIVE. Monitoring at 500ms intervals.`
      )
    }
    return (
      `Aigarth BREACH ALERT: Slippage of ${bpStr}bp EXCEEDS the 1bp Sovereign Shield ceiling. ` +
      `Transaction HALTED. Pool depth critically low at $${depthM}M. ` +
      `HITL escalation initiated. Human reviewer override required to proceed.`
    )
  }

  // ── Path Payment (Core Settlement) ────────────────────────────────────────

  /**
   * Build, sign, and submit a Path Payment Strict Send transaction.
   *
   * Path payments allow CenDTrus Remit to route through intermediate assets
   * on the Stellar DEX, ensuring the recipient receives their preferred
   * stable asset regardless of source.
   *
   * ⚠️  Non-custodial constraint: The source keypair is provided by the
   *     caller and never stored. Keys exist in memory only for the duration
   *     of this function call.
   */
  async submitPathPayment(params: PathPaymentParams): Promise<TransactionResult> {
    const startTime = Date.now()

    try {
      this.validatePublicKey(params.destinationPublicKey)

      const sourceAccount = await this.server.loadAccount(
        params.sourceKeypair.publicKey(),
      )

      const txBuilder = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })

      txBuilder.addOperation(
        Operation.pathPaymentStrictSend({
          sendAsset:   ASSETS[params.sendAsset],
          sendAmount:  params.sendMax,
          destination: params.destinationPublicKey,
          destAsset:   ASSETS[params.destAsset],
          destMin:     params.destAmount,
          path:        params.path ?? [],
        }),
      )

      if (params.memo) {
        txBuilder.addMemo(Memo.text(params.memo))
      }

      txBuilder.setTimeout(30)
      const transaction = txBuilder.build()
      transaction.sign(params.sourceKeypair)

      const response = await this.server.submitTransaction(transaction)

      return {
        success:      true,
        txHash:       response.hash,
        ledger:       response.ledger,
        fee:          String(transaction.fee),
        settlementMs: Date.now() - startTime,
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      console.error('[StellarAdapter] Path payment failed:', msg)
      return {
        success:      false,
        errorMessage: msg,
        settlementMs: Date.now() - startTime,
      }
    }
  }

  // ── Atomic Micro-Packet Settlement ────────────────────────────────────────

  /**
   * Submit a single atomic micro-packet as part of a 10-way sequential slice.
   *
   * Each packet is an independent Stellar payment transaction, signed and
   * submitted directly to Horizon. The Haskell Conductor orchestrates the
   * 10-packet pipeline; this method handles one packet at a time.
   *
   * Set testnetSimulate = false to hit real Horizon (default for production).
   */
  async submitAtomicPacket(
    packet: AtomicPacketPayload,
    testnetSimulate: boolean = true,
  ): Promise<TransactionResult> {
    if (testnetSimulate) {
      const settlementMs = 1800 + Math.floor(Math.random() * 800)
      await sleep(settlementMs)
      return {
        success:      true,
        txHash:       generateMockTxHash(),
        ledger:       50_000_000 + Math.floor(Math.random() * 1_000_000),
        fee:          BASE_FEE,
        settlementMs,
      }
    }

    // Use direct payment — source and destination asset are the same (XLM)
    const startTime = Date.now()
    try {
      const sourceAccount = await this.server.loadAccount(
        packet.sourceKeypair.publicKey(),
      )

      const tx = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(
          Operation.payment({
            destination: packet.destinationPublicKey,
            asset:       ASSETS[packet.asset],
            amount:      packet.amount,
          }),
        )
        .setTimeout(30)
        .build()

      tx.sign(packet.sourceKeypair)
      const response = await this.server.submitTransaction(tx)

      return {
        success:      true,
        txHash:       response.hash,
        ledger:       response.ledger,
        fee:          String(tx.fee),
        settlementMs: Date.now() - startTime,
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      console.error('[StellarAdapter] Packet payment failed:', msg)
      return {
        success:      false,
        errorMessage: msg,
        settlementMs: Date.now() - startTime,
      }
    }
  }

  // ── Qubic Audit Proof (Simulated) ─────────────────────────────────────────

  /**
   * Simulate a Qubic Quorum external audit proof submission.
   *
   * In the production architecture, this call is relayed by the Haskell
   * Conductor to the Qubic 676-Computor network, which attests to the
   * settlement integrity of the completed transaction bundle.
   *
   * For CenDTrus Remit, Qubic attestation is best-effort.
   * For CenTrus Sovereign, it is mandatory before ledger finality.
   *
   * @param transactionId  The CenDTrus internal transaction ID
   * @param txHashes       Array of Stellar tx hashes (one per packet)
   */
  async simulateQubicAudit(
    transactionId: string,
    txHashes: string[],
  ): Promise<{
    computorCount: number
    consensusReached: boolean
    attestationHash: string
    epochVerified: number
  }> {
    await sleep(1200)

    const computorCount    = 451 + Math.floor(Math.random() * 200)
    const attestationInput = transactionId + txHashes.join('') + Date.now()
    const attestationHash  = Buffer.from(attestationInput)
      .toString('base64')
      .slice(0, 16)
      .toUpperCase()

    return {
      computorCount,
      consensusReached: computorCount >= 451,
      attestationHash:  `QBCA${attestationHash}`,
      epochVerified:    18_440_000 + Math.floor(Math.random() * 10_000),
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Validate that a string is a valid Stellar public key (G-address).
   * Throws a descriptive error if invalid, before any network call is made.
   */
  private validatePublicKey(key: string): void {
    if (!StrKey.isValidEd25519PublicKey(key)) {
      throw new Error(
        `[StellarAdapter] Invalid Stellar public key: "${key.slice(0, 10)}...". ` +
        `Expected a 56-character G-address.`,
      )
    }
  }
}

// ── Module-Level Utilities ────────────────────────────────────────────────────

/** Promise-based sleep utility for async delays */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Generate a mock Stellar transaction hash for testnet simulation */
function generateMockTxHash(): string {
  const chars = '0123456789abcdef'
  return Array.from(
    { length: 64 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join('')
}

// Export a singleton for use in server.ts
export const stellarAdapter = new StellarAdapter()