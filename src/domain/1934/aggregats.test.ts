import { describe, expect, it } from 'vitest'
import {
  comparerParDate,
  couloirDe,
  estCoupeDePresse,
  estPriseDeParole,
  joursCorpus,
  pointsChronologie,
  selectionMiroir,
  seriesParMois,
} from './aggregats'
import type { Document1934, SujetId } from './contrat'

/**
 * Test des agrégats purs sur FIXTURES locales (frontière C-003 : un test de `domain/`
 * n'importe jamais les JSON de `data/`). La validation du corpus réel est en
 * `src/data/1934/` ; ici on ne teste que les lois du domaine.
 */

/** Constructeur de fixture : une prise de parole (avec speaker). */
function prise(
  id: string,
  date: string,
  associations: Array<{ topicId: SujetId; polarity: 'positif' | 'neutre' | 'negatif' }>,
  highlight = false,
): Document1934 {
  return {
    id,
    date,
    source: { title: `Séance du ${date}`, url: null },
    content: `Extrait de prise de parole ${id}.`,
    speaker: { name: 'M. Aurélien Duscher', chamber: 'chambre' },
    subjects: associations,
    ...(highlight ? { highlight: true } : {}),
  }
}

/** Constructeur de fixture : une coupe de presse (sans speaker). */
function coupe(
  id: string,
  date: string,
  associations: Array<{ topicId: SujetId; polarity: 'positif' | 'neutre' | 'negatif' }>,
  highlight = false,
): Document1934 {
  return {
    id,
    date,
    source: { title: `Le Torchon lorrain — édition du ${date}`, url: 'https://archives.example/tl' },
    content: `Entrefilet ${id}.`,
    subjects: associations,
    ...(highlight ? { highlight: true } : {}),
  }
}

const P = (topicId: SujetId, polarity: 'positif' | 'neutre' | 'negatif') => ({ topicId, polarity })

describe('estPriseDeParole / estCoupeDePresse / couloirDe', () => {
  const pd = prise('pd-001', '1934-01-05', [P('desarmement', 'neutre')])
  const cp = coupe('cp-001', '1934-01-05', [P('desarmement', 'neutre')])

  it('le speaker discrimine prise de parole et coupe de presse', () => {
    expect(estPriseDeParole(pd)).toBe(true)
    expect(estPriseDeParole(cp)).toBe(false)
    expect(estCoupeDePresse(cp)).toBe(true)
    expect(estCoupeDePresse(pd)).toBe(false)
  })

  it('le couloir suit le type du document', () => {
    expect(couloirDe(pd)).toBe('parlement')
    expect(couloirDe(cp)).toBe('presse')
  })
})

describe('comparerParDate', () => {
  it('classe la date d’abord, l’id en égalité', () => {
    expect(comparerParDate(coupe('cp-002', '1934-02-01', []), coupe('cp-001', '1934-01-01', []))).toBe(1)
    expect(comparerParDate(coupe('cp-001', '1934-01-01', []), coupe('cp-002', '1934-02-01', []))).toBe(-1)
    expect(comparerParDate(coupe('cp-001', '1934-01-01', []), coupe('cp-003', '1934-01-01', []))).toBe(-1)
    expect(comparerParDate(coupe('cp-003', '1934-01-01', []), coupe('cp-001', '1934-01-01', []))).toBe(1)
    expect(comparerParDate(coupe('cp-001', '1934-01-01', []), coupe('cp-001', '1934-01-01', []))).toBe(0)
  })
})

describe('joursCorpus', () => {
  it('lot vide → aucune ligne', () => {
    expect(joursCorpus([])).toEqual([])
  })

  it('agrège par jour, compte coupes et prises séparément', () => {
    const docs = [
      coupe('cp-001', '1934-02-03', [P('budget', 'neutre')]),
      prise('pd-001', '1934-01-10', [P('budget', 'negatif')]),
      coupe('cp-002', '1934-01-10', [P('budget', 'positif')]),
      prise('pd-002', '1934-01-10', [P('budget', 'neutre')]),
    ]
    expect(joursCorpus(docs)).toEqual([
      { date: '1934-01-10', coupes: 1, prises: 2 },
      { date: '1934-02-03', coupes: 1, prises: 0 },
    ])
  })

  it('tri chronissant même sur entrée non triée ; un document multi-sujets compte une fois', () => {
    const docs = [
      coupe('cp-009', '1934-03-31', [P('ligues', 'negatif')]),
      prise('pd-002', '1934-01-02', [P('ligues', 'positif'), P('budget', 'neutre')]),
      coupe('cp-003', '1934-01-02', [P('ligues', 'neutre')]),
    ]
    expect(joursCorpus(docs)).toEqual([
      { date: '1934-01-02', coupes: 1, prises: 1 },
      { date: '1934-03-31', coupes: 1, prises: 0 },
    ])
  })
})

describe('pointsChronologie', () => {
  it('lot vide → aucun point', () => {
    expect(pointsChronologie([])).toEqual([])
  })

  it('un point par association document×sujet, couloir et polarité portés', () => {
    const docs = [
      prise('pd-001', '1934-02-01', [P('desarmement', 'positif'), P('budget', 'negatif')]),
      coupe('cp-001', '1934-01-05', [P('desarmement', 'neutre')]),
    ]
    expect(pointsChronologie(docs)).toEqual([
      { id: 'cp-001', date: '1934-01-05', lane: 'presse', polarity: 'neutre' },
      { id: 'pd-001', date: '1934-02-01', lane: 'parlement', polarity: 'positif' },
      { id: 'pd-001', date: '1934-02-01', lane: 'parlement', polarity: 'negatif' },
    ])
  })

  it('égalité de date : ordre déterministe par id', () => {
    const docs = [
      coupe('cp-007', '1934-01-10', [P('ligues', 'neutre')]),
      coupe('cp-003', '1934-01-10', [P('ligues', 'positif')]),
    ]
    expect(pointsChronologie(docs).map((p) => p.id)).toEqual(['cp-003', 'cp-007'])
  })

  it('pourSujet restreint aux associations du sujet (page sujet)', () => {
    const docs = [
      prise('pd-001', '1934-02-01', [P('desarmement', 'positif'), P('budget', 'negatif')]),
      coupe('cp-001', '1934-01-05', [P('budget', 'neutre')]),
    ]
    expect(pointsChronologie(docs, 'budget')).toEqual([
      { id: 'cp-001', date: '1934-01-05', lane: 'presse', polarity: 'neutre' },
      { id: 'pd-001', date: '1934-02-01', lane: 'parlement', polarity: 'negatif' },
    ])
  })
})

describe('seriesParMois', () => {
  it('lot vide → aucune série', () => {
    expect(seriesParMois([])).toEqual([])
  })

  it('compte par polarité, clés à zéro conservées, tri par mois croissant', () => {
    const docs = [
      coupe('cp-010', '1934-03-02', [P('desarmement', 'positif')]),
      prise('pd-002', '1934-01-15', [P('desarmement', 'negatif')]),
      prise('pd-003', '1934-01-20', [P('desarmement', 'neutre')]),
      coupe('cp-011', '1934-01-20', [P('desarmement', 'negatif')]),
    ]
    expect(seriesParMois(docs)).toEqual([
      { mois: '1934-01', positif: 0, neutre: 1, negatif: 2 },
      { mois: '1934-03', positif: 1, neutre: 0, negatif: 0 },
    ])
  })

  it('un document multi-sujets compte une fois par association ; pourSujet filtre', () => {
    const docs = [prise('pd-001', '1934-02-01', [P('desarmement', 'positif'), P('budget', 'negatif')])]
    expect(seriesParMois(docs)).toEqual([{ mois: '1934-02', positif: 1, neutre: 0, negatif: 1 }])
    expect(seriesParMois(docs, 'desarmement')).toEqual([
      { mois: '1934-02', positif: 1, neutre: 0, negatif: 0 },
    ])
  })

  it('mois sans aucun document du sujet filtré : aucune série', () => {
    expect(seriesParMois([coupe('cp-001', '1934-01-05', [P('budget', 'neutre')])], 'desarmement')).toEqual([])
  })
})

describe('selectionMiroir', () => {
  it('lot vide → miroir vide (aucune clé)', () => {
    const miroir = selectionMiroir([])
    expect(miroir).toEqual({})
    expect('presse' in miroir).toBe(false)
    expect('parlement' in miroir).toBe(false)
  })

  it('un seul couloir présent → l’autre clé absente', () => {
    const docs = [coupe('cp-001', '1934-01-05', [P('desarmement', 'neutre')])]
    expect(selectionMiroir(docs)).toEqual({ presse: docs[0] })
  })

  it('priorité au phare highlight, même plus récent que le premier document', () => {
    const docs = [
      coupe('cp-001', '1934-01-05', [P('ligues', 'neutre')]),
      prise('pd-001', '1934-01-06', [P('ligues', 'positif')]),
      coupe('cp-009', '1934-02-20', [P('ligues', 'negatif')], true),
      prise('pd-007', '1934-02-21', [P('ligues', 'negatif')], true),
    ]
    const miroir = selectionMiroir(docs)
    expect(miroir.presse?.id).toBe('cp-009')
    expect(miroir.parlement?.id).toBe('pd-007')
  })

  it('plusieurs phares dans un couloir : premier phare par date, puis par id', () => {
    const docs = [
      prise('pd-020', '1934-02-01', [P('ligues', 'neutre')], true),
      prise('pd-010', '1934-01-15', [P('ligues', 'positif')], true),
      prise('pd-011', '1934-01-15', [P('ligues', 'negatif')], true),
    ]
    expect(selectionMiroir(docs).parlement?.id).toBe('pd-010')
  })

  it('repli sans phare : premier document du couloir par date (entrée non triée)', () => {
    const docs = [
      prise('pd-003', '1934-03-10', [P('budget', 'neutre')]),
      prise('pd-001', '1934-01-04', [P('budget', 'positif')]),
      coupe('cp-002', '1934-02-08', [P('budget', 'negatif')]),
      coupe('cp-001', '1934-01-02', [P('budget', 'neutre')]),
    ]
    const miroir = selectionMiroir(docs)
    expect(miroir.presse?.id).toBe('cp-001')
    expect(miroir.parlement?.id).toBe('pd-001')
  })
})
