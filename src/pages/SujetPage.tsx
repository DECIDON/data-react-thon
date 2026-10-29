import { ErreurCorpus } from '@/components/common/ErreurCorpus'
import { compteursSujet } from '@/components/features/1934/presentation'
import { useDocumentsDuSujet } from '@/hooks/data/useCorpus1934'
import { Link, useParams } from 'react-router'

/**
 * Page sujet — mouture provisoire de l'étape 9.3 : en-tête honnête (label, description,
 * compteurs) pour que les liens des cartes vitrine soient vivants dès aujourd'hui.
 * L'étape 9.4 la remplace par le parcours complet (phares, miroir, frise, filtres).
 */
export function SujetPage() {
  const { id = '' } = useParams<{ id: string }>()
  const etat = useDocumentsDuSujet(id)

  if (!etat.ok) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10">
        <h1 className="text-4xl font-bold tracking-tight">Presse & palabre</h1>
        <ErreurCorpus message={etat.error.message} />
        <Link to="/" className="text-sm text-neutral-600 underline">
          ← Retour à l’accueil
        </Link>
      </main>
    )
  }

  // Le 404 est une décision d'UI, pas de donnée (cf. repository.sujetParId).
  const sujet = etat.corpus.sujets.find((candidate) => candidate.id === id)
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

  const compteurs = compteursSujet(etat.documents)
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <Link to="/" className="text-sm text-neutral-600 underline">
        ← Retour à l’accueil
      </Link>
      <h1 className="mt-4 text-4xl font-bold tracking-tight">{sujet.label}</h1>
      <p className="mt-2 text-sm text-neutral-500">
        {compteurs.coupes} coupes de presse · {compteurs.prises} prises de parole au registre du trimestre
      </p>
      {sujet.description.split('\n\n').map((paragraphe, index) => (
        <p key={index} className="mt-4 leading-relaxed text-neutral-800">
          {paragraphe}
        </p>
      ))}
      <aside className="mt-8 rounded-lg border border-dashed border-neutral-300 bg-white p-4 text-sm text-neutral-600">
        Suite du parcours à l’étape 9.4 : extraits phares, bloc miroir, frise chronologique, bar mensuel et
        filtres dans l’URL.
      </aside>
    </main>
  )
}
