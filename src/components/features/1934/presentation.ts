import type { Chambre, Document1934, SujetId } from '@/domain/1934'
import { estPriseDeParole } from '@/domain/1934'

/**
 * Adaptateurs de présentation « presse & palabre » : petits mappages purs entre le
 * contrat du domaine et ce que les composants rendent. Comme pour le calendrier, ces
 * décisions (troncature, libellés, compteurs de carte) sont de la présentation : elles
 * vivent dans `components/features/`, jamais dans `domain/` (ARCHITECTURE.md §3).
 */

/**
 * Extrait tronqué pour les listes (spec §5, infobules comprises) : on coupe au mot le
 * plus proche sous `largeurMaximale`, jamais en pleine phrase, et l'ellipse signale la
 * coupe — l'extrait complet appartient au détail (étape 9.5).
 */
export function tronquer(texte: string, largeurMaximale = 180): string {
  if (texte.length <= largeurMaximale) return texte
  const coupe = texte.slice(0, largeurMaximale)
  const dernierEspace = coupe.lastIndexOf(' ')
  // Mot coupé au-delà de la moitié de la largeur : on revient au mot précédent.
  const fin = dernierEspace > largeurMaximale / 2 ? dernierEspace : largeurMaximale
  return `${coupe.slice(0, fin).trimEnd()}…`
}

/** Date ISO longue en français (« 3 janvier 1934 ») ; midi UTC évite le décalage de fuseau. */
const FORMATEUR_JOUR = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
export function formatDateLongue(jour: string): string {
  return FORMATEUR_JOUR.format(new Date(`${jour}T12:00:00Z`))
}

/** Libellé d'une chambre fictive, tel qu'affiché (le glossaire interdit « député »). */
const LIBELLE_CHAMBRE: Record<Chambre, string> = { chambre: 'Chambre', senat: 'Sénat' }
export function libelleChambre(chambre: Chambre): string {
  return LIBELLE_CHAMBRE[chambre]
}

/** Documents d'un sujet dans un lot (jointure `topicId`, CONTEXT.md) — vue filtrée, tri préservé. */
export function documentsDuSujet(documents: readonly Document1934[], sujetId: SujetId): Document1934[] {
  return documents.filter((doc) => doc.subjects.some((association) => association.topicId === sujetId))
}

/** Compteurs d'une carte de sujet : « N coupes · M prises », calculés sur un lot déjà filtré. */
export interface CompteursSujet {
  readonly coupes: number
  readonly prises: number
}
export function compteursSujet(documents: readonly Document1934[]): CompteursSujet {
  let coupes = 0
  let prises = 0
  for (const doc of documents) {
    if (estPriseDeParole(doc)) prises += 1
    else coupes += 1
  }
  return { coupes, prises }
}
