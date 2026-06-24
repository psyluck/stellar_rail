// ─────────────────────────────────────────────────────────────────────────────
// CenDTrus Remit — Application Entry Point
// Mounts the Vue 3 application and imports global Tailwind styles.
// ─────────────────────────────────────────────────────────────────────────────

import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

const app = createApp(App)
app.mount('#app')
