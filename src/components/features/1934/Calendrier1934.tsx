import { theme } from '@/components/ui/chartTheme'
import type { JourCorpus } from '@/domain/1934'
import { PERIODE_1934 } from '@/domain/1934'
import { ResponsiveCalendar } from '@nivo/calendar'
import { useMemo } from 'react'
import { versCalendrier } from './calendrier'

/**
 * Bandeau calendrier du trimestre (spec §4.1) : Q1 1934, intensité = documents du jour.
 * Le composant ne connaît ni le corpus ni l'URL : il reçoit l'agrégat `JourCorpus[]`,
 * rend l'agrégat au calendrier et remonte le jour cliqué. La page branche l'URL.
 */

/** Rampe d'intensité « papier journal » : amber-200 → amber-500 → amber-900 (palette Tailwind). */
const RAMPE_INTENSITE = ['#fde68a', '#f59e0b', '#78350f']

/** Jours sans document : la teinte de la page à peine teintée (neutral-100). */
const COULEUR_VIDE = '#f5f5f5'

/** Séparations teintées plutôt qu'encre noire : le calendrier doit rester discret. */
const COULEUR_GRILLE = '#fafafa'
const COULEUR_MOIS = '#d4d4d4'

/** Légende de mois en français (Nivo rend « 01 » par défaut). */
const FORMATEUR_MOIS = new Intl.DateTimeFormat('fr-FR', { month: 'long' })
function legendeMois(_annee: number, _mois: number, date: Date): string {
  const nom = FORMATEUR_MOIS.format(date)
  return nom.charAt(0).toUpperCase() + nom.slice(1)
}

interface Calendrier1934Props {
  readonly jours: readonly JourCorpus[]
  /** Jour actuellement retenu dans l'URL (surligné par la mention sous le graphique). */
  readonly jourSelectionne: string | null
  /** Le calendrier ne décide de rien : il signale le jour cliqué. */
  readonly surJourClique: (jour: string) => void
}

export function Calendrier1934({ jours, jourSelectionne, surJourClique }: Calendrier1934Props) {
  const data = useMemo(() => versCalendrier(jours), [jours])
  return (
    <section
      aria-labelledby="calendrier-titre"
      aria-describedby="calendrier-legende"
      className="flex flex-col gap-3"
    >
      <h2 id="calendrier-titre" className="text-2xl font-semibold tracking-tight">
        Le trimestre en un coup d’œil
      </h2>
      {/* Le calendrier ne peut pas départager presse et parlement dans une même case :
          la légende le dit (spec §4.1). */}
      <p id="calendrier-legende" className="text-sm text-neutral-600">
        Plus une case est foncée, plus le jour compte de documents —{' '}
        <strong>coupes de presse et prises de parole confondues</strong>. Cliquez une case pour afficher le
        détail du jour sous le calendrier.
      </p>
      <div className="h-72 w-full sm:h-96">
        <ResponsiveCalendar
          from={PERIODE_1934.du}
          to={PERIODE_1934.au}
          data={data}
          colors={RAMPE_INTENSITE}
          emptyColor={COULEUR_VIDE}
          dayBorderWidth={1}
          dayBorderColor={COULEUR_GRILLE}
          monthBorderWidth={2}
          monthBorderColor={COULEUR_MOIS}
          monthLegend={legendeMois}
          onClick={(datum) => surJourClique(datum.day)}
          theme={theme}
        />
      </div>
      {jourSelectionne !== null && (
        <p className="text-sm text-neutral-500">
          Jour retenu : {jourSelectionne} — cliquez à nouveau pour libérer.
        </p>
      )}
    </section>
  )
}
