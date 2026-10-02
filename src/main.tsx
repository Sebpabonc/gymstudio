import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

async function clearLegacyRuntimeState() {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((registration) => registration.unregister()))
    }

    if ('caches' in window) {
      const cacheKeys = await caches.keys()
      await Promise.all(cacheKeys.map((cacheKey) => caches.delete(cacheKey)))
    }
  } catch {
    // Ignore cleanup failures and continue booting the app.
  }
}

void clearLegacyRuntimeState()

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
