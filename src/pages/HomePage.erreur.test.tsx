import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { HomePage } from './HomePage'

/**
 * Branche `ok:false` du hook (corpus invalide au parse) : l'accueil reste rendu, le
 * message du port est lisible dans une rôle `alert` — pas de crash silencieux, pas
 * d'`ErrorBoundary` déclenché. Nivo mocké pour la même raison que le test nominal.
 */
vi.mock('@nivo/calendar', () => ({ ResponsiveCalendar: () => null }))

vi.mock('@/data/1934/repository', async () => {
  const { DataError } = await import('@/platform/errors/base')
  return {
    chargerCorpus: () => ({
      ok: false as const,
      error: new DataError('corpus volontairement invalide (brouette de test)'),
    }),
    sujetParId: vi.fn(),
    documentsParSujet: vi.fn(),
    journaux: vi.fn(),
    locuteurs: vi.fn(),
  }
})

describe('HomePage — corpus en échec', () => {
  it('affiche le titre sobre et le message d’erreur du port, sans calendrier ni vitrine', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Presse & palabre' })).toBeVisible()
    const alerte = screen.getByRole('alert')
    expect(alerte).toHaveTextContent('Le corpus 1934 n’a pas pu être chargé.')
    expect(alerte).toHaveTextContent('corpus volontairement invalide (brouette de test)')
    expect(screen.queryByRole('heading', { name: 'Sujets en vitrine' })).toBeNull()
  })
})
