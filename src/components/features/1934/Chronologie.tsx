import { theme } from '@/components/ui/chartTheme'
import type { Document1934, PointChronologie } from '@/domain/1934'
import { PERIODE_1934 } from '@/domain/1934'
import { ResponsiveScatterPlot, type ScatterPlotTooltipProps } from '@nivo/scatterplot'
import { useMemo } from 'react'
import { LIBELLE_POLARITE } from './CarteDocument'
import {
  couleurSerie,
  libelleMoisAxe,
  versSériesChronologie,
  type DatumChronologie,
  type SerieChronologie,
} from './chronologie'
import { libelleChambre, tronquer } from './presentation'

/**
 * Frise chronologique du sujet (spec §4.2) : X = date (Q1 1934, axe en mois français),
 * Y = deux couloirs catégoriels « Presse » / « Parlement », couleur = polarité.
 * Le composant ne connaît ni l'URL ni le filtrage : il reçoit les points du domaine
 * (déjà réduits aux documents filtrés) et remonte l'id du document cliqué (spec §5 :
 * clic → `?doc=`).
 *
 * Repli assumé, levé — décision documentée : la spec laissait la place à un repli
 * « Y numérique 0/1 avec axe custom » si Nivo butait sur les couloirs catégoriels.
 * `@nivo/scatterplot` 0.99 expose l'échelle `point` (catégorielle) : le repli n'est PAS
 * nécessaire, les couloirs sont de vraies catégories, peintes par l'axe gauche. En
 * revanche la couleur est attachée à la **série** (le datum transmis à l'échelle de
 * couleurs ne porte que `serieId`), d'où une série par couple couloir × polarité et une
 * couleur relue depuis l'id de série — voir `chronologie.ts`.
 */

/** Marges : assez à gauche pour les libellés « Presse »/« Parlement », en bas pour les mois. */
const MARGE = { top: 16, right: 24, bottom: 48, left: 92 }

const FORMATEUR_JOUR = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

/** Infobulle (spec §5) : date + source ou locuteur + polarité + extrait tronqué. */
function Infobulle({ node }: ScatterPlotTooltipProps<DatumChronologie>) {
  const doc = node.data.doc
  return (
    <div className="flex max-w-72 flex-col gap-1">
      <strong>{FORMATEUR_JOUR.format(new Date(`${doc.date}T00:00:00Z`))}</strong>
      <span>
        {doc.speaker !== undefined
          ? `${doc.speaker.name} — ${libelleChambre(doc.speaker.chamber)}`
          : doc.source.title}
      </span>
      <span>Polarité : {LIBELLE_POLARITE[node.data.polarity]}</span>
      <em className="text-neutral-600">{tronquer(doc.content, 120)}</em>
    </div>
  )
}

interface ChronologieProps {
  /** Points du domaine, issus de `pointsChronologie(documentsFiltres, sujetCourant)`. */
  readonly points: readonly PointChronologie[]
  /** Documents filtrés correspondants (enrichissement de l'infobulle). */
  readonly documents: readonly Document1934[]
  /** Clic sur un point : la page pose `?doc=` (spec §5). */
  readonly surDocumentClique: (id: string) => void
}

export function Chronologie({ points, documents, surDocumentClique }: ChronologieProps) {
  const series: SerieChronologie[] = useMemo(
    () => versSériesChronologie(points, documents),
    [points, documents],
  )
  return (
    <section aria-labelledby="frise-titre" className="flex flex-col gap-3">
      <h2 id="frise-titre" className="text-2xl font-semibold tracking-tight">
        Chronologie du trimestre
      </h2>
      {/* Légende HTML (pas de légende Nivo ici) : même rendu que les puces de 9.3. */}
      <p className="text-sm text-neutral-600">
        Chaque point est un document du sujet, coloré selon sa polarité —{' '}
        <span className="text-emerald-700">vert positif</span>,{' '}
        <span className="text-neutral-500">gris neutre</span>,{' '}
        <span className="text-red-700">rouge négatif</span>. Cliquez un point pour l’ouvrir.
      </p>
      <div className="h-80 w-full">
        <ResponsiveScatterPlot
          data={series}
          margin={MARGE}
          xScale={{ type: 'time', format: '%Y-%m-%d', min: PERIODE_1934.du, max: PERIODE_1934.au }}
          yScale={{ type: 'point' }}
          axisBottom={{ format: (date: Date) => libelleMoisAxe(date) }}
          axisLeft={{ tickSize: 0 }}
          enableGridY={false}
          colors={(datum: { serieId: string | number }) => couleurSerie(String(datum.serieId))}
          nodeSize={12}
          theme={theme}
          tooltip={Infobulle}
          onClick={(node) => surDocumentClique(node.data.id)}
        />
      </div>
    </section>
  )
}
