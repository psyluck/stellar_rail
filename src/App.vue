<template>
  <!--
    CenDTrus Remit — Root Application Shell
    Provides the mint-green page surface and renders the master dashboard.
    All layout, theming, and panel logic lives in CenDTrusDashboard.vue.
  -->
  <div class="min-h-screen bg-mint font-display">
    <!-- ── Top Navigation Bar ────────────────────────────────────────────── -->
    <header class="bg-navy border-b border-navy-border sticky top-0 z-50">
      <div class="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between">
        <!-- Brand Wordmark -->
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-emerald-accent flex items-center justify-center shadow-emerald-glow">
            <span class="text-white font-bold text-sm">Ȼ</span>
          </div>
          <div>
            <span class="text-white font-bold text-lg tracking-tight">CenDTrus</span>
            <span class="text-emerald-accent-glow font-light text-lg ml-1">Remit</span>
          </div>
          <div class="hidden sm:block ml-4 px-2.5 py-0.5 bg-navy-light border border-navy-border rounded-full">
            <span class="text-slate-ghost text-xs font-finance tracking-wider uppercase">Stellar Rail v1.0</span>
          </div>
        </div>

        <!-- Network Status Badges -->
        <div class="flex items-center gap-4">
          <!-- Stellar Testnet Live Badge -->
          <div class="flex items-center gap-2 px-3 py-1.5 bg-navy-light rounded-xl border border-emerald-accent/20">
            <span class="status-dot bg-emerald-accent-glow animate-live-pulse"></span>
            <span class="text-emerald-accent text-xs font-finance font-medium">STELLAR TESTNET</span>
          </div>
          <!-- Network Epoch -->
          <div class="hidden md:flex items-center gap-2 px-3 py-1.5 bg-navy-light rounded-xl border border-navy-border">
            <span class="text-slate-ghost text-xs font-finance">EPOCH</span>
            <span class="text-slate-mid text-xs font-finance font-medium">{{ currentEpoch }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- ── Main Dashboard ─────────────────────────────────────────────────── -->
    <main class="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">
      <CenDTrusDashboard />
    </main>

    <!-- ── Footer ─────────────────────────────────────────────────────────── -->
    <footer class="border-t border-mint-border mt-12 py-6 px-6">
      <div class="max-w-screen-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-navy/40 font-finance">
        <span>© 2026 CenTrus Inc. — Legazpi City, Philippines. All rights reserved.</span>
        <span class="italic">"We are the Pipe, not the Water."</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import CenDTrusDashboard from '@/components/CenDTrusDashboard.vue'

// Display the current Stellar ledger epoch (simulated incrementing sequence)
const currentEpoch = ref<number>(52_304_188)

let epochInterval: ReturnType<typeof setInterval>

onMounted(() => {
  // Stellar closes a ledger every ~5 seconds — simulate epoch ticks
  epochInterval = setInterval(() => {
    currentEpoch.value += 1
  }, 5000)
})

onUnmounted(() => {
  clearInterval(epochInterval)
})
</script>
