import { theme } from '@/components/ui/chartTheme'
import type { PointChronologie } from '@/domain/1934'
import { ResponsiveAreaBump, type AreaBumpComputedSerie } from '@nivo/bump'
import { useMemo } from 'react'
import {
  couleurSerie,
  libelleBande,
  libelleMoisAxe,
  versBandesChronologie,
  type DatumBandeChronologie,
  type SerieBandeChronologie,
} from './chronologie'

/**
 * Frise chronologique du sujet (spec §4.2, relue) : X = mois du trimestre (axes en mois
 * français), une **bande** par couple couloir × polarité, épaisseur = quantité de
 * documents ce mois-là, couleur = polarité. Le composant ne connaît ni l'URL ni le
 * filtrage : il reçoit les points du domaine (déjà réduits aux documents filtrés).
 *
 * Décision documentée : l'AreaBump remplace le scatterplot — la frise raconte désormais
 * les **volumes** (qui domine, quand), plus l'éclatement des individualités. Contrepartie
 * assumée : une bande agrège N documents, le clic `?doc=` n'a plus de support ; c'est
 * l'infobulle qui rend les comptes, et la liste chronologique (9.3) qui reste le chemin
 * vers le détail.
 */

/** Marges : assez à gauche/droite pour les libellés de bande (« Parlement · négatif »), en bas pour les mois. */
const MARGE = { top: 16, right: 150, bottom: 48, left: 150 }

/** Infobulle : la bande survolée, son détail mois par mois, et son total. */
function Infobulle({
  serie,
}: {
  serie: AreaBumpComputedSerie<DatumBandeChronologie, Record<string, unknown>>
}) {
  const total = serie.data.data.reduce((somme, d) => somme + d.y, 0)
  return (
    <div className="flex max-w-72 flex-col gap-1">
      <strong>{libelleBande(serie.data)}</strong>
      {serie.data.data.map((d) => (
        <div key={d.x} className="flex justify-between gap-6">
          <span className="text-neutral-600">{libelleMoisAxe(d.x)}</span>
          <span>{d.y === 0 ? '—' : `${d.y} document${d.y > 1 ? 's' : ''}`}</span>
        </div>
      ))}
      <em className="text-neutral-600">Total du trimestre : {total}</em>
    </div>
  )
}

interface ChronologieProps {
  /** Points du domaine, issus de `pointsChronologie(documentsFiltres, sujetCourant)`. */
  readonly points: readonly PointChronologie[]
}

export function Chronologie({ points }: ChronologieProps) {
  const series: SerieBandeChronologie[] = useMemo(() => versBandesChronologie(points), [points])
  return (
    <section aria-labelledby="frise-titre" className="flex flex-col gap-3">
      <h2 id="frise-titre" className="text-2xl font-semibold tracking-tight">
        Chronologie du trimestre
      </h2>
      {/* Légende HTML (pas de légende Nivo ici) : même rendu que les puces de 9.3. */}
      <p className="text-sm text-neutral-600">
        Une bande par couloir et polarité, empilées par quantité —{' '}
        <span className="text-emerald-700">vert positif</span>,{' '}
        <span className="text-neutral-500">gris neutre</span>,{' '}
        <span className="text-red-700">rouge négatif</span>. Survolez une bande pour le détail mois par mois.
      </p>
      {series.length === 0 ? (
        <p className="text-sm text-neutral-600">Aucune prise de parole ni coupe de presse à peindre.</p>
      ) : (
        <div className="h-80 w-full">
          <ResponsiveAreaBump
            data={series}
            margin={MARGE}
            align="middle"
            theme={theme}
            colors={(serie: { id: string }) => couleurSerie(serie.id)}
            startLabel={libelleBande}
            endLabel={libelleBande}
            axisBottom={{ format: (mois: string | number) => libelleMoisAxe(String(mois)) }}
            tooltip={Infobulle}
          />
        </div>
      )}
    </section>
  )
}
