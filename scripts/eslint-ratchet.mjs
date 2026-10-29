/**
 * Ratchet ESLint — baseline 0 (STARTER.md §1, leçon Q1/Q3 du projet source).
 * Le nombre de diagnostics ne peut que DESCENDRE : toute remontée casse le build.
 * La baseline est versionnée et commentée ; sa réduction est libre, son augmentation est un choix assumé en revue.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const baseline = JSON.parse(readFileSync(resolve(root, '.eslint-ratchet.json'), 'utf8')).baseline

let diagnostics = 0
try {
  const report = JSON.parse(
    execFileSync(resolve(root, 'node_modules/.bin/eslint'), ['.', '--format', 'json'], {
      cwd: root,
      maxBuffer: 64 * 1024 * 1024,
    }).toString(),
  )
  diagnostics = report.reduce((sum, file) => sum + file.errorCount + file.warningCount, 0)
} catch (error) {
  // ESLint sort en code 1 lorsqu'il trouve des erreurs : le JSON est quand même sur stdout.
  const stdout = error?.stdout?.toString()
  if (!stdout) throw error
  const report = JSON.parse(stdout)
  diagnostics = report.reduce((sum, file) => sum + file.errorCount + file.warningCount, 0)
}

if (diagnostics > baseline) {
  console.error(
    `[ratchet] ${diagnostics} diagnostic(s) > baseline ${baseline}. Corrige-les ou assume-les en revue.`,
  )
  process.exit(1)
}

if (diagnostics < baseline) {
  console.log(`[ratchet] ${diagnostics} < baseline ${baseline} : pense à abaisser .eslint-ratchet.json`)
}

console.log(`[ratchet] OK (${diagnostics}/${baseline})`)
