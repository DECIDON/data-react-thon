import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

/**
 * CSP injectée UNIQUEMENT au build (jamais en dev : le HMR de Vite exige
 * scripts/ws que la CSP casserait). En hosting statique, `_headers` fait foi
 * en plus de la meta (SECURITY.md S-03).
 */
function cspAtBuild(): Plugin {
  return {
    name: 'csp-meta',
    apply: 'build',
    transformIndexHtml(html) {
      const csp = [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ')
      return html.replace(
        '<meta charset="UTF-8" />',
        `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`,
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), cspAtBuild()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Mode e2e : served à la racine, sans PWA ni SW (STARTER.md §1).
  base: mode === 'e2e' ? '/' : (process.env.VITE_BASE_PATH ?? '/'),
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      // Les seuls fichiers mesurables : les README/JSON font échouer le remap des source maps
      // (bruit « Failed to parse », lignes de rapport perdues au gré des courses).
      include: ['src/**/*.{ts,tsx}'],
      // Seuil ciblé sur le domaine pur (TESTING.md) ; pas de % global punitif.
      thresholds: { 'src/domain/**': { lines: 90, functions: 90, branches: 90, statements: 90 } },
    },
  },
}))
