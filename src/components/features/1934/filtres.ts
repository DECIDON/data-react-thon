import type { Couloir, Document1934 } from '@/domain/1934'
import { PERIODE_1934, couloirDe, estDansLaPeriode } from '@/domain/1934'

/**
 * Adaptateur de filtres de la page sujet (spec §4, tableau « Filtres ») : l'état de
 * filtrage vit **entièrement dans l'URL** (`useSearchParams`, cf. `state.md`) — survit au
 * rechargement, partageable. Ce module ne fait que deux choses, toutes deux pures :
 *
 * 1. **lire** l'URL de façon tolérante : un paramètre absent, mal formé, hors période ou
 *    inconnu est ignoré (retombée sur le défaut), jamais une exception ;
 * 2. **écrire** des filtres dans l'URL sans la polluer : une valeur par défaut n'est
 *    jamais écrite (URL propre au premier arrivage).
 *
 * Le filtrage lui-même (`filtrer`) est ici et non dans `domain/` parce qu'il dépend de la
 * règle d'extraction du nom de journal, propre au corpus commissionné (adaptateur de
 * `repository.ts`, jamais une loi du domaine — C-003, commentaire du port).
 */

/** Valeurs du filtre `type` (spec §4) : « tout » est le défaut et ne s'écrit pas. */
export const TYPES_FILTRE = ['tout', 'presse', 'parlement'] as const
export type TypeFiltre = (typeof TYPES_FILTRE)[number]

/** Filtres de la page sujet, tels que lus dans l'URL, validés et complétés par leurs défauts. */
export interface FiltresSujet {
  readonly type: TypeFiltre
  /** Noms de locuteurs (`?orateur=X&orateur=Y`), vide ⇒ pas de filtre. */
  readonly orateurs: readonly string[]
  /** Noms de journaux (`?journal=X`), vide ⇒ pas de filtre. */
  readonly journaux: readonly string[]
  /** Borne basse de la fenêtre de dates, toujours dans Q1 1934. */
  readonly du: string
  /** Borne haute de la fenêtre de dates, toujours dans Q1 1934. */
  readonly au: string
  /** Document ciblé (`?doc=`) pour l'ancrage/surlignage — le détail complet arrive en 9.5. */
  readonly doc: string | null
}

/** Listes distinctes du corpus, pour valider `orateur`/`journal` (un nom inconnu est ignoré). */
export interface ListesDeFiltres {
  readonly locuteurs: readonly string[]
  readonly journaux: readonly string[]
}

/** Les valeurs par défaut du tableau de spec §4 : tout, trimestre complet, rien de ciblé. */
export function filtresParDefaut(): FiltresSujet {
  return { type: 'tout', orateurs: [], journaux: [], du: PERIODE_1934.du, au: PERIODE_1934.au, doc: null }
}

/** Paramètres dont ce module est seul maître (les autres, s'il y en a, sont préservés). */
const CLES_FILTRES = ['type', 'orateur', 'journal', 'du', 'au', 'doc'] as const

const DATE_ISO = /^\d{4}-\d{2}-\d{2}$/
const ID_DOCUMENT = /^(?:pd|cp)-\d{3}$/

/** Comparateur stable (fr) pour que l'URL écrite soit déterministe, quel que soit l'ordre reçu. */
const comparerFr = (a: string, b: string) => a.localeCompare(b, 'fr')

function estDateDeLaPeriode(valeur: string | null): valeur is string {
  return valeur !== null && DATE_ISO.test(valeur) && estDansLaPeriode(valeur)
}

/** Une valeur multi tolérante : dédoublonnée, triée, restreinte aux noms connus si la liste est fournie. */
function lireMulti(
  params: URLSearchParams,
  cle: 'orateur' | 'journal',
  listeConnue: readonly string[] | undefined,
): string[] {
  const recus = [...new Set(params.getAll(cle))]
  const connus = listeConnue === undefined ? recus : recus.filter((nom) => listeConnue.includes(nom))
  return connus.sort(comparerFr)
}

/**
 * Lecture tolérante des filtres depuis l'URL (spec §4). Règles :
 * - `type` inconnu ⇒ `tout` ;
 * - `orateur`/`journal` inconnus (absents des listes du corpus) ⇒ ignorés, dédoublons ;
 * - `du`/`au` mal formés ou hors du trimestre ⇒ valeur par défaut ; `du > au` (fenêtre
 *   trafiquée) ⇒ les deux retombent aux bornes du trimestre ;
 * - `doc` ne ressemblant pas à un id de document ⇒ ignoré.
 * Sans `listes`, les noms multi ne sont pas confrontés au corpus (tolérance côté hook en erreur).
 */
export function lireFiltresDepuisURL(params: URLSearchParams, listes?: ListesDeFiltres): FiltresSujet {
  const typeBrut = params.get('type')
  const type = (TYPES_FILTRE as readonly string[]).includes(typeBrut ?? '')
    ? (typeBrut as TypeFiltre)
    : 'tout'
  let du = estDateDeLaPeriode(params.get('du')) ? params.get('du')! : PERIODE_1934.du
  let au = estDateDeLaPeriode(params.get('au')) ? params.get('au')! : PERIODE_1934.au
  if (du > au) {
    du = PERIODE_1934.du
    au = PERIODE_1934.au
  }
  const doc = params.get('doc')
  return {
    type,
    orateurs: lireMulti(params, 'orateur', listes?.locuteurs),
    journaux: lireMulti(params, 'journal', listes?.journaux),
    du,
    au,
    doc: doc !== null && ID_DOCUMENT.test(doc) ? doc : null,
  }
}

/**
 * Écriture des filtres dans un jeu de paramètres : les valeurs par défaut ne sont jamais
 * écrites ; les paramètres étrangers à ce contrat (ex. `jour` d'un lien profond) sont
 * préservés. C'est la seule écriture d'URL de la page sujet.
 */
export function appliquerFiltres(actuels: URLSearchParams, filtres: FiltresSujet): URLSearchParams {
  const suivants = new URLSearchParams(actuels)
  for (const cle of CLES_FILTRES) suivants.delete(cle)
  if (filtres.type !== 'tout') suivants.set('type', filtres.type)
  for (const orateur of [...filtres.orateurs].sort(comparerFr)) suivants.append('orateur', orateur)
  for (const journal of [...filtres.journaux].sort(comparerFr)) suivants.append('journal', journal)
  if (filtres.du !== PERIODE_1934.du) suivants.set('du', filtres.du)
  if (filtres.au !== PERIODE_1934.au) suivants.set('au', filtres.au)
  if (filtres.doc !== null) suivants.set('doc', filtres.doc)
  return suivants
}

/**
 * Nom du journal d'une coupe : la partie du `source.title` **avant le tiret long**, à défaut
 * le titre entier — règle calquée sur `journaux()` du port repository, **dupliquée ici** à
 * dessein : `components/` n'a pas le droit d'importer `data/` (C-003) et cette règle est
 * un artefact des JSON commissionnés, pas une loi du domaine.
 */
export function nomDuJournal(doc: Document1934): string {
  const nom = doc.source.title.split(' — ')[0]?.trim()
  return nom || doc.source.title
}

/**
 * Applique les filtres à un lot de documents (déjà restreints au sujet par l'appelant).
 * Combinaison en ET ; l'ordre d'entrée (chronologique) est préservé. Règles :
 * - `type` : filtre sur le couloir (`presse` = coupes seules, `parlement` = prises seules) ;
 * - `orateurs` : le `speaker.name` du document doit être dans la liste — une coupe, sans
 *   locuteur, est donc exclue dès qu'un orateur est retenu ;
 * - `journaux` : le nom du journal doit être dans la liste — une prise de parole, sans
 *   journal, est donc exclue dès qu'un journal est retenu ;
 * - `du`/`au` : fenêtrage par comparaison lexicographique des dates ISO.
 */
export function filtrer(documents: readonly Document1934[], filtres: FiltresSujet): Document1934[] {
  return documents.filter((doc) => {
    if (doc.date < filtres.du || doc.date > filtres.au) return false
    if (filtres.type !== 'tout') {
      const couloir: Couloir = filtres.type === 'parlement' ? 'parlement' : 'presse'
      if (couloirDe(doc) !== couloir) return false
    }
    if (
      filtres.orateurs.length > 0 &&
      (doc.speaker === undefined || !filtres.orateurs.includes(doc.speaker.name))
    )
      return false
    if (filtres.journaux.length > 0 && !filtres.journaux.includes(nomDuJournal(doc))) return false
    return true
  })
}
