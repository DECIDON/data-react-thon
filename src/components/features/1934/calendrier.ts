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

/**
 * Dégradé de couleurs (spec §4.1) : l'échelle du calendrier n'est pas une quantification
 * discrète en quelques cases de couleur — c'est un dégradé continu, ancré sur le min et le
 * max réellement présents dans l'agrégat. `echelleDegrade` rend exactement la forme que
 * Nivo attend pour sa prop `colorScale` (fonction callable + `ticks` pour d'éventuelles
 * légendes), calculée sans d3 ni Nivo : la signature appelle le d3-scale de Nivo.
 */

/** Échelle de couleur continue compatible avec `ColorScale` de `@nivo/calendar`. */
export interface EchelleDegrade {
  (valeur: number | { valueOf(): number }): string
  ticks(compte?: number): number[]
}

/** Décode une couleur hexadécimale `#rrggbb` en trois canaux 0–255. */
function versRgb(couleur: string): readonly [number, number, number] {
  const hex = couleur.replace('#', '')
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)]
}

/** Canaux mélangés → hexadécimal, arrondi et borné (le navigateur ne pardonne pas `#100…`). */
function versHex(canaux: readonly number[]): string {
  return `#${canaux
    .map((canal) =>
      Math.round(Math.min(Math.max(canal, 0), 255))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`
}

/** Mélange linéaire de deux hexadécimaux : `t = 0` rend `de`, `t = 1` rend `vers`. */
function melange(de: string, vers: string, t: number): string {
  const a = versRgb(de)
  const b = versRgb(vers)
  return versHex([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t])
}

/** Point du dégradé continu `t ∈ [0, 1]` le long d'une rampe de teintes (borne et interpolate entre paliers). */
function couleurDegrade(rampe: readonly string[], t: number): string {
  const premiere = rampe[0] ?? '#000000'
  if (rampe.length < 2) return premiere
  if (t <= 0) return premiere
  const derniere = rampe[rampe.length - 1] ?? premiere
  if (t >= 1) return derniere
  const position = t * (rampe.length - 1)
  const index = Math.floor(position)
  return melange(rampe[index] ?? premiere, rampe[index + 1] ?? derniere, position - index)
}

/**
 * Échelle dégradée du calendrier : le domaine `[min, max]` est calculé sur les valeurs
 * agrégées du trimestre, et une valeur `v` se peint à `t = (v − min) / (max − min)` le long
 * de la rampe — la teinte la plus claire marque donc le jour le moins documenté, la plus
 * foncée le plus dense. Sans variation (`min === max`, ou données vides) : le milieu exact
 * de la rampe, pas une division par zéro. Les valeurs hors domaine sont bornées.
 */
export function echelleDegrade(valeurs: readonly number[], rampe: readonly string[]): EchelleDegrade {
  const min = valeurs.length > 0 ? Math.min(...valeurs) : 0
  const max = valeurs.length > 0 ? Math.max(...valeurs) : 1
  const etendue = max - min
  const couleur = (valeur: number | { valueOf(): number }): string => {
    const v = Number(valeur)
    const t = etendue === 0 ? 0.5 : Math.min(Math.max((v - min) / etendue, 0), 1)
    return couleurDegrade(rampe, t)
  }
  return Object.assign(couleur, {
    ticks: (compte = 5): number[] =>
      compte < 2 ? [min] : Array.from({ length: compte }, (_, i) => min + (etendue * i) / (compte - 1)),
  })
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
