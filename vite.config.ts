import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
}

export default defineConfig({
  // Relative asset paths: works on GitHub Pages (/gymstudio/) and inside Capacitor.
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    headers: noCacheHeaders,
    watch: {
      ignored: [
        '**/dist/**',
        '**/android/app/src/main/assets/public/**',
        '**/ios/App/App/public/**',
      ],
    },
  },
  preview: {
    headers: noCacheHeaders,
  },
})
