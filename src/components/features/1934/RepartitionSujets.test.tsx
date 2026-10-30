import type { PartSujet, Sujet } from '@/domain/1934'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { RepartitionSujets, formatPourcentage } from './RepartitionSujets'

/**
 * RepartitionSujets — Nivo mocké à la frontière (C-009 comme partout) : le mock peint une
 * ligne par segment, libellée « label · valeur · couleur », ce qui permet d'assertionner
 * l'appariement libellé/couleur sans tester le SVG.
 */
vi.mock('@nivo/pie', async () => {
  const React = await import('react')
  return {
    ResponsivePie: ({ data }: { data: Array<{ id: string; label: string; value: number }> }) =>
      React.createElement(
        'div',
        null,
        data.map((ligne) =>
          React.createElement('p', { key: ligne.id }, `donut ${ligne.label} ${ligne.value}`),
        ),
      ),
  }
})

const SUJETS: Sujet[] = [
  {
    id: 'desarmement',
    label: 'La crise du désarmement',
    featured: true,
    teaser: '…',
    description: '…',
  },
  { id: 'ligues', label: 'La menace des ligues', featured: true, teaser: '…', description: '…' },
]

describe('formatPourcentage', () => {
  it('formate à la française, une décimale, espace insécable avant le signe', () => {
    expect(formatPourcentage(50)).toBe('50,0\u00a0%')
    expect(formatPourcentage((1 / 3) * 100)).toBe('33,3\u00a0%')
  })
})

describe('RepartitionSujets', () => {
  it('peint un segment par sujet avec son libellé réel et son compte', () => {
    const parts: PartSujet[] = [
      { sujetId: 'ligues', documents: 3, pourcentage: 60 },
      { sujetId: 'desarmement', documents: 2, pourcentage: 40 },
    ]
    render(<RepartitionSujets parts={parts} sujets={SUJETS} />)
    expect(screen.getByRole('heading', { level: 3, name: 'Répartition des sujets' })).toBeVisible()
    expect(screen.getByText('donut La menace des ligues 3')).toBeInTheDocument()
    expect(screen.getByText('donut La crise du désarmement 2')).toBeInTheDocument()
  })

  it('retombe sur l’identifiant si le sujet a disparu du corpus (pas de crash)', () => {
    const parts: PartSujet[] = [{ sujetId: 'fantome', documents: 1, pourcentage: 100 }]
    render(<RepartitionSujets parts={parts} sujets={SUJETS} />)
    expect(screen.getByText('donut fantome 1')).toBeInTheDocument()
  })

  it('lot vide : rien n’est rendu (le panneau du jour dit déjà l’absence)', () => {
    const { container } = render(<RepartitionSujets parts={[]} sujets={SUJETS} />)
    expect(container).toBeEmpty()
  })
})
