import { ErreurCorpus } from '@/components/common/ErreurCorpus'
import { Calendrier1934 } from '@/components/features/1934/Calendrier1934'
import { DocumentsDuJour } from '@/components/features/1934/DocumentsDuJour'
import { SujetsVitrine } from '@/components/features/1934/SujetsVitrine'
import { jourSelectionne } from '@/components/features/1934/calendrier'
import { joursCorpus } from '@/domain/1934'
import { useCorpus1934 } from '@/hooks/data/useCorpus1934'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router'

/**
 * Accueil du prototype « presse & palabre » (spec §4.1) : calendrier du trimestre,
 * panneau du jour cliqué, vitrine des sujets. Le seul état de l'écran — le jour retenu —
 * vit dans l'URL (`?jour=YYYY-MM-DD`, cf. `state.md`) : survit au rechargement, partageable.
 */
export function HomePage() {
  const etat = useCorpus1934()
  const [params, setParams] = useSearchParams()

  // Hooks avant toute branche : l'ordre ne doit jamais dépendre du résultat du port.
  const jours = useMemo(() => (etat.ok ? joursCorpus(etat.corpus.documents) : []), [etat])
  const jour = jourSelectionne(params.get('jour'))

  /** Clic sur le jour déjà retenu = le libère (un seul paramètre, semantics de bascule). */
  function basculerJour(jourClique: string): void {
    setParams((precedents) => {
      const suivants = new URLSearchParams(precedents)
      if (precedents.get('jour') === jourClique) suivants.delete('jour')
      else suivants.set('jour', jourClique)
      return suivants
    })
  }

  if (!etat.ok) {
    // Branche d'échec assumée (spec §2) : titre sobre + message du port, pas de crash.
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <h1 className="text-4xl font-bold tracking-tight">Presse & palabre</h1>
        <ErreurCorpus message={etat.error.message} />
      </main>
    )
  }

  const { corpus } = etat
  const documentsDuJour = jour === null ? [] : corpus.documents.filter((documente) => documente.date === jour)

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold tracking-tight">Presse & palabre</h1>
        <p className="max-w-2xl text-neutral-600">
          Prototype de parcours juré sur le premier trimestre 1934 : la presse imprimée et les prises de
          parole de la Chambre et du Sénat, croisées par sujets.
        </p>
      </header>
      <Calendrier1934 jours={jours} jourSelectionne={jour} surJourClique={basculerJour} />
      {jour !== null && <DocumentsDuJour jour={jour} documents={documentsDuJour} sujets={corpus.sujets} />}
      <SujetsVitrine sujets={corpus.sujets} documents={corpus.documents} />
    </main>
  )
}
