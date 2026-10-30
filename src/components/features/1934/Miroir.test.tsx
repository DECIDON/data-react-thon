import type { Document1934, Sujet } from '@/domain/1934'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Miroir } from './Miroir'

/**
 * Bloc miroir (spec §4.2) : les deux moitiés en regard avec leurs cartes, et le message
 * explicite quand un couloir manque. fixtures minimales conformes au contrat.
 */

const sujets: Sujet[] = [
  {
    id: 'desarmement',
    label: 'La crise du désarmement',
    featured: true,
    teaser: '…',
    description: '…',
  },
]
const pharePresse: Document1934 = {
  id: 'cp-003',
  date: '1934-01-13',
  source: { title: 'Le Républicain picard — édition du 13 janvier 1934', url: null },
  content: 'Un éditorial optimiste.',
  subjects: [{ topicId: 'desarmement', polarity: 'positif' }],
  highlight: true,
}
const phareParlement: Document1934 = {
  id: 'pd-026',
  date: '1934-03-08',
  source: { title: 'Compte rendu de la séance de la Chambre du 8 mars 1934', url: null },
  content: 'Une interdiction pessimiste.',
  speaker: { name: 'Gédéon Pujol', chamber: 'chambre' },
  subjects: [{ topicId: 'desarmement', polarity: 'negatif' }],
  highlight: true,
}

describe('Miroir', () => {
  it('les deux couloirs présents : presse à gauche, parlement à droite, chacun sa carte', () => {
    render(<Miroir miroir={{ presse: pharePresse, parlement: phareParlement }} sujets={sujets} />)
    expect(screen.getByRole('heading', { name: 'Miroir du sujet' })).toBeVisible()
    expect(screen.getByRole('heading', { level: 3, name: 'Dans la presse' })).toBeVisible()
    expect(screen.getByRole('heading', { level: 3, name: 'Au parlement' })).toBeVisible()
    expect(screen.getByText('Un éditorial optimiste.')).toBeVisible()
    expect(screen.getByText('Une interdiction pessimiste.')).toBeVisible()
    // Badges de polarité en regard (tableau total, libellés réels).
    expect(screen.getByText('La crise du désarmement · positif')).toBeVisible()
    expect(screen.getByText('La crise du désarmement · négatif')).toBeVisible()
  })

  it('couloir parlement manquant : message explicite, moitié presse intacte', () => {
    render(<Miroir miroir={{ presse: pharePresse }} sujets={sujets} />)
    expect(screen.getByText(/Aucun document de ce côté/)).toBeVisible()
    expect(screen.getByText('Un éditorial optimiste.')).toBeVisible()
    expect(screen.queryByText('Une interdiction pessimiste.')).toBeNull()
  })

  it('miroir entièrement vide (sujet sans document) : deux messages, pas de crash', () => {
    render(<Miroir miroir={{}} sujets={sujets} />)
    expect(screen.getAllByText(/Aucun document de ce côté/)).toHaveLength(2)
  })

  it('raccord 9.6 : chaque moitié offre « voir le détail » et remonte l’id de SON document', async () => {
    const vus: string[] = []
    const user = userEvent.setup()
    render(
      <Miroir
        miroir={{ presse: pharePresse, parlement: phareParlement }}
        sujets={sujets}
        surVoirDetail={(docId) => vus.push(docId)}
      />,
    )
    const boutons = screen.getAllByRole('button', { name: 'voir le détail' })
    expect(boutons).toHaveLength(2) // une porte par moitié, pas plus.
    await user.click(boutons[0]!)
    await user.click(boutons[1]!)
    expect(vus).toEqual(['cp-003', 'pd-026']) // presse d'abord, chacun son document.
  })

  it('raccord 9.6 : sans callback, le bloc reste purement display (aucune porte d’entrée)', () => {
    render(<Miroir miroir={{ presse: pharePresse, parlement: phareParlement }} sujets={sujets} />)
    expect(screen.queryByRole('button', { name: 'voir le détail' })).toBeNull()
  })
})
