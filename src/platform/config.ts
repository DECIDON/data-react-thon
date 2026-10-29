/**
 * Configuration build-time unique (ARCHITECTURE.md §6) : les `VITE_*` sont publiques par design
 * (inlinées au build, voir .env.example). Validation au démarrage : une configuration invalide
 * échoue fort ici, pas en silence plus loin (ConfigError).
 */

import { ConfigError } from './errors/base'
import type { LogLevel } from './logging'

export interface AppConfig {
  /** Sous-chemin de publication ('' = racine). Sert aussi de basename au routeur. */
  readonly basePath: string
  readonly appTitle: string
  readonly logLevel: LogLevel
}

const LOG_LEVELS: readonly LogLevel[] = ['debug', 'info', 'warn', 'error']

function parseBasePath(raw: string | undefined): string {
  if (raw === undefined || raw === '') {
    return '/'
  }
  if (!raw.startsWith('/') || raw === '//') {
    throw new ConfigError('VITE_BASE_PATH invalide : il doit commencer par « / ».', { context: { raw } })
  }
  return raw.endsWith('/') ? raw : `${raw}/`
}

function parseLogLevel(raw: string | undefined): LogLevel {
  if (raw === undefined || raw === '') {
    return import.meta.env.PROD ? 'error' : 'debug'
  }
  if (!LOG_LEVELS.includes(raw as LogLevel)) {
    throw new ConfigError('VITE_LOG_LEVEL invalide (debug | info | warn | error).', { context: { raw } })
  }
  return raw as LogLevel
}

const env = import.meta.env

export const config: AppConfig = Object.freeze({
  basePath: parseBasePath(env.VITE_BASE_PATH),
  appTitle: env.VITE_APP_TITLE ?? 'Data React Thon',
  logLevel: parseLogLevel(env.VITE_LOG_LEVEL),
})
