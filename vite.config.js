import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Deep links and refresh on client routes (e.g. /compare) must serve index.html.
 * Without this, `vite preview` and many static hosts return 404 for direct /compare requests.
 */
function spaFallback() {
  return {
    name: 'spa-fallback',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next()
        const url = req.url?.split('?')[0] ?? ''
        if (
          url.startsWith('/@') ||
          url.startsWith('/node_modules/') ||
          url.startsWith('/src/') ||
          url.startsWith('/assets/') ||
          /\.[a-zA-Z0-9]+$/.test(url)
        ) {
          return next()
        }
        if (url === '/' || url === '') return next()
        const accept = req.headers.accept ?? ''
        if (!accept.includes('text/html')) return next()
        req.url = '/index.html'
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next()
        const url = req.url?.split('?')[0] ?? ''
        if (url.startsWith('/assets/') || /\.[a-zA-Z0-9]+$/.test(url)) {
          return next()
        }
        if (url === '/' || url === '') return next()
        const accept = req.headers.accept ?? ''
        if (!accept.includes('text/html')) return next()
        req.url = '/index.html'
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), spaFallback()],
})
