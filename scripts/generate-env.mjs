import { fileURLToPath } from 'node:url'

/**
 * Génère `public/version.json` (canal « métadonnées de build » d'OBSERVABILITY).
 * Vite copie `public/` dans `dist/` : l'artefact publié est donc datable à coup sûr.
 * Lancé par `npm run build` et par la CI, jamais versionné.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function gitHash() {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root }).toString().trim()
  } catch {
    return 'unknown'
  }
}

const { name, version } = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))

const info = {
  name,
  version,
  gitHash: gitHash(),
  buildDate: new Date().toISOString(),
}

writeFileSync(resolve(root, 'public/version.json'), `${JSON.stringify(info, null, 2)}\n`)
console.log(`[generate-env] public/version.json → ${info.version} (${info.gitHash})`)
