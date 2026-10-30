import type { Document1934, Sujet } from '@/domain/1934'
import { Link } from 'react-router'
import { compteursSujet, documentsDuSujet } from './presentation'

/**
 * Vitrine des sujets (spec §4.1) : cartes des sujets `featured` (label, teaser,
 * compteurs coupes/prises) menant vers `/sujet/:id`, et liste discrète du reste.
 * Le glossaire fait foi : « vitrine », jamais « à la une ».
 */

interface SujetsVitrineProps {
  readonly sujets: readonly Sujet[]
  /** Corpus complet : les compteurs sont dérivés ici, pas stockés. */
  readonly documents: readonly Document1934[]
}

export function SujetsVitrine({ sujets, documents }: SujetsVitrineProps) {
  const vitrine = sujets.filter((sujet) => sujet.featured)
  const reste = sujets.filter((sujet) => !sujet.featured)
  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="sujets-titre" className="flex flex-col gap-4">
        <h2 id="sujets-titre" className="text-2xl font-semibold tracking-tight">
          Sujets en vitrine
        </h2>
        <ul className="grid gap-4 sm:grid-cols-3">
          {vitrine.map((sujet) => {
            const compteurs = compteursSujet(documentsDuSujet(documents, sujet.id))
            return (
              <li key={sujet.id}>
                <article className="flex h-full flex-col rounded-lg border border-neutral-200 bg-white p-4">
                  <h3 className="text-lg font-semibold">
                    {/* Carte entière = un seul lien au nom du sujet (libellé réel, C-006). */}
                    <Link to={`/sujet/${sujet.id}`} className="hover:underline">
                      {sujet.label}
                    </Link>
                  </h3>
                  <p className="mt-2 flex-1 text-sm text-neutral-600">{sujet.teaser}</p>
                  <p className="mt-3 text-xs text-neutral-500">
                    {compteurs.coupes} coupes · {compteurs.prises} prises au registre
                  </p>
                </article>
              </li>
            )
          })}
        </ul>
      </section>
      {reste.length > 0 && (
        <section aria-labelledby="sujets-reste-titre" className="flex flex-col gap-2">
          <h2 id="sujets-reste-titre" className="text-sm font-medium text-neutral-500">
            Aussi au registre
          </h2>
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {reste.map((sujet) => (
              <li key={sujet.id}>
                <Link
                  to={`/sujet/${sujet.id}`}
                  className="text-neutral-700 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-600"
                >
                  {sujet.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
