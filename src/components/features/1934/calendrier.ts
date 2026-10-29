import type { JourCorpus } from '@/domain/1934'
import { estDansLaPeriode } from '@/domain/1934'

/**
 * Adaptateur calendrier (spec §5 dernier paragraphe) : la transformation des agrégats
 * purs du domaine (`JourCorpus[]`, issus de `joursCorpus`) vers la forme attendue par
 * `@nivo/calendar` (`{ day, value }[]`) est une décision de présentation — elle vit donc
 * dans `components/features/`, jamais dans `domain/` (ARCHITECTURE.md §3, C-003).
 * Module sans framework : testable seul sous Vitest, sans DOM ni Nivo.
 */

/** Ligne du calendrier Nivo : `day` en ISO, `value` = documents du jour (spec §4.1). */
export interface LigneCalendrier {
  day: string
  value: number
}

/**
 * Le calendrier peint l'intensité du **total** du jour (coupes + prises, spec §4.1) :
 * Nivo ne sait pas départager deux séries dans une même case, la légende du composant
 * s'en charge. Les jours sans document sont absents de `jours` : Nivo les peint vides.
 */
export function versCalendrier(jours: readonly JourCorpus[]): LigneCalendrier[] {
  return jours.map((jour) => ({ day: jour.date, value: jour.coupes + jour.prises }))
}

/** Le paramètre d'URL `?jour=` n'est pas une promesse : on ne lui fait pas confiance. */
const JOUR_ISO = /^\d{4}-\d{2}-\d{2}$/

/**
 * Le jour sélectionnu lu dans l'URL (`?jour=YYYY-MM-DD`, spec §4) : `null` si absent,
 * mal formé ou hors de la période figée — une URL trafiquée affiche l'accueil, pas une
 * exception. C'est la seule lecture d'URL tolérée hors page : pure fonction, testée.
 */
export function jourSelectionne(valeur: string | null): string | null {
  return valeur !== null && JOUR_ISO.test(valeur) && estDansLaPeriode(valeur) ? valeur : null
}
