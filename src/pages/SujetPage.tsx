import { ErreurCorpus } from '@/components/common/ErreurCorpus'
import { BarMois } from '@/components/features/1934/BarMois'
import { BarreDeFiltres } from '@/components/features/1934/BarreDeFiltres'
import { CarteDocument } from '@/components/features/1934/CarteDocument'
import { Chronologie } from '@/components/features/1934/Chronologie'
import { Miroir } from '@/components/features/1934/Miroir'
import {
  appliquerFiltres,
  filtrer,
  lireFiltresDepuisURL,
  type FiltresSujet,
} from '@/components/features/1934/filtres'
import { compteursSujet, libelleChambre } from '@/components/features/1934/presentation'
import type { Chambre, Document1934 } from '@/domain/1934'
import { pointsChronologie, selectionMiroir, seriesParMois } from '@/domain/1934'
import { useDocumentsDuSujet, useListesDeFiltres } from '@/hooks/data/useCorpus1934'
import { useEffect, useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'

/**
 * Page sujet (spec §4.2, mouture complète de l'étape 9.4). Dans l'ordre imposé par la
 * spec : en-tête (label, description, compteurs, badge de chambre si orateur filtré) ;
 * extraits **phares** ; **miroir** presse/parlement ; filtres secondaires ; frise
 * `scatter` cliquable ; bar empilé mensuel ; liste chronologique filtrée.
 *
 * Tout l'état de l'écran — type, orateurs, journaux, fenêtre de dates, document ciblé —
 * vit dans l'URL (`useSearchParams`, cf. spec §4) : survit au rechargement, partageable,
 * et les deux graphiques peignent **les mêmes documents filtrés** que la liste. Le
 * `?doc=` ancre et surligne la carte visée ; le volet de détail complet arrive en 9.5.
 */
export function SujetPage() {
  const { id = '' } = useParams<{ id: string }>()
  const [params, setParams] = useSearchParams()
  const etatDocuments = useDocumentsDuSujet(id)
  const etatListes = useListesDeFiltres()

  // Hooks avant toute branche : l'ordre ne doit jamais dépendre du résultat du port.
  const listes = useMemo(
    () => (etatListes.ok ? { locuteurs: etatListes.locuteurs, journaux: etatListes.journaux } : undefined),
    [etatListes],
  )
  const filtres = useMemo(() => lireFiltresDepuisURL(params, listes), [params, listes])
  const documentsSujet = useMemo(() => (etatDocuments.ok ? etatDocuments.documents : []), [etatDocuments])
  const miroir = useMemo(() => selectionMiroir(documentsSujet), [documentsSujet])
  const documentsFiltres = useMemo(() => filtrer(documentsSujet, filtres), [documentsSujet, filtres])
  const points = useMemo(() => pointsChronologie(documentsFiltres, id), [documentsFiltres, id])
  const seriesMensuelles = useMemo(() => seriesParMois(documentsFiltres, id), [documentsFiltres, id])
  const phares = useMemo(() => documentsSujet.filter((doc) => doc.highlight === true), [documentsSujet])
  const chambresParLocuteur = useMemo(() => {
    const map = new Map<string, Chambre>()
    for (const doc of documentsSujet)
      if (doc.speaker !== undefined) map.set(doc.speaker.name, doc.speaker.chamber)
    return map
  }, [documentsSujet])

  // Le document ciblé (`?doc=`) s'ancre au centre et se surligne ; jamais de crash si
  // l'id vise un document hors liste (filtré, ou d'un autre sujet).
  useEffect(() => {
    if (filtres.doc === null) return
    const cible = document.getElementById(`document-${filtres.doc}`)
    if (cible !== null && typeof cible.scrollIntoView === 'function')
      cible.scrollIntoView({ block: 'center' })
  }, [filtres.doc])

  /** Un patch de filtre se fusionne avec l'état courant puis se réécrit proprement dans l'URL. */
  function majFiltres(patch: Partial<FiltresSujet>): void {
    setParams((precedents) => appliquerFiltres(precedents, { ...filtres, ...patch }))
  }

  /** Clic (liste ou frise) : pose `?doc=`, ou le retire si le document est déjà ciblé. */
  function basculerDoc(docId: string): void {
    majFiltres({ doc: filtres.doc === docId ? null : docId })
  }

  if (!etatDocuments.ok) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10">
        <h1 className="text-4xl font-bold tracking-tight">Presse & palabre</h1>
        <ErreurCorpus message={etatDocuments.error.message} />
        <Link to="/" className="text-sm text-neutral-600 underline">
          ← Retour à l’accueil
        </Link>
      </main>
    )
  }

  // Le 404 est une décision d'UI, pas de donnée (cf. repository.sujetParId).
  const sujet = etatDocuments.corpus.sujets.find((candidate) => candidate.id === id)
  if (sujet === undefined) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
        <h1 className="text-4xl font-bold tracking-tight">Sujet introuvable</h1>
        <p className="text-neutral-600">
          Aucun sujet du trimestre ne porte l’identifiant « {id} ». Il a peut-être été mal recopié.
        </p>
        <Link to="/" className="text-sm text-neutral-600 underline">
          ← Retour à l’accueil
        </Link>
      </main>
    )
  }

  const { corpus } = etatDocuments
  const compteurs = compteursSujet(documentsFiltres)
  const filtresActifs =
    filtres.type !== 'tout' ||
    filtres.orateurs.length > 0 ||
    filtres.journaux.length > 0 ||
    filtres.du !== '1934-01-01' ||
    filtres.au !== '1934-03-31'

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-10">
      <header className="flex flex-col gap-2">
        <Link to="/" className="text-sm text-neutral-600 underline">
          ← Retour à l’accueil
        </Link>
        <h1 className="text-4xl font-bold tracking-tight">{sujet.label}</h1>
        <p className="text-sm text-neutral-500">
          {compteurs.coupes} coupes de presse · {compteurs.prises} prises de parole au registre du trimestre
          {filtresActifs ? ' (après filtres)' : ''}
        </p>
        {/* Badge de chambre quand le filtre `orateur` est actif (spec 9.4) : chaque locuteur
            retenu porte l'étiquette de la chambre où il est entendu au cours du trimestre. */}
        {filtres.orateurs.length > 0 && (
          <ul aria-label="Locuteurs retenus et leurs chambres" className="flex flex-wrap gap-2">
            {filtres.orateurs.map((orateur) => (
              <li
                key={orateur}
                className="rounded-full border border-neutral-300 bg-white px-2.5 py-0.5 text-xs text-neutral-700"
              >
                {orateur} — {libelleChambre(chambresParLocuteur.get(orateur) ?? 'chambre')}
              </li>
            ))}
          </ul>
        )}
        {sujet.description.split('\n\n').map((paragraphe, index) => (
          <p key={index} className="leading-relaxed text-neutral-800">
            {paragraphe}
          </p>
        ))}
      </header>

      {phares.length > 0 && (
        <section aria-labelledby="phares-titre" className="flex flex-col gap-3">
          <h2 id="phares-titre" className="text-2xl font-semibold tracking-tight">
            Extraits phares
          </h2>
          <ul className="grid gap-4 md:grid-cols-2">
            {phares.map((doc) => (
              <li key={doc.id}>
                <CarteDocument doc={doc} sujets={corpus.sujets} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <Miroir miroir={miroir} sujets={corpus.sujets} />

      <BarreDeFiltres
        filtres={filtres}
        locuteurs={listes?.locuteurs ?? []}
        journaux={listes?.journaux ?? []}
        onChange={majFiltres}
      />

      <Chronologie points={points} documents={documentsFiltres} surDocumentClique={basculerDoc} />

      <BarMois series={seriesMensuelles} />

      <section aria-labelledby="liste-titre" className="flex flex-col gap-3">
        <h2 id="liste-titre" className="text-2xl font-semibold tracking-tight">
          Liste chronologique
        </h2>
        {documentsFiltres.length === 0 ? (
          <p className="text-sm text-neutral-600">Aucun document ne correspond aux filtres actifs.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {documentsFiltres.map((doc: Document1934) => (
              <li key={doc.id}>
                <CarteDocument
                  doc={doc}
                  sujets={corpus.sujets}
                  cible={filtres.doc === doc.id}
                  ancre={`document-${doc.id}`}
                >
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => basculerDoc(doc.id)}
                      className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs text-neutral-700 hover:bg-neutral-100"
                    >
                      {filtres.doc === doc.id ? 'masquer le ciblage' : 'voir le détail'}
                    </button>
                  </div>
                </CarteDocument>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
