<template>
  <div class="space-y-4">

    <!-- Active Corridors -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="corridor in corridors"
        :key="corridor.id"
        class="card-navy p-5"
      >
        <!-- Header -->
        <div class="flex items-start justify-between mb-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span
                class="status-dot"
                :class="{
                  'bg-emerald-accent-glow animate-live-pulse': corridor.status === 'LIVE',
                  'bg-slate-ghost': corridor.status === 'PLANNED',
                  'bg-amber-400': corridor.status === 'COMING SOON',
                }"
              ></span>
              <span class="text-white font-semibold text-sm">{{ corridor.from }} → {{ corridor.to }}</span>
            </div>
            <p class="text-slate-ghost text-xs font-finance">{{ corridor.description }}</p>
          </div>
          <span
            class="px-2.5 py-1 rounded-lg text-xs font-finance font-bold"
            :class="{
              'bg-emerald-accent/15 text-emerald-accent border border-emerald-accent/30': corridor.status === 'LIVE',
              'bg-navy-border/50 text-slate-ghost border border-navy-border': corridor.status === 'PLANNED',
              'bg-amber-500/15 text-amber-400 border border-amber-500/30': corridor.status === 'COMING SOON',
            }"
          >{{ corridor.status }}</span>
        </div>

        <!-- Metrics -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-navy-light rounded-xl p-3 border border-navy-border">
            <p class="text-slate-ghost text-xs font-finance uppercase">Asset</p>
            <p class="text-emerald-accent font-finance font-bold text-sm mt-0.5">{{ corridor.asset }}</p>
          </div>
          <div class="bg-navy-light rounded-xl p-3 border border-navy-border">
            <p class="text-slate-ghost text-xs font-finance uppercase">Rail</p>
            <p class="text-white font-finance font-bold text-sm mt-0.5">{{ corridor.rail }}</p>
          </div>
          <div class="bg-navy-light rounded-xl p-3 border border-navy-border">
            <p class="text-slate-ghost text-xs font-finance uppercase">Finality</p>
            <p class="font-finance font-bold text-sm mt-0.5"
              :class="corridor.status === 'LIVE' ? 'text-emerald-accent-glow' : 'text-slate-ghost'"
            >{{ corridor.finality }}</p>
          </div>
          <div class="bg-navy-light rounded-xl p-3 border border-navy-border">
            <p class="text-slate-ghost text-xs font-finance uppercase">24H Vol</p>
            <p class="text-white font-finance font-bold text-sm mt-0.5">{{ corridor.volume }}</p>
          </div>
        </div>

        <!-- Live verify link -->
        <div v-if="corridor.status === 'LIVE'" class="mt-4 pt-4 border-t border-navy-border">
          <a
            href="https://stellar.expert/explorer/testnet"
            target="_blank"
            rel="noopener"
            class="flex items-center gap-2 text-sky-400 hover:text-sky-300 text-xs font-finance transition-colors"
          >
            <span>🔗</span>
            <span class="underline underline-offset-2">Verify live on Stellar Expert</span>
          </a>
        </div>

        <!-- Planned badge -->
        <div v-else class="mt-4 pt-4 border-t border-navy-border">
          <p class="text-slate-ghost text-xs font-finance">{{ corridor.eta }}</p>
        </div>
      </div>
    </div>

    <!-- Routing logic card -->
    <div class="card-navy p-5">
      <p class="text-emerald-accent text-xs font-finance font-bold uppercase tracking-widest mb-4">
        Auto-Routing Logic
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-navy-light rounded-xl p-4 border border-navy-border">
          <p class="text-emerald-accent text-xs font-finance font-bold mb-2">SME & Mid-Market</p>
          <p class="text-slate-mid text-xs font-finance leading-relaxed">
            Corridor liquidity adequate → Stellar Rail 03. Sub-5s finality. XLM native settlement.
          </p>
        </div>
        <div class="bg-navy-light rounded-xl p-4 border border-navy-border">
          <p class="text-amber-400 text-xs font-finance font-bold mb-2">Slippage Breach</p>
          <p class="text-slate-mid text-xs font-finance leading-relaxed">
            Sovereign Shield triggers → Symphony HITL. Client compliance officer makes the call.
          </p>
        </div>
        <div class="bg-navy-light rounded-xl p-4 border border-navy-border">
          <p class="text-slate-ghost text-xs font-finance font-bold mb-2">Institutional Volume</p>
          <p class="text-slate-mid text-xs font-finance leading-relaxed">
            Massively substantial transactions → auto-escalate to CenTrus Sovereign via Circle Arc.
          </p>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const corridors = ref([
  {
    id: 'php-usd',
    from: 'PHP',
    to: 'USD',
    description: 'Philippine Peso to US Dollar — primary OFW corridor',
    status: 'LIVE',
    asset: 'XLM / USDC',
    rail: 'Stellar Rail 03',
    finality: '< 5s',
    volume: '$4.1M / 24H',
    eta: '',
  },
  {
    id: 'php-sgd',
    from: 'PHP',
    to: 'SGD',
    description: 'Philippine Peso to Singapore Dollar',
    status: 'COMING SOON',
    asset: 'XLM / USDC',
    rail: 'Stellar Rail 03',
    finality: '< 5s',
    volume: '—',
    eta: 'Phase 2 · Post-mainnet deployment',
  },
  {
    id: 'php-aed',
    from: 'PHP',
    to: 'AED',
    description: 'Philippine Peso to UAE Dirham — OFW Middle East corridor',
    status: 'PLANNED',
    asset: 'XLM / USDC',
    rail: 'Stellar Rail 03',
    finality: '< 5s',
    volume: '—',
    eta: 'Phase 3 · Roadmap',
  },
  {
    id: 'php-jpy',
    from: 'PHP',
    to: 'JPY',
    description: 'Philippine Peso to Japanese Yen',
    status: 'PLANNED',
    asset: 'XLM / USDC',
    rail: 'Stellar Rail 03',
    finality: '< 5s',
    volume: '—',
    eta: 'Phase 3 · Roadmap',
  },
])
</script>
