import { COULEURS_POLARITE, theme } from '@/components/ui/chartTheme'
import type { SerieParMois } from '@/domain/1934'
import { ResponsiveBar, type BarTooltipProps } from '@nivo/bar'

/**
 * Bar empilé mensuel du sujet (spec §4.2, §5) : mois × polarité, même palette que la
 * frise et les puces (rouge / gris / vert). Le composant ne connaît ni l'URL ni le
 * filtrage : il reçoit l'agrégat `seriesParMois(documentsFiltres, sujet)` et rend.
 *
 * La clé d'affichage « négatif » prend un accent : les clés Nivo servent aussi de
 * libellés (légende, infobulle), la transformation de l'agrégat du domaine (clé `negatif`)
 * en ligne de bar (clé `négatif`) est donc une décision de présentation, faite ici.
 */

/** Ligne telle que peinte : la clé d'empilement est le libellé français (légende, infobulle). */
type LigneBar = { mois: string; positif: number; neutre: number; négatif: number }

/** Clés Nivo, dans l'ordre d'empilement (positif en bas, négatif en haut). */
const CLES: readonly ('positif' | 'neutre' | 'négatif')[] = ['positif', 'neutre', 'négatif']

/** Tableau total clé → couleur (cohérence stricte avec `COULEURS_POLARITE`). */
const COULEUR_PAR_CLE: Record<(typeof CLES)[number], string> = {
  positif: COULEURS_POLARITE.positif,
  neutre: COULEURS_POLARITE.neutre,
  négatif: COULEURS_POLARITE.negatif,
}

/** Agrégat du domaine → lignes de bar (re-nommage de la clé `negatif` en `négatif`). */
function versLignes(series: readonly SerieParMois[]): LigneBar[] {
  return series.map((serie) => ({
    mois: serie.mois,
    positif: serie.positif,
    neutre: serie.neutre,
    négatif: serie.negatif,
  }))
}

/** Libellé de mois en français : « janvier 1934 » (l'agrégat ne porte que « 1934-01 »). */
const FORMATEUR_MOIS = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
/** 'AAAA-MM' strict : seule forme qu'on a le droit de passer au formateur de date. */
const MOIS_ISO = /^\d{4}-\d{2}$/
export function libelleMois(mois: string): string {
  // Garde défensive (bug R9 post-livraison : double formatage en infobulle → RangeError sous
  // ErrorBoundary) : toute valeur qui ne se lit pas comme un mois valide est un libellé déjà
  // fait (ou un bruit), on la rend telle quelle.
  if (!MOIS_ISO.test(mois)) {
    return mois
  }
  const date = new Date(`${mois}-01T00:00:00Z`)
  return Number.isFinite(date.getTime()) ? FORMATEUR_MOIS.format(date) : mois
}

/** Infobulle : mois en titre, compte par polarité (spec §5, infobulle date + contenu). */
function Infobulle({ data, label }: BarTooltipProps<LigneBar>) {
  return (
    <div className="flex flex-col gap-1">
      <strong>{typeof label === 'string' ? libelleMois(label) : String(label)}</strong>
      {CLES.map((cle) => (
        <span key={cle}>
          <span style={{ color: COULEUR_PAR_CLE[cle] }}>●</span> {cle} : {String(data[cle] ?? 0)}
        </span>
      ))}
    </div>
  )
}

interface BarMoisProps {
  /** Séries mensuelles, issues de `seriesParMois(documentsFiltres, sujetCourant)`. */
  readonly series: readonly SerieParMois[]
}

export function BarMois({ series }: BarMoisProps) {
  if (series.length === 0) {
    return (
      <section aria-labelledby="bar-titre" className="flex flex-col gap-3">
        <h2 id="bar-titre" className="text-2xl font-semibold tracking-tight">
          Rythme mensuel
        </h2>
        <p className="text-sm text-neutral-600">Aucun document sur la période filtrée — rien à empiler.</p>
      </section>
    )
  }
  return (
    <section aria-labelledby="bar-titre" className="flex flex-col gap-3">
      <h2 id="bar-titre" className="text-2xl font-semibold tracking-tight">
        Rythme mensuel
      </h2>
      <p className="text-sm text-neutral-600">
        Documents du sujet par mois et par polarité — légende sous les barres, détail au survol.
      </p>
      <div className="h-72 w-full">
        <ResponsiveBar
          data={versLignes(series)}
          keys={[...CLES]}
          indexBy="mois"
          theme={theme}
          margin={{ top: 8, right: 16, bottom: 56, left: 44 }}
          borderRadius={3}
          enableLabel={false}
          axisBottom={{ format: (valeur: string | number) => libelleMois(String(valeur)) }}
          // Rends l'index BRUT ('AAAA-MM') : c'est l'Infobulle qui met en français — pas les deux.
          tooltipLabel={(datum) => String(datum.indexValue)}
          colors={(datum: { id: string | number }) =>
            COULEUR_PAR_CLE[String(datum.id) as (typeof CLES)[number]]
          }
          tooltip={Infobulle}
          legends={[
            {
              dataFrom: 'keys',
              anchor: 'top-right',
              direction: 'row',
              itemDirection: 'left-to-right',
              itemsSpacing: 6,
              itemWidth: 14,
              itemHeight: 14,
              translateX: -8,
              translateY: -6,
            },
          ]}
        />
      </div>
    </section>
  )
}
