import type { Document1934, SujetId } from '@/domain/1934'
import { estPriseDeParole } from '@/domain/1934'
import { DataError } from '@/platform/errors/base'
import { describe, expect, it } from 'vitest'
import {
  chargerCorpus,
  documentParId,
  documentsParSujet,
  journaux,
  locuteurs,
  sujetParId,
  validerCorpusBrut,
} from './repository'

/**
 * Tests du port repository : le corpus réel du dépôt doit valider le contrat (spec §6),
 * le chemin d'échec doit remonter une erreur typée, et rien ne doit pouvoir muter la source.
 */

describe('chargerCorpus — corpus réel commissionné', () => {
  it('charge un corpus valide : 6 sujets, 100 documents', () => {
    const resultat = chargerCorpus()
    expect(resultat.ok).toBe(true)
    if (!resultat.ok) return
    expect(resultat.value.sujets).toHaveLength(6)
    expect(resultat.value.documents).toHaveLength(100)
  })

  it('mémoïse au premier appel : même référence au second', () => {
    expect(chargerCorpus()).toBe(chargerCorpus())
  })

  it('sert des tableaux gelés (lecture seule, ADR C-008)', () => {
    const resultat = chargerCorpus()
    expect(resultat.ok).toBe(true)
    if (!resultat.ok) return
    expect(Object.isFrozen(resultat.value)).toBe(true)
    expect(Object.isFrozen(resultat.value.sujets)).toBe(true)
    expect(Object.isFrozen(resultat.value.documents)).toBe(true)
  })

  it('sert les documents triés par date (jointure des deux fichiers de documents)', () => {
    const resultat = chargerCorpus()
    if (!resultat.ok) return
    const dates = resultat.value.documents.map((doc) => doc.date)
    expect([...dates].sort()).toEqual(dates)
    const idsPrises = resultat.value.documents.filter(estPriseDeParole)
    expect(idsPrises.length).toBeGreaterThanOrEqual(35)
  })
})

describe('validerCorpusBrut — chemin d’échec typé', () => {
  it('une donnée invalide est une erreur DataError, jamais un document ignoré', () => {
    const resultat = validerCorpusBrut({
      sujets: [{ id: 'desarmement' }], // teaser/description/label/featured manquants
      prises: [],
      coupes: [],
    })
    expect(resultat.ok).toBe(false)
    if (resultat.ok) return
    expect(resultat.error).toBeInstanceOf(DataError)
    expect(resultat.error.cause).toBeDefined()
  })

  it('un champ inconnu est refusé (.strict())', () => {
    const resultat = validerCorpusBrut({
      sujets: [],
      prises: [],
      coupes: [
        {
          id: 'cp-001',
          date: '1934-01-01',
          source: { title: 'Le Torchon lorrain', url: null },
          content: 'Entrefilet.',
          subjects: [{ topicId: 'desarmement', polarity: 'neutre' }],
          voleur: true,
        },
      ],
    })
    expect(resultat.ok).toBe(false)
  })
})

describe('sélecteurs dérivés', () => {
  const resultat = chargerCorpus()
  if (!resultat.ok) throw resultat.error // corpus du dépôt : invalide = tous les tests rouges.
  const corpus = resultat.value

  it('sujetParId retrouve un sujet connu et rien pour un inconnu', () => {
    expect(sujetParId(corpus, 'desarmement')?.label).toBe('La crise du désarmement')
    expect(sujetParId(corpus, 'nimporte-quoi')).toBeUndefined()
  })

  it('documentParId retrouve un document n’importe où dans le corpus, rien pour un inconnu', () => {
    expect(documentParId(corpus, 'cp-003')?.source.url).toBe(
      'https://archives.example/republicain-picard/1934-01-13',
    )
    expect(documentParId(corpus, 'cp-999')).toBeUndefined()
    expect(documentParId(corpus, 'patraque')).toBeUndefined()
  })

  it('documentsParSujet ne renvoie que les documents rattachés, triés par date', () => {
    const id: SujetId = 'ligues'
    const docs = documentsParSujet(corpus, id)
    expect(docs.length).toBeGreaterThan(0)
    for (const doc of docs) {
      expect(doc.subjects.some((association) => association.topicId === id)).toBe(true)
    }
    for (const [index, doc] of docs.entries()) {
      const precedent = docs[index - 1]
      if (precedent === undefined) continue
      const ordre = precedent.date < doc.date || (precedent.date === doc.date && precedent.id <= doc.id)
      expect(ordre, `ordre chronologique violé avant ${doc.id}`).toBe(true)
    }
  })

  it('journaux : noms distincts extraits du titre source, triés', () => {
    const noms = journaux(corpus)
    expect(noms).toEqual([...noms].sort((a, b) => a.localeCompare(b, 'fr')))
    expect(new Set(noms).size).toBe(noms.length)
    expect(noms.length).toBeGreaterThanOrEqual(5)
    expect(noms.length).toBeLessThanOrEqual(6)
    for (const nom of noms) expect(nom).not.toContain('—')
  })

  it('locuteurs : noms distincts des prises de parole, triés', () => {
    const noms = locuteurs(corpus)
    expect(noms).toEqual([...noms].sort((a, b) => a.localeCompare(b, 'fr')))
    expect(new Set(noms).size).toBe(noms.length)
    expect(noms).toHaveLength(8)
    // Un nom de locuteur ne doit jamais sortir du lot des journaux.
    for (const nom of noms) expect(journaux(corpus)).not.toContain(nom)
  })

  it('journaux : repli sur le titre entier si le nom devant le tiret manque', () => {
    const resultat = validerCorpusBrut({
      sujets: [],
      prises: [],
      coupes: [
        {
          id: 'cp-001',
          date: '1934-01-05',
          source: { title: ' — édition du 5 janvier 1934', url: null },
          content: 'Entrefilet sans journal identifiable.',
          subjects: [{ topicId: 'desarmement', polarity: 'neutre' }],
        },
      ],
    })
    expect(resultat.ok).toBe(true)
    if (!resultat.ok) return
    expect(journaux(resultat.value)).toEqual([' — édition du 5 janvier 1934'])
  })

  it('documentsParSujet sur sujet inconnu : lot vide', () => {
    expect(documentsParSujet(corpus, 'nimporte-quoi')).toEqual([])
  })

  it('documentsParSujet renvoie une copie modifiable (le corpus gelé ne se mutile pas)', () => {
    const docs: Document1934[] = documentsParSujet(corpus, 'budget')
    const reference = [...docs]
    docs.reverse()
    expect(docs).not.toEqual(reference)
    expect(documentsParSujet(corpus, 'budget')).toEqual(reference)
  })
})
