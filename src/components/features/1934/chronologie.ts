import { COULEURS_POLARITE } from '@/components/ui/chartTheme'
import type { Couloir, Document1934, PointChronologie, Polarite } from '@/domain/1934'

/**
 * Adaptateur de la frise `@nivo/scatterplot` (spec §4.2, §5) : transposition des points du domaine
 * (`pointsChronologie`) vers les séries attendues par Nivo. Comme pour le calendrier, la
 * transformation est une décision de présentation : elle vit dans `components/features/`,
 * jamais dans `domain/` (C-003). Module sans framework : testable seul sous Vitest.
 *
 * Deux choix, documentés :
 * - Y **catégoriel** : Nivo (0.99) connait l'échelle `point`, les couloirs sont donc bien
 *   des catégories — pas de repli numérique 0/1 nécessaire. Les valeurs `y` sont des
 *   libellés français (« Presse » / « Parlement »), peints tels quels par l'axe.
 * - couleur par **polarité** : `@nivo/scatterplot` colore par série (le datum transmis à
 *   l'échelle de couleurs ne porte que `serieId`), d'où une série par couple
 *   couloir × polarité ; la couleur se relit depuis l'id de série (`couleurSerie`).
 */

/** Libellé français d'un couloir — sert d'étiquette d'axe et de valeur `y`. */
export const LIBELLE_COULOIR: Record<Couloir, string> = { presse: 'Presse', parlement: 'Parlement' }

/** Ordre d'affichage des couloirs (spec §4.2 : Presse d'abord) et des polarités. */
export const ORDRE_COULOIRS: readonly Couloir[] = ['presse', 'parlement']
export const ORDRE_POLARITES: readonly Polarite[] = ['positif', 'neutre', 'negatif']

/** Id de série Nivo pour un couple couloir × polarité (`id` ne sert qu'à retrouver la couleur). */
export function idSerie(couloir: Couloir, polarity: Polarite): string {
  return `${couloir}:${polarity}`
}

/** Couleur d'une série, relue depuis son id (`« presse:positif » → vert`, id inconnu → gris). */
export function couleurSerie(serieId: string): string {
  const polarity = serieId.split(':')[1]
  return polarity === 'positif' || polarity === 'neutre' || polarity === 'negatif'
    ? COULEURS_POLARITE[polarity]
    : '#a3a3a3'
}

/** Datum enrichi : ce que l'infobulle et le clic réclament (le clic pose `?doc=`, spec §5). */
export interface DatumChronologie {
  id: string
  x: string
  y: string
  polarity: Polarite
  doc: Document1934
}

/** Une série Nivo : { id, data } (contrat `ScatterPlotRawSerie`). */
export interface SerieChronologie {
  id: string
  data: DatumChronologie[]
}

/**
 * Points du domaine → séries couloir × polarité, vides comprises : le point d'une série est
 * **cliquable** et le clic pose `?doc=` (la page branche `onClick` sur `node.data.doc.id`).
 * Les couples sans document sont exclus.
 * @param documents pour enrichir chaque point de son document (tooltip date/source/extrait).
 */
export function versSériesChronologie(
  points: readonly PointChronologie[],
  documents: readonly Document1934[],
): SerieChronologie[] {
  const documentParId = new Map(documents.map((doc) => [doc.id, doc]))
  const series = new Map<string, DatumChronologie[]>()
  for (const point of points) {
    const doc = documentParId.get(point.id)
    if (doc === undefined) continue // un point sans document (lot désynchronisé) ne se peint pas.
    const serie = idSerie(point.lane, point.polarity)
    const donnees = series.get(serie) ?? []
    donnees.push({
      id: point.id,
      x: point.date,
      y: LIBELLE_COULOIR[point.lane],
      polarity: point.polarity,
      doc,
    })
    series.set(serie, donnees)
  }
  const triees: SerieChronologie[] = []
  for (const couloir of ORDRE_COULOIRS) {
    for (const polarity of ORDRE_POLARITES) {
      const donnees = series.get(idSerie(couloir, polarity))
      if (donnees !== undefined && donnees.length > 0)
        triees.push({ id: idSerie(couloir, polarity), data: donnees })
    }
  }
  return triees
}

/** Libellé de mois en français pour l'axe X temps (Nivo rend « Jan » par défaut). */
const FORMATEUR_MOIS = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
export function libelleMoisAxe(date: Date): string {
  return FORMATEUR_MOIS.format(date)
}
