import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useCorpus1934, useDocumentsDuSujet, useListesDeFiltres, useSujet1934 } from './useCorpus1934'

/**
 * Hooks de lecture sur le corpus réel du dépôt (renderHook, sans wrapper : le hook ne dépend
 * d'aucun contexte). La branche d'échec est testée dans `useCorpus1934.erreur.test.ts`,
 * mockée à la frontière du port.
 */

describe('useCorpus1934', () => {
  it('expose le corpus chargé sous la forme { ok: true, corpus }', () => {
    const { result } = renderHook(() => useCorpus1934())
    expect(result.current.ok).toBe(true)
    if (!result.current.ok) return
    expect(result.current.corpus.sujets).toHaveLength(6)
    expect(result.current.corpus.documents).toHaveLength(100)
  })

  it('renvoie la même référence entre deux re-rendus (mémoïsation du port, pas de cache maison)', () => {
    const { result, rerender } = renderHook(() => useCorpus1934())
    const premier = result.current
    rerender()
    expect(result.current).toBe(premier)
  })
})

describe('hooks dérivés', () => {
  it('useSujet1934 retrouve le sujet par son id', () => {
    const { result } = renderHook(() => useSujet1934('ligues'))
    expect(result.current.ok).toBe(true)
    if (!result.current.ok) return
    expect(result.current.sujet?.id).toBe('ligues')
  })

  it('useSujet1934 sur id inconnu : ok sans sujet (le 404 se décide à l’écran)', () => {
    const { result } = renderHook(() => useSujet1934('nimporte-quoi'))
    expect(result.current.ok).toBe(true)
    if (!result.current.ok) return
    expect(result.current.sujet).toBeUndefined()
  })

  it('useDocumentsDuSujet sert les documents du sujet, triés par date', () => {
    const { result } = renderHook(() => useDocumentsDuSujet('foire-aux-valeurs'))
    expect(result.current.ok).toBe(true)
    if (!result.current.ok) return
    const dates = result.current.documents.map((doc) => doc.date)
    expect(dates.length).toBeGreaterThan(0)
    expect([...dates].sort()).toEqual(dates)
  })

  it('useListesDeFiltres sert journaux et locuteurs distincts triés', () => {
    const { result } = renderHook(() => useListesDeFiltres())
    expect(result.current.ok).toBe(true)
    if (!result.current.ok) return
    expect(result.current.journaux.length).toBeGreaterThanOrEqual(5)
    expect(result.current.locuteurs).toHaveLength(8)
    expect(result.current.journaux).toEqual(
      [...result.current.journaux].sort((a, b) => a.localeCompare(b, 'fr')),
    )
  })
})
