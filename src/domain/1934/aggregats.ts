import type { Document1934, Polarite, SujetId } from './contrat'

/**
 * Agrégats purs du domaine « presse & palabre » (spec §5 dernier paragraphe) :
 * le calendrier, la frise et le bar empilé de l'UI Nivo consomment ces structures,
 * jamais les documents bruts. Fonctions **sans filtrage** : elles reçoivent un
 * tableau déjà filtré par les couches supérieures (hooks/pages via le repository).
 * Module pur, Nivo-agnostique : seul `./contrat` est importé ici (ARCHITECTURE.md §3).
 */

/** Couloir de la frise (spec §4.2) : une presse ou un parlement, jamais les deux. */
export type Couloir = 'presse' | 'parlement'

/** Une prise de parole porte un `speaker`, une coupe de presse n'en porte pas (spec §2). */
export function estPriseDeParole(doc: Document1934): boolean {
  return doc.speaker !== undefined
}

/** Symétrique de `estPriseDeParole` — lu ainsi, le code d'appel dit « coupe de presse ». */
export function estCoupeDePresse(doc: Document1934): boolean {
  return doc.speaker === undefined
}

/** Le couloir (frise / miroir) où tombe un document. */
export function couloirDe(doc: Document1934): Couloir {
  return estPriseDeParole(doc) ? 'parlement' : 'presse'
}

/** Ordre total déterministe d'affichage : date ISO (comparable lexicographiquement), puis id. */
export function comparerParDate(a: Document1934, b: Document1934): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

/** Cellule du bandeau calendrier : combien de coupes et de prises de parole un jour donné. */
export interface JourCorpus {
  date: string
  coupes: number
  prises: number
}

/**
 * Une ligne par date présente dans le lot reçu, trié du plus ancien au plus récent.
 * Les dates absentes n'apparaissent pas : c'est au composant calendrier de les peindre en vide.
 */
export function joursCorpus(documents: readonly Document1934[]): JourCorpus[] {
  const parDate = new Map<string, JourCorpus>()
  for (const doc of documents) {
    let jour = parDate.get(doc.date)
    if (jour === undefined) {
      jour = { date: doc.date, coupes: 0, prises: 0 }
      parDate.set(doc.date, jour)
    }
    if (estPriseDeParole(doc)) jour.prises += 1
    else jour.coupes += 1
  }
  return [...parDate.values()].sort((a, b) => a.date.localeCompare(b.date))
}

/** Point de la frise (aires en bandes, voir `chronologie.ts`) : date, couloir, polarité — compté par mois. */
export interface PointChronologie {
  id: string
  date: string
  lane: Couloir
  polarity: Polarite
}

/**
 * Le contrat rattache la polarité au couple document×sujet (CONTEXT.md). Un point est donc émis
 * **par association document×sujet** — règle « compté une fois par sujet » (spec §2). L'id peut
 * revenir plusieurs fois si le document porte plusieurs sujets ; le clic reste fiable.
 * `pourSujet`, lorsqu'il est fourni, restreint les points aux associations de ce sujet : c'est
 * le mode normal de la page sujet, qui évite qu'un document multi-sujets soit compté sous la
 * polarité d'un autre sujet que celui affiché.
 */
export function pointsChronologie(
  documents: readonly Document1934[],
  pourSujet?: SujetId,
): PointChronologie[] {
  const points: PointChronologie[] = []
  for (const doc of [...documents].sort(comparerParDate)) {
    const lane = couloirDe(doc)
    for (const association of doc.subjects) {
      if (pourSujet !== undefined && association.topicId !== pourSujet) continue
      points.push({ id: doc.id, date: doc.date, lane, polarity: association.polarity })
    }
  }
  return points
}

/** Un mois du bar empilé : compte de documents par polarité, clés toujours présentes. */
export interface SerieParMois {
  mois: string // 'YYYY-MM'
  positif: number
  neutre: number
  negatif: number
}

/**
 * Series du bar empilé mois × polarité (spec §4.2). Comme pour la frise, un document compte
 * une fois par association document×sujet (spec §2) ; `pourSujet` restreint au sujet affiché.
 * Trié par mois croissant ; les mois sans document sont absents (l'UI n'a rien à peindre).
 */
export function seriesParMois(documents: readonly Document1934[], pourSujet?: SujetId): SerieParMois[] {
  const parMois = new Map<string, SerieParMois>()
  for (const doc of documents) {
    const associations =
      pourSujet === undefined ? doc.subjects : doc.subjects.filter((a) => a.topicId === pourSujet)
    if (associations.length === 0) continue // le mois ne compte rien : il ne sera pas peint.
    const mois = doc.date.slice(0, 7)
    let serie = parMois.get(mois)
    if (serie === undefined) {
      serie = { mois, positif: 0, neutre: 0, negatif: 0 }
      parMois.set(mois, serie)
    }
    for (const association of associations) serie[association.polarity] += 1
  }
  return [...parMois.values()].sort((a, b) => a.mois.localeCompare(b.mois))
}

/**
 * Bloc miroir d'une page de sujet (CONTEXT.md) : le phare presse et le phare parlement
 * du même sujet, en regard. Lot vide dans un couloir ⇒ propriété absente (jamais `undefined`
 * stocké), l'UI n'a qu'à tester `'presse' in miroir`.
 */
export interface Miroir {
  presse?: Document1934
  parlement?: Document1934
}

/**
 * Sélection des deux phares d'un sujet (spec §4.2, lois de sélection C-007) :
 * entrée = documents **de ce seul sujet**, déjà filtrés par l'appelant. Dans chaque couloir,
 * priorité au phare (`highlight: true`, premier par date si plusieurs) ; à défaut, premier
 * document du couloir par date (repli : le miroir ne sera jamais vide sans raison).
 */
export function selectionMiroir(documentsParSujet: readonly Document1934[]): Miroir {
  const triees = [...documentsParSujet].sort(comparerParDate)
  const miroir: Miroir = {}
  for (const couloir of ['presse', 'parlement'] as const) {
    const candidats = triees.filter((doc) => couloirDe(doc) === couloir)
    const choisi = candidats.find((doc) => doc.highlight === true) ?? candidats[0]
    if (choisi !== undefined) miroir[couloir] = choisi
  }
  return miroir
}
