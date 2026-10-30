import { ErreurCorpus } from '@/components/common/ErreurCorpus'
import { BarMois } from '@/components/features/1934/BarMois'
import { BarreDeFiltres } from '@/components/features/1934/BarreDeFiltres'
import { CarteDocument } from '@/components/features/1934/CarteDocument'
import { Chronologie } from '@/components/features/1934/Chronologie'
import { DocumentDetail } from '@/components/features/1934/DocumentDetail'
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
import { useDocument1934, useDocumentsDuSujet, useListesDeFiltres } from '@/hooks/data/useCorpus1934'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'

/**
 * Page sujet (spec §4.2, mouture complète de l'étape 9.4). Dans l'ordre imposé par la
 * spec : en-tête (label, description, compteurs, badge de chambre si orateur filtré) ;
 * extraits **phares** ; **miroir** presse/parlement ; filtres secondaires ; frise
 * `scatter` cliquable ; bar empilé mensuel ; liste chronologique filtrée.
 *
 * Tout l'état de l'écran — type, orateurs, journaux, fenêtre de dates, document ciblé —
 * vit dans l'URL (`useSearchParams`, cf. spec §4) : survit au rechargement, partageable,
 * et les deux graphiques peignent **les mêmes documents filtrés** que la liste.
 *
 * Le `?doc=` d'aujourd'hui (9.5) : il **ouvre le détail en modale** (`DocumentDetail`,
 * résolu sur le corpus entier) **et** ancre/surligne la carte derrière — à la fermeture,
 * l'utilisateur retrouve sa liste à sa place. Un `?doc=` qui ne résout rien dans le corpus
 * est nettoyé de l'URL avec un message discret (choix acté : jamais de crash, jamais
 * d'indifférence silencieuse — cf. l'esprit « erreur affichée » de la spec §2, appliqué
 * aux entrants d'URL).
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

  // Le document demandé par l'URL, **brut** (regex non filtrée) : c'est ce texte que recopie
  // le message « introuvable », et c'est lui qu'on nettoie si rien ne résout derrière.
  const idDemande = params.get('doc')
  const etatDocumentCible = useDocument1934(idDemande)
  const documentCible = etatDocumentCible.ok ? etatDocumentCible.document : undefined
  // Notification ponctuelle, assumée en état local : elle n'existe QUE parce que l'URL a
  // perdu le param (source de vérité) ; ni persistée, ni partageable, ni doublon d'état
  // (cf. `state.md`, ligne « Détail d'un document »).
  const [docIntrouvable, setDocIntrouvable] = useState<string | null>(null)

  // Le document ciblé (`?doc=`) s'ancre au centre et se surligne ; jamais de crash si
  // l'id vise un document hors liste (filtré, ou d'un autre sujet). La carte reste ancrée
  // derrière la modale de détail : à la fermeture, l'utilisateur retrouve sa place.
  useEffect(() => {
    if (filtres.doc === null) return
    const cible = document.getElementById(`document-${filtres.doc}`)
    if (cible !== null && typeof cible.scrollIntoView === 'function')
      cible.scrollIntoView({ block: 'center' })
  }, [filtres.doc])

  /** Un patch de filtre se fusionne avec l'état courant puis se réécrit proprement dans l'URL. */
  const majFiltres = useCallback(
    (patch: Partial<FiltresSujet>): void => {
      setParams((precedents) => appliquerFiltres(precedents, { ...filtres, ...patch }))
    },
    [filtres, setParams],
  )

  // `?doc=` mal formé ou id inconnu du corpus : on nettoie l'URL (le détail ne peut pas
  // s'ouvrir sur du vent) et on laisse une trace discrète mais explicite — pas de crash,
  // pas d'indifférence silencieuse (choix commenté dans l'en-tête du composant).
  useEffect(() => {
    if (idDemande === null) return
    if (documentCible !== undefined) {
      setDocIntrouvable(null) // réouverture réussie : la notification précédente n'a plus de sens.
      return
    }
    setDocIntrouvable(idDemande)
    majFiltres({ doc: null })
  }, [idDemande, documentCible, majFiltres])

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

      {docIntrouvable !== null && (
        <p
          role="status"
          className="-mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
        >
          Document introuvable : « {docIntrouvable} » ne figure pas au corpus du trimestre. L’adresse a été
          nettoyée, les filtres sont intacts.
        </p>
      )}

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

      {/* Détail (9.5, spec §4.3) : la modale n'existe que parce que l'URL porte `?doc=` ;
          sa fermeture passe par `majFiltres`, donc par l'URL — jamais par un état doublon. */}
      {documentCible !== undefined && (
        <DocumentDetail
          key={documentCible.id}
          doc={documentCible}
          sujets={corpus.sujets}
          onClose={() => majFiltres({ doc: null })}
        />
      )}
    </main>
  )
}
