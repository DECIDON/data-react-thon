import type { Document1934, Sujet } from '@/domain/1934'
import { CarteDocument } from './CarteDocument'
import { formatDateLongue } from './presentation'

/**
 * Panneau « documents du jour » sous le calendrier (spec §4.1) : titre, date, puis une
 * carte par document. Depuis 9.4, la carte elle-même est factorisée dans `CarteDocument`
 * (réutilisée par la page sujet) ; ce composant ne garde que l'habillage du panneau.
 * Composant aveugle à l'URL : la page lui fournit le jour (validé) et les documents.
 */

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
          {documents.map((doc) => (
            <li key={doc.id}>
              <CarteDocument doc={doc} sujets={sujets} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
