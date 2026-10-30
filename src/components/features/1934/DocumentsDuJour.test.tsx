import type { Document1934, Sujet } from '@/domain/1934'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'
import { DocumentsDuJour, suivrevers } from './DocumentsDuJour'

/**
 * Panneau du jour — cartes-liens (post-R9) : cliquer une carte ouvre son sujet dans la page
 * sujet, le lien profond `?doc=` rouvrant le détail du document. Assertions sur libellés
 * réels et href (C-006), routeur en mémoire.
 */

const SUJETS: Sujet[] = [
  {
    id: 'desarmement',
    label: 'Le désarmement',
    featured: true,
    teaser: '…',
    description: '…',
  },
  {
    id: 'ligues',
    label: 'Les ligues',
    featured: false,
    teaser: '…',
    description: '…',
  },
]

const DOC: Document1934 = {
  id: 'cp-001',
  date: '1934-02-14',
  source: { title: 'Le Torchon lorrain — édition du 14 février 1934', url: null },
  content: 'Extrait de teste.',
  subjects: [
    { topicId: 'ligues', polarity: 'negatif' },
    { topicId: 'desarmement', polarity: 'positif' },
  ],
}

function SondeUrl() {
  const location = useLocation()
  return <span data-sonde>{`${location.pathname}${location.search}`}</span>
}

function renduAvecRoute(cheminInitial = '/') {
  return render(
    <MemoryRouter initialEntries={[cheminInitial]}>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <DocumentsDuJour jour="1934-02-14" documents={[DOC]} sujets={SUJETS} />
              <SondeUrl />
            </>
          }
        />
        <Route path="/sujet/:id" element={<SondeUrl />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('suivrevers', () => {
  it('vise le premier sujet du corpus et porte le lien profond', () => {
    expect(suivrevers(DOC)).toBe('/sujet/ligues?doc=cp-001')
  })

  it('rend undefined pour un document sans sujet (jamais d’URL fabriquée)', () => {
    expect(suivrevers({ ...DOC, subjects: [] })).toBeUndefined()
  })
})

describe('DocumentsDuJour', () => {
  it('offre chaque carte comme lien vers le sujet, ancre de détail incluse', () => {
    renduAvecRoute()
    const lien = screen.getByRole('link', { name: /^ouvrir le sujet depuis cette coupe de presse/i })
    expect(lien).toHaveAttribute('href', '/sujet/ligues?doc=cp-001')
  })

  it('un clic sur la carte ouvre la page sujet du document', async () => {
    renduAvecRoute()
    await userEvent.click(
      screen.getByRole('link', { name: /^ouvrir le sujet depuis cette coupe de presse/i }),
    )
    expect(screen.getByText('/sujet/ligues?doc=cp-001')).toBeInTheDocument()
  })
})
