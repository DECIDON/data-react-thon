import { COULEURS_POLARITE } from '@/components/ui/chartTheme'
import type { Couloir, PointChronologie, Polarite } from '@/domain/1934'
import { PERIODE_1934 } from '@/domain/1934'

/**
 * Adaptateur de la frise `@nivo/bump` (AreaBump, spec §4.2 revisitée) : transposition des
 * points du domaine (`pointsChronologie`) en bandes empilées par mois. Comme pour le
 * calendrier, la transformation est une décision de présentation : elle vit dans
 * `components/features/`, jamais dans `domain/` (C-003). Module sans framework : testable
 * seul sous Vitest.
 *
 * Trois choix, documentés :
 * - X **mensuel** : une colonne par mois complet du trimestre (`1934-01` … `1934-03`).
 *   Contrairement au LineBump, l'AreaBump accepte N colonnes (son `compute.ts` construit
 *   lui-même la `scalePoint` des x rencontrés) ; on padde donc chaque série de zéros pour
 *   que toute bande traverse toutes les colonnes.
 * - une série par couple couloir × polarité (6 au plus) : l'AreaBump empile et trie les
 *   bandes par valeur à chaque colonne, la couleur (portée par la série) reste donc le
 *   seul fil de polarité lisible — relue depuis l'id de série (`couleurSerie`).
 * - **agrégat, plus de document** : le clic `?doc=` du scatterplot n'a plus de sens sous
 *   une bande (une bande couvre N documents) ; l'infobulle montre les comptes. Les couples
 *   sans document sont exclus : rien à peindre, rien à survoler.
 * - **échelle commutable** (`ModeFrise`) : « effectifs » peint les comptes bruts — la
 *   hauteur totale d'une colonne raconte donc aussi le volume du mois ; « parts » normalise
 *   chaque colonne à 100 % — seule la répartition du mois se lit, les volumes entre mois
 *   s'effacent. Le datum peint la valeur de l'échelle courante (`y`) mais conserve toujours
 *   le compte brut (`compte`) et la part du mois (`part`) : l'infobulle ne ment jamais.
 */

/** Échelle d'affichage de la frise : comptes bruts (défaut) ou parts relatives (chaque colonne à 100 %). */
export const MODES_FRISE = ['effectifs', 'parts'] as const
export type ModeFrise = (typeof MODES_FRISE)[number]

/** Libellé français d'un couloir — sert d'étiquette de bande. */
export const LIBELLE_COULOIR: Record<Couloir, string> = { presse: 'Presse', parlement: 'Parlement' }

/** Ordre d'affichage des couloirs (spec §4.2 : Presse d'abord) et des polarités. */
export const ORDRE_COULOIRS: readonly Couloir[] = ['presse', 'parlement']
export const ORDRE_POLARITES: readonly Polarite[] = ['positif', 'neutre', 'negatif']

/** Libellé court de polarité pour les bandes — relû ici pour garder le module sans framework. */
const LIBELLE_POLARITE_BANDE: Record<Polarite, string> = {
  positif: 'positif',
  neutre: 'neutre',
  negatif: 'négatif',
}

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

/** Libellé lisible d'une bande, relu depuis son id (`« parlement:negatif » → « Parlement · négatif »`). */
export function libelleBande(serie: { id: string }): string {
  const [couloir, polarity] = serie.id.split(':')
  if (couloir === 'presse' || couloir === 'parlement') {
    const libellePolarite =
      polarity === 'positif' || polarity === 'neutre' || polarity === 'negatif'
        ? LIBELLE_POLARITE_BANDE[polarity]
        : undefined
    if (libellePolarite !== undefined) return `${LIBELLE_COULOIR[couloir]} · ${libellePolarite}`
  }
  return serie.id // id imprévu : on l'affiche brut plutôt que de mentir.
}

/**
 * Datum d'une colonne AreaBump (alias, pas interface : Nivo l'examine structurellement) :
 * `y` = valeur peinte selon l'échelle courante (compte brut, ou part 0–1) ; `compte` et
 * `part` sont toujours là, l'infobulle rend le vrai quel que soit le mode.
 */
export type DatumBandeChronologie = {
  /** Colonne : mois ISO `YYYY-MM`. */
  x: string
  /** Valeur peinte : compte (mode effectifs) ou part du mois 0–1 (mode parts). */
  y: number
  /** Compte brut de documents ce mois-là — toujours, même en mode parts. */
  compte: number
  /** Part du mois, 0–1 (0 si le mois est vide) — toujours, même en mode effectifs. */
  part: number
}

/** Une série AreaBump : { id, data } (contrat `AreaBumpSerie` ; alias, pas interface : Nivo l'intersecte avec `Record<string, unknown>`). */
export type SerieBandeChronologie = { id: string; data: DatumBandeChronologie[] }

/**
 * Tous les mois de la période (`YYYY-MM`), croissants — les colonnes de la frise, zéros
 * compris : chaque bande traverse toutes les colonnes, sinon son aire se brise.
 * Borné par `PERIODE_1934` (janvier → mars 1934), dérivé et non codé en dur.
 */
export function moisDeLaPeriode(du: string = PERIODE_1934.du, au: string = PERIODE_1934.au): string[] {
  const mois: string[] = []
  let annee = Number(du.slice(0, 4))
  let numero = Number(du.slice(5, 7))
  const anneeFin = Number(au.slice(0, 4))
  const numeroFin = Number(au.slice(5, 7))
  while (annee < anneeFin || (annee === anneeFin && numero <= numeroFin)) {
    mois.push(`${annee}-${String(numero).padStart(2, '0')}`)
    numero += 1
    if (numero === 13) {
      numero = 1
      annee += 1
    }
  }
  return mois
}

/**
 * Points du domaine → bandes couloir × polarité, zéros padding sur chaque mois de la
 * période. Un document compte une fois par association document×sujet (le point est déjà
 * émis par association, spec §2). Les couples sans aucun document sont exclus.
 * En mode « parts », `y` est la part du compte dans le total du mois (le mois vide reste à 0).
 */
export function versBandesChronologie(
  points: readonly PointChronologie[],
  mode: ModeFrise = 'effectifs',
): SerieBandeChronologie[] {
  const mois = moisDeLaPeriode()
  const visibles = new Set(mois)
  // comptes[`${couloir}:${polarité}`][`YYYY-MM`] = nombre de documents.
  const comptes = new Map<string, Map<string, number>>()
  for (const point of points) {
    const moisDuPoint = point.date.slice(0, 7)
    if (!visibles.has(moisDuPoint)) continue // hors période : rien à peindre dans ces colonnes.
    const serie = idSerie(point.lane, point.polarity)
    const parMois = comptes.get(serie) ?? new Map<string, number>()
    parMois.set(moisDuPoint, (parMois.get(moisDuPoint) ?? 0) + 1)
    comptes.set(serie, parMois)
  }
  // Total de chaque mois, toutes bandes confondues — le dénominateur des parts.
  const totalParMois = new Map<string, number>()
  for (const parMois of comptes.values())
    for (const [m, n] of parMois) totalParMois.set(m, (totalParMois.get(m) ?? 0) + n)
  const triees: SerieBandeChronologie[] = []
  for (const couloir of ORDRE_COULOIRS) {
    for (const polarity of ORDRE_POLARITES) {
      const serie = idSerie(couloir, polarity)
      const parMois = comptes.get(serie)
      if (parMois === undefined) continue // couple sans document : pas de bande.
      triees.push({
        id: serie,
        data: mois.map((m) => {
          const compte = parMois.get(m) ?? 0
          const total = totalParMois.get(m) ?? 0
          const part = total === 0 ? 0 : compte / total
          return { x: m, y: mode === 'parts' ? part : compte, compte, part }
        }),
      })
    }
  }
  return triees
}

/** Libellé de mois en français pour l'axe X (`« 1934-02 » → « février 1934 »`). */
const FORMATEUR_MOIS = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
export function libelleMoisAxe(mois: string): string {
  return FORMATEUR_MOIS.format(new Date(`${mois}-01T00:00:00Z`))
}
