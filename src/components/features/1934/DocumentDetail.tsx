import type { Document1934, Sujet } from '@/domain/1934'
import { estPriseDeParole } from '@/domain/1934'
import { useEffect, useRef } from 'react'
import { LIBELLE_TYPE, PucesPolarite } from './CarteDocument'
import { formatDateLongue, libelleChambre } from './presentation'

/**
 * Détail d'un document (spec §4.3, étape 9.5) : **`<dialog>` natif modal**, ouvert par la
 * page quand `?doc=` vise un document du corpus, fermé par bouton, Échap ou clic sur le
 * fond. L'URL reste la source de vérité de l'ouverture (cf. `state.md`) : ce composant
 * n'a aucun état d'ouverture — il signale sa fermeture (`onClose`, appelé **au plus une
 * fois**) et c'est la page qui retire le paramètre, donc le composant.
 *
 * Contenu : étiquette Prise de parole / Coupe de presse, date longue, source (lien
 * hypertexte quand `source.url` existe), locuteur + chambre le cas échéant, extrait
 * **intégral** (la troncature est propre aux listes), puces de polarité **par sujet**
 * — tous les sujets du document, pas seulement celui de l'écran (glossaire : la
 * polarité est attachée au couple document×sujet).
 *
 * Décisions rendues nécessaires par le harnais :
 * - `showModal` n'est pas implémenté par jsdom 26 : on l'appelle sous garde, et sans lui
 *   on ouvre par l'attribut `open` (repli non modal). En navigateur réel la modale est
 *   bien modale (piège le focus, rend le fond inertant, bloque le fond) ; en jsdom le
 *   composant reste testable de bout en bout.
 * - La fermeture native (Échap du navigateur, `close()`) passe par l'événement `close` du
 *   dialog ; nos handlers Échap/bouton/fond appellent le même `fermer()` idempotent, donc
 *   quel que soit le chemin (y compris double déclenchement UA + handler) `onClose` part
 *   une seule fois.
 */

interface DocumentDetailProps {
  readonly doc: Document1934
  /** Pour traduire les `topicId` des puces en libellés de sujets. */
  readonly sujets: readonly Sujet[]
  /** Demandé au plus une fois par ouverture ; la page retire `?doc=` (jamais d'état doublon). */
  readonly onClose: () => void
}

export function DocumentDetail({ doc, sujets, onClose }: DocumentDetailProps) {
  const dialogueRef = useRef<HTMLDialogElement>(null)
  const boutonFermerRef = useRef<HTMLButtonElement>(null)
  const fermetureSignalee = useRef(false)

  /** Chemin unique de fermeture : guardée, donc idempotente quoi qu'il arrive. */
  function fermer(): void {
    if (fermetureSignalee.current) return
    fermetureSignalee.current = true
    dialogueRef.current?.close?.() // no-op sous jsdom (méthode absente), réel en navigateur.
    onClose()
  }

  useEffect(() => {
    const dialogue = dialogueRef.current
    if (dialogue === null) return
    const declencheur = document.activeElement
    // StrictMode (double invocation des effets en dev) : ne ouvrir que si pas déjà ouvert,
    // `showModal` lève sinon un InvalidStateError sur un dialog ouvert.
    if (!dialogue.open) {
      if (typeof dialogue.showModal === 'function') dialogue.showModal()
      else dialogue.open = true // repli jsdom : pas de modal natif, mais rendu visible et testable.
    }
    boutonFermerRef.current?.focus() // focus initial sur « Fermer » (déterministe, tous moteurs).
    return () => {
      // Retour du focus au déclencheur (le navigateur le fait à la fermeture d'une modale ;
      // ce filet couvre jsdom et le cas où le déclencheur a disparu entre-temps — filtre
      // modifié, liste re-rendue) : on rend alors la carte ancrée `document-<id>` atteignable.
      const resteEnPlace =
        declencheur instanceof HTMLElement && declencheur !== document.body && declencheur.isConnected
      const cible = resteEnPlace ? declencheur : document.getElementById(`document-${doc.id}`)
      if (cible !== null && cible instanceof HTMLElement && cible.isConnected) cible.focus()
    }
  }, [doc.id])

  const couloir = estPriseDeParole(doc) ? 'parlement' : 'presse'
  return (
    <dialog
      ref={dialogueRef}
      aria-labelledby="detail-titre"
      onClose={fermer} // filet : fermeture native (Échap de l'UA, close() d'origine externe).
      onClick={(evenement) => {
        // Clic sur le fond : la zone « backdrop » est portée par le dialog lui-même ;
        // tout clic dans le contenu a une cible descendante et ne ferme pas.
        if (evenement.target === dialogueRef.current) fermer()
      }}
      onKeyDown={(evenement) => {
        if (evenement.key !== 'Escape') return
        evenement.preventDefault() // on prend la fermeture en main ; l'UA ne rejouera pas la sienne.
        fermer()
      }}
      className="m-auto w-full max-w-xl rounded-lg border border-neutral-300 bg-white p-0 shadow-xl backdrop:bg-neutral-900/50"
    >
      <div className="flex flex-col gap-3 p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id="detail-titre" className="text-2xl font-semibold tracking-tight">
            {LIBELLE_TYPE[couloir]}
          </h2>
          <button
            ref={boutonFermerRef}
            type="button"
            onClick={fermer}
            className="shrink-0 rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm text-neutral-700 hover:bg-neutral-100"
          >
            Fermer
          </button>
        </div>
        <p className="text-sm text-neutral-500">{formatDateLongue(doc.date)}</p>
        <p className="text-sm text-neutral-600">
          {doc.source.url === null ? (
            doc.source.title
          ) : (
            <a
              href={doc.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-neutral-400 underline-offset-2 hover:text-neutral-800"
            >
              {doc.source.title}
            </a>
          )}
        </p>
        {doc.speaker !== undefined && (
          <p className="text-sm text-neutral-700">
            {doc.speaker.name} — {libelleChambre(doc.speaker.chamber)}
          </p>
        )}
        {/* Extrait intégral, sans troncature : c'est la raison d'être du détail (spec §4.3). */}
        <p className="leading-relaxed text-neutral-800">{doc.content}</p>
        <PucesPolarite doc={doc} sujets={sujets} />
      </div>
    </dialog>
  )
}
