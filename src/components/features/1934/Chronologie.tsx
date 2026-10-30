import { theme } from '@/components/ui/chartTheme'
import type { PointChronologie } from '@/domain/1934'
import { ResponsiveAreaBump, type AreaBumpComputedSerie } from '@nivo/bump'
import { useMemo } from 'react'
import {
  couleurSerie,
  libelleBande,
  libelleMoisAxe,
  MODES_FRISE,
  versBandesChronologie,
  type DatumBandeChronologie,
  type ModeFrise,
  type SerieBandeChronologie,
} from './chronologie'

/**
 * Frise chronologique du sujet (spec §4.2, relue) : X = mois du trimestre (axes en mois
 * français), une **bande** par couple couloir × polarité, épaisseur = quantité de
 * documents ce mois-là (ou part du mois, selon l'échelle choisie), couleur = polarité.
 * Le composant ne connaît ni l'URL ni le filtrage : il reçoit les points du domaine
 * (déjà réduits aux documents filtrés) et l'échelle courante ; il remonte le changement
 * d'échelle, c'est la page qui écrit `?frise=`.
 *
 * Décision documentée : l'AreaBump remplace le scatterplot — la frise raconte désormais
 * les **volumes** (qui domine, quand), plus l'éclatement des individualités. Contrepartie
 * assumée : une bande agrège N documents, le clic `?doc=` n'a plus de support ; c'est
 * l'infobulle qui rend les comptes, et la liste chronologique (9.3) qui reste le chemin
 * vers le détail.
 */

/** Marges : assez à gauche/droite pour les libellés de bande (« Parlement · négatif »), en bas pour les mois. */
const MARGE = { top: 16, right: 150, bottom: 48, left: 150 }

/** Libellés du segmented d'échelle. */
const LIBELLE_MODE: Record<ModeFrise, string> = {
  effectifs: 'Effectifs absolus',
  parts: 'Parts relatives',
}

/** Part 0–1 → « 42,5 % » (fr-FR). */
const FORMATEUR_PART = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1 })

/** Infobulle : la bande survolée, son détail mois par mois (compte **et** part, quel que soit le mode), et son total. */
function Infobulle({
  serie,
}: {
  serie: AreaBumpComputedSerie<DatumBandeChronologie, Record<string, unknown>>
}) {
  const total = serie.data.data.reduce((somme, d) => somme + d.compte, 0)
  return (
    <div className="flex max-w-72 flex-col gap-1">
      <strong>{libelleBande(serie.data)}</strong>
      {serie.data.data.map((d) => (
        <div key={d.x} className="flex justify-between gap-6">
          <span className="text-neutral-600">{libelleMoisAxe(d.x)}</span>
          <span>{d.compte === 0 ? '—' : `${d.compte} doc · ${FORMATEUR_PART.format(d.part)}`}</span>
        </div>
      ))}
      <em className="text-neutral-600">Total du trimestre : {total}</em>
    </div>
  )
}

interface ChronologieProps {
  /** Points du domaine, issus de `pointsChronologie(documentsFiltres, sujetCourant)`. */
  readonly points: readonly PointChronologie[]
  /** Échelle courante (lue de `?frise=` par la page) : comptes bruts ou parts du mois. */
  readonly mode: ModeFrise
  /** Choix de l'échelle : la page pose `?frise=` (le composant ignore l'URL). */
  readonly surChangementMode: (mode: ModeFrise) => void
}

export function Chronologie({ points, mode, surChangementMode }: ChronologieProps) {
  const series: SerieBandeChronologie[] = useMemo(() => versBandesChronologie(points, mode), [points, mode])
  return (
    <section aria-labelledby="frise-titre" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="frise-titre" className="text-2xl font-semibold tracking-tight">
          Chronologie du trimestre
        </h2>
        {/* Segmented d'échelle, même patron que celui de la barre de filtres (aria-pressed). */}
        <div
          role="group"
          aria-label="Échelle de la frise"
          className="flex overflow-hidden rounded-md border border-neutral-300"
        >
          {MODES_FRISE.map((modePossible) => (
            <button
              key={modePossible}
              type="button"
              aria-pressed={mode === modePossible}
              onClick={() => surChangementMode(modePossible)}
              className={`px-3 py-1.5 text-sm ${
                mode === modePossible
                  ? 'bg-neutral-900 text-neutral-50'
                  : 'bg-white text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              {LIBELLE_MODE[modePossible]}
            </button>
          ))}
        </div>
      </div>
      {/* Légende HTML (pas de légende Nivo ici) : même rendu que les puces de 9.3. */}
      <p className="text-sm text-neutral-600">
        Une bande par couloir et polarité — <span className="text-emerald-700">vert positif</span>,{' '}
        <span className="text-neutral-500">gris neutre</span>,{' '}
        <span className="text-red-700">rouge négatif</span>.{' '}
        {mode === 'parts'
          ? 'Chaque colonne est remplie à 100 % : la bande peint la part qu’y prend le couple ce mois-là.'
          : 'Épaisseur = nombre de documents du mois : une colonne courte est un mois creux.'}{' '}
        Survolez une bande pour le détail mois par mois.
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
