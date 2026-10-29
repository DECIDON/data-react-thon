import { DataError } from '@/platform/errors/base'
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useCorpus1934, useDocumentsDuSujet, useListesDeFiltres, useSujet1934 } from './useCorpus1934'

/**
 * Branche d'échec : le port est mocké pour simuler un JSON de corpus invalide.
 * La promesse tenue : l'erreur est rendue (`{ ok: false, error }`), jamais projetée.
 */

const erreur = new DataError('corpus volontairement invalide (brouette de test)')

vi.mock('@/data/1934/repository', () => ({
  chargerCorpus: () => ({ ok: false, error: erreur }),
  sujetParId: vi.fn(),
  documentsParSujet: vi.fn(),
  journaux: vi.fn(),
  locuteurs: vi.fn(),
}))

describe('useCorpus1934 — échec du port', () => {
  it('rend l’erreur typée sans throw, pour les quatre hooks', () => {
    const hooks: Array<() => { ok: boolean; error?: unknown }> = [
      () => useCorpus1934(),
      () => useSujet1934('desarmement'),
      () => useDocumentsDuSujet('desarmement'),
      () => useListesDeFiltres(),
    ]
    for (const hook of hooks) {
      const { result } = renderHook(hook)
      expect(result.current.ok).toBe(false)
      expect(result.current.error).toBe(erreur)
    }
  })
})
