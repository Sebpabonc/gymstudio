import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    headers: noCacheHeaders,
  },
  preview: {
    headers: noCacheHeaders,
  },
})
