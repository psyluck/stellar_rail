<template>
  <!--
    CenDTrus Remit — Root Application Shell v2
    Adds a collapsible sidebar navigation alongside the existing dashboard.
    Sidebar provides: nav links, rail status, client tier, active route indicator.
  -->
  <div class="min-h-screen bg-mint font-display flex flex-col">

    <!-- ── Top Navigation Bar ──────────────────────────────────────────────── -->
    <header class="bg-navy border-b border-navy-border sticky top-0 z-50">
      <div class="flex items-center justify-between px-4 py-3">

        <!-- Left: Hamburger + Brand -->
        <div class="flex items-center gap-3">
          <!-- Sidebar toggle -->
          <button
            @click="sidebarOpen = !sidebarOpen"
            class="w-8 h-8 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-navy-light transition-colors"
            :aria-label="sidebarOpen ? 'Close menu' : 'Open menu'"
          >
            <span
              class="block w-4 h-0.5 bg-slate-ghost transition-all duration-300"
              :class="sidebarOpen ? 'rotate-45 translate-y-2' : ''"
            ></span>
            <span
              class="block w-4 h-0.5 bg-slate-ghost transition-all duration-300"
              :class="sidebarOpen ? 'opacity-0' : ''"
            ></span>
            <span
              class="block w-4 h-0.5 bg-slate-ghost transition-all duration-300"
              :class="sidebarOpen ? '-rotate-45 -translate-y-2' : ''"
            ></span>
          </button>

          <!-- Brand Wordmark -->
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-emerald-accent flex items-center justify-center shadow-emerald-glow">
              <span class="text-white font-bold text-sm">Ȼ</span>
            </div>
            <div>
              <span class="text-white font-bold text-lg tracking-tight">CenDTrus</span>
              <span class="text-emerald-accent-glow font-light text-lg ml-1">Remit</span>
            </div>
            <div class="hidden sm:block ml-2 px-2.5 py-0.5 bg-navy-light border border-navy-border rounded-full">
              <span class="text-slate-ghost text-xs font-finance tracking-wider uppercase">Stellar Rail v1.0</span>
            </div>
          </div>
        </div>

        <!-- Right: Network badges -->
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-2 px-3 py-1.5 bg-navy-light rounded-xl border border-emerald-accent/20">
            <span class="status-dot bg-emerald-accent-glow animate-live-pulse"></span>
            <span class="text-emerald-accent text-xs font-finance font-medium">STELLAR TESTNET</span>
          </div>
          <div class="hidden md:flex items-center gap-2 px-3 py-1.5 bg-navy-light rounded-xl border border-navy-border">
            <span class="text-slate-ghost text-xs font-finance">EPOCH</span>
            <span class="text-slate-mid text-xs font-finance font-medium">{{ currentEpoch }}</span>
          </div>
        </div>

      </div>
    </header>

    <!-- ── Body: Sidebar + Main Content ───────────────────────────────────── -->
    <div class="flex flex-1 relative">

      <!-- ── Sidebar ─────────────────────────────────────────────────────── -->
      <aside
        class="fixed top-[57px] left-0 h-[calc(100vh-57px)] z-40 flex flex-col bg-navy border-r border-navy-border transition-all duration-300 overflow-hidden"
        :class="sidebarOpen ? 'w-64' : 'w-0'"
      >
        <div class="flex flex-col h-full w-64 overflow-y-auto">

          <!-- Client Account Card -->
          <div class="p-4 border-b border-navy-border">
            <div class="bg-navy-light rounded-xl p-3 border border-navy-border">
              <div class="flex items-center gap-3 mb-2">
                <div class="w-9 h-9 rounded-lg bg-emerald-accent/15 border border-emerald-accent/30 flex items-center justify-center shrink-0">
                  <span class="text-emerald-accent font-bold text-sm font-finance">C</span>
                </div>
                <div class="min-w-0">
                  <p class="text-white text-xs font-semibold truncate">CenDTrus Remit</p>
                  <p class="text-slate-ghost text-xs font-finance truncate">Philippines</p>
                </div>
              </div>
              <!-- Tier badge -->
              <div class="flex items-center justify-between mt-1">
                <span class="px-2 py-0.5 bg-emerald-accent/10 border border-emerald-accent/25 rounded-full text-emerald-accent text-xs font-finance font-bold">
                  REMIT TIER
                </span>
                <span class="flex items-center gap-1">
                  <span class="status-dot bg-emerald-accent-glow animate-live-pulse w-1.5 h-1.5"></span>
                  <span class="text-emerald-accent text-xs font-finance">ACTIVE</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Navigation Links -->
          <nav class="flex-1 p-3 space-y-1">

            <!-- Section label -->
            <p class="text-slate-ghost text-xs font-finance uppercase tracking-widest px-3 py-2">
              Main
            </p>

            <button
              v-for="item in navItems"
              :key="item.id"
              @click="setActiveNav(item.id)"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group"
              :class="activeNav === item.id
                ? 'bg-emerald-accent/15 border border-emerald-accent/25 text-emerald-accent'
                : 'text-slate-ghost hover:bg-navy-light hover:text-slate-mid border border-transparent'"
            >
              <span class="text-base shrink-0">{{ item.icon }}</span>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-finance font-semibold truncate"
                  :class="activeNav === item.id ? 'text-emerald-accent' : 'text-slate-mid group-hover:text-white'"
                >{{ item.label }}</p>
                <p class="text-xs font-finance truncate mt-0.5"
                  :class="activeNav === item.id ? 'text-emerald-accent/60' : 'text-slate-ghost'"
                >{{ item.sub }}</p>
              </div>
              <!-- Active indicator -->
              <span
                v-if="activeNav === item.id"
                class="w-1.5 h-1.5 rounded-full bg-emerald-accent shrink-0"
              ></span>
              <!-- Badge -->
              <span
                v-if="item.badge"
                class="shrink-0 px-1.5 py-0.5 rounded-full text-xs font-finance font-bold"
                :class="item.badgeColor"
              >{{ item.badge }}</span>
            </button>

            <!-- Section label -->
            <p class="text-slate-ghost text-xs font-finance uppercase tracking-widest px-3 py-2 mt-4">
              Rails
            </p>

            <!-- Rail 03 — Stellar (active) -->
            <div class="px-3 py-2.5 rounded-xl bg-navy-light border border-emerald-accent/20">
              <div class="flex items-center gap-2 mb-1">
                <span class="status-dot bg-emerald-accent-glow animate-live-pulse w-1.5 h-1.5"></span>
                <span class="text-emerald-accent text-xs font-finance font-bold">RAIL 03 — STELLAR</span>
              </div>
              <p class="text-slate-ghost text-xs font-finance pl-3.5">Primary · SME & Mid-Market</p>
            </div>

            <!-- Rail 01 — Sovereign (read-only) -->
            <div class="px-3 py-2.5 rounded-xl border border-navy-border opacity-60">
              <div class="flex items-center gap-2 mb-1">
                <span class="status-dot bg-slate-ghost w-1.5 h-1.5"></span>
                <span class="text-slate-ghost text-xs font-finance font-bold">RAIL 01 — SOVEREIGN</span>
              </div>
              <p class="text-slate-ghost text-xs font-finance pl-3.5">Institutional · Read-only</p>
            </div>

          </nav>

          <!-- Bottom: Corridor + Version -->
          <div class="p-4 border-t border-navy-border space-y-3">
            <!-- Active corridor -->
            <div class="bg-navy-light rounded-xl p-3 border border-navy-border">
              <p class="text-slate-ghost text-xs font-finance uppercase tracking-wider mb-1.5">Active Corridor</p>
              <div class="flex items-center justify-between">
                <span class="text-white text-xs font-finance font-bold">PHP → USD</span>
                <span class="px-2 py-0.5 bg-emerald-accent/10 border border-emerald-accent/25 rounded-full text-emerald-accent text-xs font-finance">LIVE</span>
              </div>
              <p class="text-slate-ghost text-xs font-finance mt-1">More corridors on roadmap</p>
            </div>

            <!-- Version info -->
            <div class="flex items-center justify-between px-1">
              <span class="text-slate-ghost text-xs font-finance">v1.0.0 · Testnet</span>
              <span class="text-slate-ghost text-xs font-finance">© 2026</span>
            </div>
          </div>

        </div>
      </aside>

      <!-- Sidebar overlay (mobile) -->
      <div
        v-if="sidebarOpen"
        @click="sidebarOpen = false"
        class="fixed inset-0 bg-navy/60 z-30 md:hidden"
        style="top: 57px"
      ></div>

      <!-- ── Main Content ─────────────────────────────────────────────────── -->
      <main
        class="flex-1 transition-all duration-300 min-h-[calc(100vh-57px)]"
        :class="sidebarOpen ? 'md:ml-64' : 'ml-0'"
      >
        <div class="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8">

          <!-- Dashboard view -->
          <CenDTrusDashboard v-if="activeNav === 'dashboard'" />

          <!-- Transactions view -->
          <div v-else-if="activeNav === 'transactions'" class="space-y-6">
            <div>
              <p class="text-emerald-accent text-xs font-finance font-bold tracking-widest uppercase mb-1">Settlement Ledger</p>
              <h1 class="text-3xl font-bold text-navy tracking-tight">Transaction History</h1>
              <p class="text-navy/50 text-sm mt-1">All settled atomic transactions on Stellar Rail 03.</p>
            </div>
            <TransactionHistory />
          </div>

          <!-- Corridors view -->
          <div v-else-if="activeNav === 'corridors'" class="space-y-6">
            <div>
              <p class="text-emerald-accent text-xs font-finance font-bold tracking-widest uppercase mb-1">Settlement Corridors</p>
              <h1 class="text-3xl font-bold text-navy tracking-tight">Corridor Management</h1>
              <p class="text-navy/50 text-sm mt-1">Active and planned cross-border payment corridors.</p>
            </div>
            <CorridorPanel />
          </div>

          <!-- Compliance view -->
          <div v-else-if="activeNav === 'compliance'" class="space-y-6">
            <div>
              <p class="text-emerald-accent text-xs font-finance font-bold tracking-widest uppercase mb-1">Symphony HITL</p>
              <h1 class="text-3xl font-bold text-navy tracking-tight">Compliance Center</h1>
              <p class="text-navy/50 text-sm mt-1">Sovereign Shield audit log and HITL review history.</p>
            </div>
            <!-- Placeholder — wire to HITL data -->
            <div class="card-navy p-8 text-center">
              <p class="text-slate-ghost text-sm font-finance">Full compliance audit log coming in Phase 2.</p>
              <p class="text-slate-ghost text-xs font-finance mt-2">Current HITL queue is visible on the Dashboard panel.</p>
            </div>
          </div>

          <!-- Settings view -->
          <div v-else-if="activeNav === 'settings'" class="space-y-6">
            <div>
              <p class="text-emerald-accent text-xs font-finance font-bold tracking-widest uppercase mb-1">Configuration</p>
              <h1 class="text-3xl font-bold text-navy tracking-tight">Settings</h1>
              <p class="text-navy/50 text-sm mt-1">Rail configuration, API keys, and account preferences.</p>
            </div>
            <div class="card-navy p-8 text-center">
              <p class="text-slate-ghost text-sm font-finance">Settings panel coming in Phase 2.</p>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <footer class="border-t border-mint-border py-6 px-6 mt-4">
          <div class="max-w-screen-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-navy/40 font-finance">
            <span>© 2026 CenDTrus Remit Philippines. All rights reserved.</span>
            <span class="italic">"We are the Pipe, not the Water."</span>
          </div>
        </footer>
      </main>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import CenDTrusDashboard from '@/components/CenDTrusDashboard.vue'
import TransactionHistory from '@/components/TransactionHistory.vue'
import CorridorPanel from '@/components/CorridorPanel.vue'

// ── Sidebar state ──────────────────────────────────────────────────────────
const sidebarOpen = ref(true)

// ── Active nav ─────────────────────────────────────────────────────────────
const activeNav = ref('dashboard')

function setActiveNav(id: string) {
  activeNav.value = id
  // On mobile, close sidebar after navigation
  if (window.innerWidth < 768) sidebarOpen.value = false
}

// ── Nav items ──────────────────────────────────────────────────────────────
const navItems = ref([
  {
    id: 'dashboard',
    icon: '⚡',
    label: 'Dashboard',
    sub: 'Live pipeline overview',
    badge: null,
    badgeColor: '',
  },
  {
    id: 'transactions',
    icon: '📋',
    label: 'Transactions',
    sub: 'Settlement history & ledger',
    badge: null,
    badgeColor: '',
  },
  {
    id: 'corridors',
    icon: '🌏',
    label: 'Corridors',
    sub: 'PHP→USD and more',
    badge: '1',
    badgeColor: 'bg-emerald-accent/15 text-emerald-accent border border-emerald-accent/30',
  },
  {
    id: 'compliance',
    icon: '🛡️',
    label: 'Compliance',
    sub: 'HITL audit center',
    badge: null,
    badgeColor: '',
  },
  {
    id: 'settings',
    icon: '⚙️',
    label: 'Settings',
    sub: 'API keys & configuration',
    badge: null,
    badgeColor: '',
  },
])

// ── Epoch ticker ───────────────────────────────────────────────────────────
const currentEpoch = ref<number>(52_304_188)
let epochInterval: ReturnType<typeof setInterval>

onMounted(() => {
  epochInterval = setInterval(() => { currentEpoch.value += 1 }, 5000)
})

onUnmounted(() => {
  clearInterval(epochInterval)
})
</script>