import { App } from '@/App'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import '@/index.css'
import { config } from '@/platform/config'
import { UiError } from '@/platform/errors/base'
import { logger } from '@/platform/logging'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

logger.info('main', 'démarrage de l’application', { basePath: config.basePath, logLevel: config.logLevel })

const rootElement = document.getElementById('root')
if (rootElement === null) {
  throw new UiError('Élément #root introuvable : le montage est impossible.', { context: { id: 'root' } })
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
