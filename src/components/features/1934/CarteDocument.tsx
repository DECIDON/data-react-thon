import type { Document1934, Polarite, Sujet } from '@/domain/1934'
import { estPriseDeParole } from '@/domain/1934'
import type { ReactNode } from 'react'
import { formatDateLongue, libelleChambre, tronquer } from './presentation'

/**
 * Carte de document — l'unité de rendu réutilisée par le panneau du jour (9.3), les
 * extraits phares, le miroir et la liste filtrée (9.4). Extraite de `DocumentsDuJour`
 * sans changer un octet du rendu : même pastille de couloir, même bandeau date + source,
 * mêmes puces de polarité par sujet. Composant aveugle à l'URL : c'est la page qui pose
 * l'ancre (`ancre`) et décide du surlignage (`cible`).
 */

/** Pastille du couloir — les deux mots du glossaire, jamais « article » ni « discours ». */
export const LIBELLE_TYPE = { presse: 'Coupe de presse', parlement: 'Prise de parole' } as const

/** Puces de polarité : rouge / gris / vert, tables totales (ARCHITECTURE.md §4). */
export const CLASSE_POLARITE: Record<Polarite, string> = {
  positif: 'bg-emerald-50 text-emerald-800',
  neutre: 'bg-neutral-100 text-neutral-600',
  negatif: 'bg-red-50 text-red-700',
}
export const LIBELLE_POLARITE: Record<Polarite, string> = {
  positif: 'positif',
  neutre: 'neutre',
  negatif: 'négatif',
}

interface CarteDocumentProps {
  readonly doc: Document1934
  /** Pour traduire les `topicId` des puces en libellés de sujets. */
  readonly sujets: readonly Sujet[]
  /** Document visé par `?doc=` : anneau de surlignage et rôle `aria-current`. */
  readonly cible?: boolean
  /**
   * Id HTML d'ancre pour le lien profond (ex. `document-cp-003`). La carte est alors rendue
   * programmable au focus (`tabIndex -1`) : à la fermeture du détail 9.5, si le déclencheur a
   * disparu, le focus peut revenir sur la carte ancrée plutôt que tomber en fin de page.
   */
  readonly ancre?: string
  /** Pied de carte optionnel (ex. bouton « voir le détail » de la liste filtrée). */
  readonly children?: ReactNode
}

/**
 * Puces de polarité par sujet — extraites de la carte sans changer un octet du rendu, pour
 * que le détail (9.5) et la carte partagent la même logique (étiquettes, classes, ordre).
 */
export function PucesPolarite({
  doc,
  sujets,
}: {
  readonly doc: Document1934
  readonly sujets: readonly Sujet[]
}) {
  return (
    <ul aria-label="Polarités par sujet" className="mt-3 flex flex-wrap gap-2">
      {doc.subjects.map((association) => (
        <li
          key={association.topicId}
          className={`rounded-full px-2 py-0.5 text-xs ${CLASSE_POLARITE[association.polarity]}`}
        >
          {sujets.find((sujet) => sujet.id === association.topicId)?.label ?? association.topicId} ·{' '}
          {LIBELLE_POLARITE[association.polarity]}
        </li>
      ))}
    </ul>
  )
}

export function CarteDocument({ doc, sujets, cible = false, ancre, children }: CarteDocumentProps) {
  const couloir = estPriseDeParole(doc) ? 'parlement' : 'presse'
  return (
    <article
      id={ancre}
      tabIndex={ancre !== undefined ? -1 : undefined}
      aria-current={cible ? 'true' : undefined}
      className={`rounded-lg border bg-white p-4 ${
        cible ? 'border-amber-500 ring-2 ring-amber-300' : 'border-neutral-200'
      }`}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="rounded-full bg-neutral-900 px-2.5 py-0.5 text-xs font-medium text-neutral-50">
          {LIBELLE_TYPE[couloir]}
        </span>
        <span className="text-sm text-neutral-500">
          {formatDateLongue(doc.date)} · {doc.source.title}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-neutral-800">{tronquer(doc.content)}</p>
      {doc.speaker !== undefined && (
        <p className="mt-1 text-xs text-neutral-500">
          {doc.speaker.name} — {libelleChambre(doc.speaker.chamber)}
        </p>
      )}
      <PucesPolarite doc={doc} sujets={sujets} />
      {children}
    </article>
  )
}
