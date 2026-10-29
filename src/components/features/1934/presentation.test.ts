import type { Document1934 } from '@/domain/1934'
import { describe, expect, it } from 'vitest'
import { compteursSujet, documentsDuSujet, formatDateLongue, libelleChambre, tronquer } from './presentation'

/** Adaptateurs de présentation : fonctions pures, fixtures minimales conformes au contrat. */
const prise: Document1934 = {
  id: 'pd-001',
  date: '1934-01-03',
  source: { title: 'Compte rendu de séance', url: null },
  content: 'Une intervention.',
  speaker: { name: 'Aurélien Duscher', chamber: 'chambre' },
  subjects: [{ topicId: 'desarmement', polarity: 'positif' }],
}
const coupe: Document1934 = {
  id: 'cp-002',
  date: '1934-01-04',
  source: { title: 'Le Torchon lorrain — édition du 4 janvier', url: null },
  content: 'Un entrefilet.',
  subjects: [
    { topicId: 'desarmement', polarity: 'negatif' },
    { topicId: 'ligues', polarity: 'neutre' },
  ],
}

describe('tronquer', () => {
  it('laisse un extrait court intact', () => {
    expect(tronquer('Phrase courte.')).toBe('Phrase courte.')
  })

  it('coupe au mot le plus proche et signale la coupe par une ellipse', () => {
    const texte = 'mot '.repeat(60).trim() // 239 caractères, mots réguliers
    const resultat = tronquer(texte, 100)
    expect(resultat.endsWith('…')).toBe(true)
    expect(resultat.length).toBeLessThanOrEqual(101)
    expect(resultat).not.toContain('  ') // jamais coupé en pleine ligne
  })
})

describe('formatDateLongue', () => {
  it('écrit la date en français sans jour de semaine', () => {
    expect(formatDateLongue('1934-01-03')).toBe('3 janvier 1934')
    expect(formatDateLongue('1934-03-31')).toBe('31 mars 1934')
  })
})

describe('libelleChambre', () => {
  it('traduit les deux chambres fictives', () => {
    expect(libelleChambre('chambre')).toBe('Chambre')
    expect(libelleChambre('senat')).toBe('Sénat')
  })
})

describe('documentsDuSujet & compteursSujet', () => {
  it('filtre sur la jointure topicId et préserve l’ordre', () => {
    expect(documentsDuSujet([prise, coupe], 'ligues')).toEqual([coupe])
    expect(documentsDuSujet([prise, coupe], 'desarmement')).toEqual([prise, coupe])
  })

  it('compte coupes et prises d’un lot filtré', () => {
    expect(compteursSujet(documentsDuSujet([prise, coupe], 'desarmement'))).toEqual({ coupes: 1, prises: 1 })
    expect(compteursSujet([])).toEqual({ coupes: 0, prises: 0 })
  })
})
