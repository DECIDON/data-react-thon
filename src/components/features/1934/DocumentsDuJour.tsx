import type { Document1934, Polarite, Sujet } from '@/domain/1934'
import { estPriseDeParole } from '@/domain/1934'
import { formatDateLongue, libelleChambre, tronquer } from './presentation'

/**
 * Panneau « documents du jour » sous le calendrier (spec §4.1) : titre, date, type,
 * extrait tronqué et puces de polarité par sujet. Composant aveugle à l'URL : la page
 * lui fournit le jour (validé) et les documents de ce jour.
 */

/** Pastille du couloir — les deux mots du glossaire, jamais « article » ni « discours ». */
const LIBELLE_TYPE = { presse: 'Coupe de presse', parlement: 'Prise de parole' } as const

/** Puces de polarité : rouge / gris / vert, tables totales (ARCHITECTURE.md §4). */
const CLASSE_POLARITE: Record<Polarite, string> = {
  positif: 'bg-emerald-50 text-emerald-800',
  neutre: 'bg-neutral-100 text-neutral-600',
  negatif: 'bg-red-50 text-red-700',
}
const LIBELLE_POLARITE: Record<Polarite, string> = {
  positif: 'positif',
  neutre: 'neutre',
  negatif: 'négatif',
}

interface DocumentsDuJourProps {
  readonly jour: string
  readonly documents: readonly Document1934[]
  /** Pour traduire les `topicId` des puces en libellés de sujets. */
  readonly sujets: readonly Sujet[]
}

export function DocumentsDuJour({ jour, documents, sujets }: DocumentsDuJourProps) {
  return (
    <section aria-labelledby="jour-titre" className="flex flex-col gap-3">
      <h2 id="jour-titre" className="text-2xl font-semibold tracking-tight">
        Documents du {formatDateLongue(jour)}
      </h2>
      {documents.length === 0 ? (
        <p className="text-sm text-neutral-600">Aucun document au registre pour ce jour-là.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {documents.map((doc) => {
            const couloir = estPriseDeParole(doc) ? 'parlement' : 'presse'
            return (
              <li key={doc.id} className="rounded-lg border border-neutral-200 bg-white p-4">
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
                <ul aria-label="Polarités par sujet" className="mt-3 flex flex-wrap gap-2">
                  {doc.subjects.map((association) => (
                    <li
                      key={association.topicId}
                      className={`rounded-full px-2 py-0.5 text-xs ${CLASSE_POLARITE[association.polarity]}`}
                    >
                      {sujets.find((sujet) => sujet.id === association.topicId)?.label ?? association.topicId}{' '}
                      · {LIBELLE_POLARITE[association.polarity]}
                    </li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
