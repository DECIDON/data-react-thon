import { COULEURS_SUJETS, theme } from '@/components/ui/chartTheme'
import type { PartSujet, Sujet } from '@/domain/1934'
import { ResponsivePie, type PieTooltipProps } from '@nivo/pie'

/**
 * Diagramme de répartition des sujets du jour (panneau du jour, accueil) : donut Nivo,
 * parts en pourcentage. Le composant ne connaît ni le corpus ni l'URL : il reçoit
 * l'agrégat `repartitionParSujet(documentsDuJour)` et rend, comme `BarMois` pour les mois.
 *
 * La couleur est appariée par **rang du sujet dans le corpus** (palette `COULEURS_SUJETS`) :
 * un sujet garde la même couleur d'un jour à l'autre. L'étiquette peinte sur l'arc est le
 * pourcentage ; le libellé du sujet vit dans la légende et l'infobulle.
 */

/** Ligne telle que peinte : `label` sert à la légende, `data` porte le reste (infobulle). */
type LigneDonut = { id: string; label: string; value: number; pourcentage: number }

/** Un pourcentage, à une décimale, à la française : « 33,3 % » (espace insécable). */
const FORMATEUR_POURCENTAGE = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})
export function formatPourcentage(pourcentage: number): string {
  return `${FORMATEUR_POURCENTAGE.format(pourcentage)}\u00a0%`
}

/** Agrégat du domaine + libellés du corpus → lignes de donut, dans l'ordre de l'agrégat. */
function versLignes(parts: readonly PartSujet[], sujets: readonly Sujet[]): LigneDonut[] {
  const libelleParSujet = new Map(sujets.map((sujet) => [sujet.id, sujet.label]))
  return parts.map((part) => ({
    id: part.sujetId,
    label: libelleParSujet.get(part.sujetId) ?? part.sujetId,
    value: part.documents,
    pourcentage: part.pourcentage,
  }))
}

/** Infobulle : libellé du sujet, compte d'associations, part en pourcentage. */
function Infobulle({ datum }: PieTooltipProps<LigneDonut>) {
  return (
    <div className="flex flex-col gap-1">
      <strong>{datum.label}</strong>
      <span>
        {datum.value} {datum.value > 1 ? 'associations' : 'association'} ·{' '}
        {formatPourcentage(datum.data.pourcentage)}
      </span>
    </div>
  )
}

interface RepartitionSujetsProps {
  /** Segments, issus de `repartitionParSujet(documentsDuJour)` (jamais vide : filtré en amont). */
  readonly parts: readonly PartSujet[]
  /** Corpus des sujets : traduire les `topicId` en libellés et stabiliser les couleurs. */
  readonly sujets: readonly Sujet[]
}

export function RepartitionSujets({ parts, sujets }: RepartitionSujetsProps) {
  if (parts.length === 0) return null
  // Rang du sujet dans le corpus → couleur stable d'un jour à l'autre (hors corpus : rang 0).
  const rangParSujet = new Map(sujets.map((sujet, rang) => [sujet.id, rang]))
  // Palette non vide par construction ; la double chute explicite tient à `noUncheckedIndexedAccess`.
  const couleurParSujet = (id: string | number): string =>
    COULEURS_SUJETS[(rangParSujet.get(String(id)) ?? 0) % COULEURS_SUJETS.length] ??
    COULEURS_SUJETS[0] ??
    '#0ea5e9'
  return (
    <section aria-labelledby="repartition-titre" className="flex flex-col gap-3">
      <h3 id="repartition-titre" className="text-xl font-semibold tracking-tight">
        Répartition des sujets
      </h3>
      {/* Le comptage est celui du domaine (spec §2) : la part se lit sur les associations, pas
          sur les documents — un document multi-sujets pèse dans chaque sujet qu'il porte. */}
      <p className="text-sm text-neutral-600">
        Parts calculées sur les <strong>associations document×sujet</strong> du jour : un document traitant
        plusieurs sujets compte dans chacun d’eux — détail au survol.
      </p>
      <div className="h-72 w-full">
        <ResponsivePie
          data={versLignes(parts, sujets)}
          theme={theme}
          innerRadius={0.55}
          padAngle={0.03}
          borderWidth={2}
          borderColor="#fafafa"
          colors={(datum) => couleurParSujet(datum.id)}
          arcLabel={(datum) => formatPourcentage(datum.data.pourcentage)}
          arcLabelsTextColor="#171717"
          tooltip={Infobulle}
          legends={[
            {
              // Le donut nourrit lui-même sa légende (pas de `dataFrom`, propre au bar).
              anchor: 'bottom',
              direction: 'row',
              itemDirection: 'left-to-right',
              itemsSpacing: 8,
              itemWidth: 14,
              itemHeight: 14,
              translateX: 0,
              translateY: 8,
            },
          ]}
        />
      </div>
    </section>
  )
}
