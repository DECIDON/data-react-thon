/**
 * BaseError — seule racine d'erreur autorisée (D-002).
 * Fichier exempté par la règle `no-restricted-syntax` : c'est la liste blanche, elle doit rester le seul
 * endroit où une erreur naît d'un `new`. Le `context` JSON tient lieu de mini-log corrélé
 * (OBSERVABILITY.md canal 1) : il est sérialisable et n'est jamais substitué au diagnostic.
 */

export type ErrorContext = Readonly<Record<string, unknown>>

export interface BaseErrorOptions {
  readonly context?: ErrorContext
  readonly cause?: unknown
}

export class BaseError extends Error {
  readonly context: ErrorContext
  override readonly cause?: unknown

  constructor(message: string, options: BaseErrorOptions = {}) {
    // new.target (et non this.constructor) : le nom du sous-classement réel, même à travers les héritages.
    super(message)
    this.name = new.target.name
    this.context = options.context ?? {}
    if (options.cause !== undefined) {
      this.cause = options.cause
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      context: this.context,
      cause: serializeCause(this.cause),
    }
  }
}

export class ConfigError extends BaseError {}
export class UiError extends BaseError {}

function serializeCause(cause: unknown): unknown {
  if (cause instanceof Error) {
    return { name: cause.name, message: cause.message }
  }
  return cause
}
