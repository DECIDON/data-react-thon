import type { Document1934, Polarite, Sujet } from '@/domain/1934'
import { Document1934Schema, SujetSchema, estDansLaPeriode } from '@/domain/1934'
import { describe, expect, it } from 'vitest'
import coupesJson from './press.json'
import statementsJson from './statements.json'
import topicsJson from './topics.json'

/**
 * Validation du corpus fictif (spec §3, roadmap 9.1) : les trois JSON sont passés au
 * parse Zod — une donnée invalide fait échouer le test, jamais un document ignoré.
 * Le parse du premier test alimente les suivants (exécution séquentielle dans le fichier).
 */

let sujets: Sujet[] = []
let statements: Document1934[] = []
let coupes: Document1934[] = []
const documents: Document1934[] = []

/** Tous les documents, dans l'ordre d'arrivée (statements puis coupes). */
function chargerTout(): void {
  documents.push(...statements, ...coupes)
}

/** Les polarités portées par un lot de documents pour un sujet donné. */
function polaritesPour(docs: Document1934[], topicId: string): Polarite[] {
  return docs.flatMap((doc) => doc.subjects.filter((s) => s.topicId === topicId).map((s) => s.polarity))
}

/** Le plus grand trou (en jours calendaires) entre deux dates consécutives du corpus. */
function plusGrosTrou(docs: Document1934[]): number {
  const dates = [...new Set(docs.map((doc) => doc.date))].sort()
  let trou = 0
  let precedent: string | undefined
  for (const date of dates) {
    if (precedent !== undefined) {
      const jours = Math.round(
        (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${precedent}T00:00:00Z`)) / 86_400_000,
      )
      trou = Math.max(trou, jours)
    }
    precedent = date
  }
  return trou
}

describe('corpus fictif « presse & palabre » Q1 1934', () => {
  it('les trois JSON respectent le contrat (parse strict, jamais safeParse silencieux)', () => {
    sujets = SujetSchema.array().parse(topicsJson)
    statements = Document1934Schema.array().parse(statementsJson)
    coupes = Document1934Schema.array().parse(coupesJson)
    chargerTout()
    expect(statements.every((doc) => doc.speaker !== undefined)).toBe(true)
    expect(coupes.every((doc) => doc.speaker === undefined)).toBe(true)
  })

  it('13 sujets dont exactement 3 en vitrine', () => {
    // 6 sujets rédactionnels + 7 rattachés par la classification de l'export presse.
    expect(sujets).toHaveLength(13)
    expect(sujets.filter((s) => s.featured)).toHaveLength(3)
    expect(new Set(sujets.map((s) => s.id)).size).toBe(sujets.length)
  })

  it('effectifs : au moins 35 prises de parole et 55 coupes', () => {
    expect(statements.length).toBeGreaterThanOrEqual(35)
    expect(coupes.length).toBeGreaterThanOrEqual(55)
    const ids = documents.map((doc) => doc.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('toutes les dates tombent dans le trimestre 1934', () => {
    for (const doc of documents) {
      expect(estDansLaPeriode(doc.date), `${doc.id} @ ${doc.date}`).toBe(true)
    }
  })

  it('tout topicId référencé existe dans topics.json', () => {
    const ids = new Set(sujets.map((s) => s.id))
    for (const doc of documents) {
      for (const sujet of doc.subjects) {
        expect(ids.has(sujet.topicId), `${doc.id} → ${sujet.topicId}`).toBe(true)
      }
    }
  })

  // TODO(corpus) : invariantes de curation non réarmées depuis le passage au corpus réel.
  // L'export presse (`export_presse_topics.csv`) ne porte ni `highlight` ni polarité : la
  // presse n'y est que `neutre`, et aucune de ses coupes ne rattache les 6 sujets
  // rédactionnels. À réactiver quand la polarité et les phares seront renseignés.
  it.skip('chaque sujet a au moins un phare presse et un phare parlement', () => {
    for (const sujet of sujets) {
      const phares = documents.filter((doc) => doc.highlight === true)
      const porter = (type: 'presse' | 'parlement') =>
        phares.filter((doc) => (type === 'presse' ? doc.speaker === undefined : doc.speaker !== undefined))
      for (const type of ['presse', 'parlement'] as const) {
        const candidats = porter(type).filter((doc) => doc.subjects.some((s) => s.topicId === sujet.id))
        expect(candidats.length, `phare ${type} manquant pour « ${sujet.id} »`).toBeGreaterThan(0)
      }
    }
  })

  // TODO(corpus) : même cause — la presse issue de l'export est toute `neutre`, aucune paire
  // presse/parlement à polarités opposées n'est donc constructible en l'état.
  it.skip('chaque sujet a au moins une paire presse/parlement en polarités opposées', () => {
    for (const sujet of sujets) {
      const presse = polaritesPour(coupes, sujet.id)
      const parlement = polaritesPour(statements, sujet.id)
      const opposees =
        (presse.includes('positif') && parlement.includes('negatif')) ||
        (presse.includes('negatif') && parlement.includes('positif'))
      expect(opposees, `aucune paire à polarités opposées pour « ${sujet.id} »`).toBe(true)
    }
  })

  it('aucun trou de plus de 14 jours sur l’ensemble du corpus', () => {
    expect(plusGrosTrou(documents)).toBeLessThanOrEqual(14)
  })
})
