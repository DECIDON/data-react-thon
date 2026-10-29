/**
 * Module de logging unique (S-09 / OBSERVABILITY.md) : seul fichier du dépôt autorisé à toucher `console`
 * (exception d'override ESLint). Format imposé : `[niveau] domaine: message {context}`.
 * Le gating est piloté par `platform/config.ts` (VITE_LOG_LEVEL) ; en production, seul `error` passe.
 */

import { config } from './config'
import type { BaseError } from './errors/base'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

/* eslint-disable no-console -- module de logging : exception unique et assumée */

function write(level: LogLevel, domain: string, message: string, context?: Record<string, unknown>): void {
  if (ORDER[level] < ORDER[config.logLevel]) {
    return
  }
  const suffix =
    context === undefined || Object.keys(context).length === 0 ? '' : ` ${JSON.stringify(context)}`
  const line = `[${level}] ${domain}: ${message}${suffix}`
  switch (level) {
    case 'debug':
      console.debug(line)
      return
    case 'info':
      console.info(line)
      return
    case 'warn':
      console.warn(line)
      return
    case 'error':
      console.error(line)
      return
  }
}

export const logger = {
  debug: (domain: string, message: string, context?: Record<string, unknown>): void =>
    write('debug', domain, message, context),
  info: (domain: string, message: string, context?: Record<string, unknown>): void =>
    write('info', domain, message, context),
  warn: (domain: string, message: string, context?: Record<string, unknown>): void =>
    write('warn', domain, message, context),
  /** Erreurs structurées = premier canal : l'erreur typée est sérialisée, jamais remplacée. */
  error: (domain: string, error: BaseError): void =>
    write('error', domain, error.message, error.context as Record<string, unknown>),
}

/* eslint-enable no-console */
