// ─────────────────────────────────────────────────────────────────────────────
// CenDTrus Remit — server.ts
// Express backend adapter for the Stellar settlement rail.
//
// Exposes the following REST endpoints:
//   GET  /api/health               → Server health check
//   GET  /api/balances             → Live Stellar account balances
//   GET  /api/pipeline-status      → Rail operational telemetry
//   GET  /api/slippage             → Sovereign Shield slippage reading
//   POST /api/tx/atomic-slice      → Submit a 10-packet atomic transaction
//   GET  /api/tx/:id/status        → Poll atomic transaction status
//   POST /api/qubic-audit          → Request Qubic external audit proof
//   GET  /api/hitl/queue           → Fetch HITL compliance review queue
//   POST /api/hitl/:id/resolve     → Submit human reviewer decision
//
// PHILOSOPHY: This server is a stateless orchestration adapter.
// It holds no user funds, no private keys beyond request scope.
// We are the Pipe, not the Water.
// ─────────────────────────────────────────────────────────────────────────────
import * as dotenv from 'dotenv'
dotenv.config()


import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { Keypair } from '@stellar/stellar-sdk'
import { stellarAdapter } from './services/StellarAdapter.js'
// ── App Bootstrap ─────────────────────────────────────────────────────────────

const app = express()
const PORT = process.env.PORT ?? 3001

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors({
  // In production, restrict to your frontend origin
  origin: process.env.ALLOWED_ORIGIN ?? '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-CenDTrus-Client'],
}))

app.use(express.json({ limit: '1mb' }))

// Request logger (compact, production-safe)
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// ── In-Memory Transaction Store ───────────────────────────────────────────────
// In production, replace with a Redis cache or a Postgres append-only ledger.

interface StoredAtomicTx {
  id: string
  totalAmount: number
  sender: string
  recipient: string
  corridor: string
  asset: string
  packets: {
    id: number
    amount: number
    asset: string
    status: 'PENDING' | 'IN_FLIGHT' | 'SETTLED' | 'FAILED'
    txHash?: string
    settlementMs?: number
  }[]
  overallStatus: 'SLICING' | 'IN_FLIGHT' | 'COMPLETE' | 'HITL_PAUSED'
  startTime: string
  completionTime?: string
}

const txStore = new Map<string, StoredAtomicTx>()

// ── HITL Queue Store ──────────────────────────────────────────────────────────

interface HITLRecord {
  id: string
  transactionId: string
  trigger: string
  amount: number
  corridor: string
  status: 'PENDING' | 'RESOLVED'
  finalVerdict?: 'APPROVED' | 'REJECTED'
  humanReviewer?: string
  createdAt: string
  resolvedAt?: string
}

const hitlStore = new Map<string, HITLRecord>()

// ─────────────────────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// ── GET /api/health ───────────────────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    service: 'CenDTrus Remit — Stellar Rail Adapter',
    version: '1.0.0',
    network: 'Stellar Testnet',
    timestamp: new Date().toISOString(),
    philosophy: 'We are the Pipe, not the Water.',
  })
})

// ── GET /api/balances ─────────────────────────────────────────────────────────
/**
 * Fetch live USDC, RLUSD, and XLM balances for a Stellar public key.
 * Query param: ?account=G...
 */
app.get('/api/balances', async (req: Request, res: Response) => {
  const { account } = req.query

  if (!account || typeof account !== 'string') {
    res.status(400).json({ error: 'Missing required query param: account' })
    return
  }

  try {
    const balances = await stellarAdapter.getAccountBalances(account)
    res.json(balances)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    // Horizon 404 means the account is unfunded — provide a helpful message
    if (message.includes('404') || message.includes('Not Found')) {
      res.status(404).json({
        error: 'Account not found on Stellar Testnet.',
        hint: 'Fund this account via Friendbot: https://friendbot.stellar.org/?addr=' + account,
      })
      return
    }
    res.status(500).json({ error: message })
  }
})

// ── GET /api/pipeline-status ──────────────────────────────────────────────────
/**
 * Returns operational telemetry for both the Stellar rail (Rail 03)
 * and a read-only view of the Ripple ODL rail (Rail 01, Sovereign).
 */
app.get('/api/pipeline-status', (_req: Request, res: Response) => {
  // In production, these metrics are streamed from the Haskell Conductor
  // via an internal gRPC event bus. For testnet, we return live-ish data.
  res.json([
    {
      rail: 'stellar',
      status: 'ACTIVE',
      tps: 1100 + Math.floor(Math.random() * 200),
      avgSettlementMs: 1800 + Math.floor(Math.random() * 400),
      pendingQueue: Math.floor(Math.random() * 5),
      totalSettled24h: 4_100_000 + Math.floor(Math.random() * 200_000),
    },
    {
      rail: 'ripple-odl',
      status: 'ACTIVE',
      tps: 1400 + Math.floor(Math.random() * 200),
      avgSettlementMs: 3200 + Math.floor(Math.random() * 600),
      pendingQueue: Math.floor(Math.random() * 10),
      totalSettled24h: 28_000_000 + Math.floor(Math.random() * 1_000_000),
    },
  ])
})

// ── GET /api/slippage ─────────────────────────────────────────────────────────
/**
 * Computes the Sovereign Shield slippage reading via Aigarth.
 * Query params: ?amount=25000&corridor=PHP-USD
 */
app.get('/api/slippage', async (req: Request, res: Response) => {
  const amount = parseFloat(req.query['amount'] as string)
  const corridor = req.query['corridor'] as string ?? 'PHP-USD'

  if (isNaN(amount) || amount <= 0) {
    res.status(400).json({ error: 'Invalid amount. Must be a positive number.' })
    return
  }

 try {
    // Testnet order books are too sparse for real slippage — always simulate
    res.json(simulatedSlippage(amount, corridor))
  } catch (err: unknown) {
    console.warn('[/api/slippage] Falling back to simulated slippage:', err)
    res.json(simulatedSlippage(amount, corridor))
  }
})

/** Safe fallback slippage reading when Horizon order book is empty */
function simulatedSlippage(amount: number, corridor: string) {
  const bp = 0.3 + Math.random() * 0.5
  return {
    basisPoints: parseFloat(bp.toFixed(4)),
    percentageDisplay: `${(bp / 100).toFixed(4)}%`,
    status: bp > 0.9 ? 'WARN' : 'SECURE',
    liquidityDepth: 6_000_000 + Math.random() * 4_000_000,
    aiAssessment:
      `Aigarth (testnet simulation): Pool depth adequate for $${amount.toLocaleString()} on ${corridor}. ` +
      `Projected slippage ${bp.toFixed(3)}bp. Horizon order book is sparse on testnet — ` +
      `live mainnet pools will reflect real liquidity depth.`,
    timestamp: new Date().toISOString(),
  }
}

// ── POST /api/tx/atomic-slice ─────────────────────────────────────────────────
/**
 * Accepts a remittance transaction and slices it into 10 parallel
 * atomic micro-packets for submission to the Stellar network.
 *
 * Body: { amount, corridor, sender, recipient, asset }
 */
app.post('/api/tx/atomic-slice', async (req: Request, res: Response) => {
  const { amount, corridor, sender, recipient, asset } = req.body

  if (!amount || !sender || !recipient || !asset) {
    res.status(400).json({
      error: 'Missing required fields: amount, sender, recipient, asset',
    })
    return
  }

  const txId = `CTR-${Date.now().toString(36).toUpperCase()}`
  const packetAmount = parseFloat(amount) / 10

  // Build the transaction record
  const tx: StoredAtomicTx = {
    id: txId,
    totalAmount: parseFloat(amount),
    sender: truncateKey(sender),
    recipient: truncateKey(recipient),
    corridor: corridor ?? 'PHP → USD',
    asset,
    packets: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      amount: packetAmount,
      asset,
      status: 'PENDING',
    })),
    overallStatus: 'SLICING',
    startTime: new Date().toISOString(),
  }

  txStore.set(txId, tx)

  // Kick off async packet settlement (non-blocking)
  processAtomicPackets(txId).catch((err) =>
    console.error(`[AtomicSlice] Error processing ${txId}:`, err),
  )

  res.status(202).json(tx)
})

/**
 * Sequentially settles each packet via the Stellar adapter.
 * In production, packets are submitted in parallel; here we simulate
 * staggered submission to create the visual pipeline effect.
 */
async function processAtomicPackets(txId: string): Promise<void> {
  const tx = txStore.get(txId)
  if (!tx) return

  const sourceKeypair = Keypair.fromSecret(process.env.STELLAR_DEMO_SECRET!)
  const destination   = process.env.STELLAR_PUBLIC_KEY!

  tx.overallStatus = 'IN_FLIGHT'

  for (let i = 0; i < tx.packets.length; i++) {
    const packet = tx.packets[i]
    packet.status = 'IN_FLIGHT'

    const result = await stellarAdapter.submitAtomicPacket({
      packetId: packet.id,
      sourceKeypair,
      destinationPublicKey: destination,
      asset: 'XLM',
      amount: packet.amount.toFixed(7),
      memo: txId,
    }, false) // false = hit real Horizon

    if (result.success) {
      packet.status       = 'SETTLED'
      packet.txHash       = result.txHash
      packet.settlementMs = result.settlementMs
    } else {
      packet.status = 'FAILED'
      console.error(`[AtomicSlice] PKT-${packet.id} failed:`, result.errorMessage)
    }

    await sleep(200)
    console.log(`[AtomicSlice] ${txId} PKT-${String(i+1).padStart(2,'0')} → ${packet.status} in ${packet.settlementMs}ms`)
  }

  tx.overallStatus  = tx.packets.every(p => p.status === 'SETTLED') ? 'COMPLETE' : 'HITL_PAUSED'
  tx.completionTime = new Date().toISOString()
  console.log(`[AtomicSlice] ${txId} fully settled.`)
}

// ── GET /api/tx/:id/status ────────────────────────────────────────────────────
app.get('/api/tx/:id/status', (req: Request, res: Response) => {
  const tx = txStore.get(req.params['id'])
  if (!tx) {
    res.status(404).json({ error: `Transaction ${req.params['id']} not found.` })
    return
  }
  res.json(tx)
})

// ── POST /api/qubic-audit ─────────────────────────────────────────────────────
/**
 * Request a Qubic Quorum external audit proof for a completed transaction.
 * Body: { transactionId }
 */
app.post('/api/qubic-audit', async (req: Request, res: Response) => {
  const { transactionId } = req.body

  if (!transactionId) {
    res.status(400).json({ error: 'Missing required field: transactionId' })
    return
  }

  try {
    const tx = txStore.get(transactionId)
    const txHashes = tx?.packets.map((p) => p.txHash ?? '').filter(Boolean) ?? []

    const proof = await stellarAdapter.simulateQubicAudit(transactionId, txHashes)

    res.json({
      transactionId,
      ...proof,
      quorumThreshold: 451,
      timestamp: new Date().toISOString(),
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

// ── GET /api/hitl/queue ───────────────────────────────────────────────────────
/**
 * Returns all pending HITL compliance review records.
 */
app.get('/api/hitl/queue', (_req: Request, res: Response) => {
  const pending = Array.from(hitlStore.values()).filter(
    (r) => r.status === 'PENDING',
  )

  // Seed one demo record if the store is empty (for fresh testnet demos)
  if (pending.length === 0) {
    const seedId = 'HITL-DEMO-001'
    if (!hitlStore.has(seedId)) {
      hitlStore.set(seedId, {
        id: seedId,
        transactionId: 'CTR-DEMO8F3D',
        trigger: 'SLIPPAGE_BREACH',
        amount: 18_500,
        corridor: 'PHP → SGD',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      })
      pending.push(hitlStore.get(seedId)!)
    }
  }

  res.json(pending)
})

// ── POST /api/hitl/:id/resolve ────────────────────────────────────────────────
/**
 * Submit a human reviewer decision on a HITL-paused transaction.
 * Body: { decision: 'APPROVE' | 'REJECT', reviewer: string }
 */
app.post('/api/hitl/:id/resolve', (req: Request, res: Response) => {
  const { id } = req.params
  const { decision, reviewer } = req.body

  if (!['APPROVE', 'REJECT'].includes(decision)) {
    res.status(400).json({ error: 'decision must be APPROVE or REJECT' })
    return
  }

  const record = hitlStore.get(id)
  if (!record) {
    res.status(404).json({ error: `HITL record ${id} not found.` })
    return
  }

  record.status = 'RESOLVED'
  record.finalVerdict = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED'
  record.humanReviewer = reviewer ?? 'Operator'
  record.resolvedAt = new Date().toISOString()

  console.log(`[HITL] ${id} resolved: ${record.finalVerdict} by ${record.humanReviewer}`)

  res.json({
    success: true,
    message: `Transaction ${record.transactionId} ${record.finalVerdict} by ${record.humanReviewer}.`,
    record,
  })
})

// ── 404 Catch-All ─────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found. Check the CenDTrus Remit API docs.' })
})

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[CenDTrus Remit Server] Unhandled error:', err.message)
  res.status(500).json({ error: 'Internal server error', detail: err.message })
})

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║         CenDTrus Remit — Stellar Rail Adapter            ║
║         "We are the Pipe, not the Water."                ║
╠══════════════════════════════════════════════════════════╣
║  Server running on http://localhost:${PORT}                 ║
║  Network:  Stellar Testnet (Horizon)                     ║
║  Rails:    Stellar Rail 03 (primary)                     ║
║            Ripple ODL Rail 01 (read-only visibility)     ║
╚══════════════════════════════════════════════════════════╝
  `)
})

// ── Utilities ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function truncateKey(key: string): string {
  if (key.length <= 12) return key
  return `${key.slice(0, 4)}...${key.slice(-4)}`
}

function generateShortHash(): string {
  const chars = '0123456789ABCDEF'
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('') + '...' +
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default app
