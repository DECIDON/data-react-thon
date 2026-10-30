import type { Document1934, Sujet } from '@/domain/1934'
import { repartitionParSujet } from '@/domain/1934'
import { CarteDocument } from './CarteDocument'
import { RepartitionSujets } from './RepartitionSujets'
import { formatDateLongue } from './presentation'

/**
 * Panneau « documents du jour » sous le calendrier (spec §4.1) : titre, date, répartition
 * des sujets du jour en pourcentages, puis une carte par document. Depuis 9.4, la carte
 * elle-même est factorisée dans `CarteDocument` (réutilisée par la page sujet) ; ce
 * composant garde l'habillage du panneau et l'agrégat du donut.
 * Composant aveugle à l'URL : la page lui fournit le jour (validé) et les documents.
 *
 * Chaque carte est un lien vers le sujet du document (post-R9) : `suivrevers` construit
 * l'URL du premier sujet portant le document (ordre du corpus = ordre d'autorité éditorial),
 * muni du lien profond `?doc=` — arriver sur la page sujet, c'est aussi retrouver le détail
 * du document cliqué.
 */

/**
 * Carte du jour → URL du premier sujet portant le document, avec ancre de détail.
 * `undefined` si le document ne porte aucun sujet (que le contrat Zod proscrit : la carte
 * reste alors simple, sans lien) — monnaie `undefined`, pas d'exception.
 */
export function suivrevers(doc: Document1934): string | undefined {
  const sujet = doc.subjects.at(0)
  return sujet === undefined ? undefined : `/sujet/${sujet.topicId}?doc=${doc.id}`
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
        <>
          <RepartitionSujets parts={repartitionParSujet(documents)} sujets={sujets} />
          <ul className="flex flex-col gap-3">
            {documents.map((doc) => (
              <li key={doc.id}>
                <CarteDocument doc={doc} sujets={sujets} lien={suivrevers(doc)} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
