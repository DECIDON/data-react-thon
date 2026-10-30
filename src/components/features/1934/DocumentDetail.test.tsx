import type { Document1934, Sujet } from '@/domain/1934'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DocumentDetail } from './DocumentDetail'

/**
 * Détail d'un document en modale (spec §4.3, étape 9.5), testé seul : la page est testée
 * d'ensemble dans `pages/SujetPage.test.tsx`, ici on vérifie contenu, ouverture et les
 * trois chemins de fermeture. jsdom 26 n'implémente pas `showModal` : le composant ouvre
 * par l'attribut `open` en repli, d'où l'assertion `toHaveAttribute('open')`.
 */

const sujets: Sujet[] = [
  {
    id: 'desarmement',
    label: 'La crise du désarmement',
    featured: true,
    teaser: '…',
    description: '…',
  },
  {
    id: 'budget',
    label: 'Le budget et les décrets-lois',
    featured: false,
    teaser: '…',
    description: '…',
  },
]

// Extrait volontairement plus long que la troncature des listes (180 caractères) : le
// détail doit le rendre EN ENTIER, ellipsis en moins.
const extraitLong =
  '« Votez les crédits de Genoves pleins poumons : ce que vous épargnez sur le canon ne se ' +
  'dépense plus en cercueil, ni en deuil, ni en ces monuments que la République fait édifier ' +
  'pour pleurer collectivement ce qu’elle n’a pas su empêcher individuellement. » ' +
  '— M. Camille Rouveur. (Sourires ; applaudissements à gauche.)'

const priseDeParole: Document1934 = {
  id: 'pd-008',
  date: '1934-01-23',
  source: { title: 'Compte rendu de la séance de la Chambre du 23 janvier 1934', url: null },
  content: extraitLong,
  speaker: { name: 'Camille Rouveur', chamber: 'chambre' },
  subjects: [
    { topicId: 'desarmement', polarity: 'positif' },
    { topicId: 'budget', polarity: 'neutre' },
  ],
}
const avecUrl: Document1934 = {
  id: 'cp-003',
  date: '1934-01-13',
  source: {
    title: 'Le Républicain picard — édition du 13 janvier 1934',
    url: 'https://archives.example/republicain-picard/1934-01-13',
  },
  content: 'Un entrefilet.',
  subjects: [{ topicId: 'desarmement', polarity: 'positif' }],
}

const onClose = vi.fn()

beforeEach(() => {
  onClose.mockClear()
})

describe('DocumentDetail', () => {
  it('prise de parole : étiquette, date longue en français, locuteur + chambre, extrait intégral', () => {
    render(<DocumentDetail doc={priseDeParole} sujets={sujets} onClose={onClose} />)
    expect(screen.getByRole('dialog')).toHaveAttribute('open')
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Prise de parole')
    expect(screen.getByText('23 janvier 1934')).toBeVisible()
    expect(screen.getByText('Camille Rouveur — Chambre')).toBeVisible()
    // Texte intégral, sans ellipse : c'est la raison d'être du détail.
    expect(screen.getByText(extraitLong)).toBeVisible()
    expect(screen.getByText(extraitLong).textContent).not.toContain('…')
  })

  it('coupe de presse avec URL : la source est un lien noopener noreferrer vers l’archive', () => {
    render(<DocumentDetail doc={avecUrl} sujets={sujets} onClose={onClose} />)
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Coupe de presse')
    const lien = screen.getByRole('link', { name: 'Le Républicain picard — édition du 13 janvier 1934' })
    expect(lien).toHaveAttribute('href', 'https://archives.example/republicain-picard/1934-01-13')
    expect(lien).toHaveAttribute('rel', 'noopener noreferrer')
    expect(lien).toHaveAttribute('target', '_blank')
  })

  it('compte rendu sans URL : titre de source nu, aucun lien', () => {
    render(<DocumentDetail doc={priseDeParole} sujets={sujets} onClose={onClose} />)
    expect(screen.getByText('Compte rendu de la séance de la Chambre du 23 janvier 1934')).toBeVisible()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('puces de polarité pour TOUS les sujets du document, pas seulement celui de l’écran', () => {
    render(<DocumentDetail doc={priseDeParole} sujets={sujets} onClose={onClose} />)
    const puces = screen.getByRole('list', { name: 'Polarités par sujet' })
    expect(puces).toHaveTextContent('La crise du désarmement · positif')
    expect(puces).toHaveTextContent('Le budget et les décrets-lois · neutre')
    expect(within(puces).getAllByRole('listitem')).toHaveLength(2)
  })

  it('le focus initial est posé sur le bouton Fermer', () => {
    render(<DocumentDetail doc={avecUrl} sujets={sujets} onClose={onClose} />)
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Fermer' }))
  })

  it('bouton Fermer : signale la fermeture, et l’événement `close` native ne double pas le signal', async () => {
    const user = userEvent.setup()
    render(<DocumentDetail doc={avecUrl} sujets={sujets} onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Fermer' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    // Filet : même si le moteur ferme pour son compte (Échap natif, close() externe), onClose
    // de React ne déclenche qu'un signalement unique.
    fireEvent(screen.getByRole('dialog'), new window.Event('close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('touche Échap : signale la fermeture', async () => {
    const user = userEvent.setup()
    render(<DocumentDetail doc={avecUrl} sujets={sujets} onClose={onClose} />)
    await user.keyboard('{Escape}') // le focus initial est dans la modale
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('clic sur le fond (le dialog lui-même) ferme ; clic dans le contenu non', async () => {
    const user = userEvent.setup()
    render(<DocumentDetail doc={avecUrl} sujets={sujets} onClose={onClose} />)
    await user.click(screen.getByRole('heading', { level: 2, name: 'Coupe de presse' }))
    expect(onClose).not.toHaveBeenCalled()
    await user.click(screen.getByRole('dialog')) // le « backdrop » est porté par l'élément <dialog>
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
