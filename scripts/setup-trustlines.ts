import { Horizon, Networks, Keypair, TransactionBuilder, Operation, Asset, BASE_FEE } from '@stellar/stellar-sdk'
import * as dotenv from 'dotenv'
dotenv.config()

const server = new Horizon.Server('https://horizon-testnet.stellar.org')
const USDC_ISSUER = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'

async function setupTrustlines() {
  const keypair = Keypair.fromSecret(process.env.STELLAR_DEMO_SECRET!)
  console.log('Setting trustlines for:', keypair.publicKey())
  const account = await server.loadAccount(keypair.publicKey())
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(Operation.changeTrust({ asset: new Asset('USDC', USDC_ISSUER) }))
    .setTimeout(30)
    .build()
  tx.sign(keypair)
  const result = await server.submitTransaction(tx)
  console.log('✅ Trustline set! Hash:', result.hash)
  console.log('🔗 https://stellar.expert/explorer/testnet/tx/' + result.hash)
}

setupTrustlines().catch(console.error)
