import { BaseError } from '@/platform/errors/base'
import { logger } from '@/platform/logging'
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  readonly children: ReactNode
}

interface State {
  readonly error: Error | null
}

/**
 * Boundary global (ARCHITECTURE.md §5, P9) : l'erreur typée est relayée au logger,
 * jamais remplacée par un message générique. Le fallback reste lisible par l'utilisateur.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    const typed = error instanceof BaseError ? error : new BaseError(error.message, { cause: error })
    logger.error('ui', typed)
    void info // composant+pile utiles dans `cause` ; extraction fine prévue au premier écran métier
  }

  override render(): ReactNode {
    if (this.state.error !== null) {
      return (
        <main role="alert" className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8">
          <h1 className="text-2xl font-semibold">L’application a rencontré une erreur inattendue.</h1>
          <p className="text-neutral-600">
            L’erreur a été journalisée. Rechargez la page ; si le problème persiste, consultez le journal
            (niveaux <code>debug</code> via <code>VITE_LOG_LEVEL</code>).
          </p>
        </main>
      )
    }
    return this.props.children
  }
}
