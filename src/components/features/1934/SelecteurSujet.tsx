import type { Sujet } from '@/domain/1934'
import { useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'

/**
 * Sélecteur de sujet (modale du titre) : cliquer le `h1` de la page sujet ouvre cette
 * pop-up, qui propose **une liste déroulante de tous les sujets du registre**. Choisir
 * un sujet navigue vers `/sujet/:id` — c'est donc lui qui apparaît désormais à l'écran.
 *
 * Mêmes conventions que `DocumentDetail` :
 * - `<dialog>` natif modal, ouvert au montage par la page (l'ouverture est un état local
 *   de la page, éphémère par nature : rien à partager ni à recharger) ;
 * - fermé par le bouton « Fermer », Échap ou clic sur le fond, et `onClose` appelé
 *   **au plus une fois** par ouverture (garantie idempotente par ref) ;
 * - `showModal` absent de jsdom 26 : ouverture sous garde, repli sur l'attribut `open`
 *   pour rester testable de bout en bout.
 *
 * Le focus : initial sur la liste déroulante (c'est l'action de la modale) ; rendu au
 * bouton-titre à la fermeture, y compris quand la fermeture est causée par la navigation
 * (le bouton-titre survit au changement de sujet — même page, paramètre d'URL près).
 */

interface SelecteurSujetProps {
  /** Tous les sujets du corpus, dans l'ordre du registre. */
  readonly sujets: readonly Sujet[]
  /** Sujet affiché à l'écran : option sélectionnée par défaut. */
  readonly sujetActif: string
  /** Demandé au plus une fois par ouverture ; la page est seule maîtresse de l'affichage. */
  readonly onClose: () => void
}

export function SelecteurSujet({ sujets, sujetActif, onClose }: SelecteurSujetProps) {
  const navigate = useNavigate()
  const dialogueRef = useRef<HTMLDialogElement>(null)
  const listeRef = useRef<HTMLSelectElement>(null)
  const fermetureSignalee = useRef(false)

  /** Chemin unique de fermeture : guardée, donc idempotente quoi qu'il arrive. */
  const fermer = useCallback((): void => {
    if (fermetureSignalee.current) return
    fermetureSignalee.current = true
    dialogueRef.current?.close?.() // no-op sous jsdom (méthode absente), réel en navigateur.
    onClose()
  }, [onClose])

  useEffect(() => {
    const dialogue = dialogueRef.current
    if (dialogue === null) return
    // StrictMode : ne ouvrir que si pas déjà ouvert (`showModal` lève sinon un InvalidStateError).
    if (!dialogue.open) {
      if (typeof dialogue.showModal === 'function') dialogue.showModal()
      else dialogue.open = true // repli jsdom : pas de modal natif, mais rendu visible et testable.
    }
    listeRef.current?.focus() // focus initial sur la liste déroulante (déterministe, tous moteurs).
    return () => {
      // Retour du focus au bouton-titre (le navigateur le fait à la fermeture d'une modale ;
      // ce filet couvre jsdom, le repli non modal, et la fermeture causée par la navigation).
      const boutonTitre = document.getElementById('bouton-titre-sujet')
      if (boutonTitre !== null && boutonTitre instanceof HTMLElement && boutonTitre.isConnected)
        boutonTitre.focus()
    }
  }, [])

  /** Un choix vaut navigation : c'est le sujet sélectionné qui devient l'écran courant. */
  function choisirSujet(id: string): void {
    if (id === sujetActif) return // le sujet affiché est déjà le bon : rien à faire.
    fermer() // sinon la pop-up resurgirait, ouverte, sur le sujet qu'on vient d'afficher.
    navigate(`/sujet/${id}`)
  }

  return (
    <dialog
      ref={dialogueRef}
      aria-labelledby="selecteur-sujet-titre"
      onClose={fermer} // filet : fermeture native (Échap de l'UA, close() d'origine externe).
      onClick={(evenement) => {
        // Clic sur le fond : la zone « backdrop » est portée par le dialog lui-même.
        if (evenement.target === dialogueRef.current) fermer()
      }}
      onKeyDown={(evenement) => {
        if (evenement.key !== 'Escape') return
        evenement.preventDefault() // on prend la fermeture en main ; l'UA ne rejouera pas la sienne.
        fermer()
      }}
      className="m-auto w-full max-w-md rounded-lg border border-neutral-300 bg-white p-0 shadow-xl backdrop:bg-neutral-900/50"
    >
      <form className="flex flex-col gap-3 p-6" onSubmit={(evenement) => evenement.preventDefault()}>
        <div className="flex items-start justify-between gap-4">
          <h2 id="selecteur-sujet-titre" className="text-2xl font-semibold tracking-tight">
            Changer de sujet
          </h2>
          <button
            type="button"
            onClick={fermer}
            className="shrink-0 rounded-md border border-neutral-300 bg-white px-3 py-1 text-sm text-neutral-700 hover:bg-neutral-100"
          >
            Fermer
          </button>
        </div>
        <label htmlFor="selecteur-sujet-liste" className="text-sm text-neutral-600">
          Tous les sujets du registre
        </label>
        <select
          id="selecteur-sujet-liste"
          ref={listeRef}
          defaultValue={sujetActif}
          onChange={(evenement) => choisirSujet(evenement.currentTarget.value)}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800"
        >
          {sujets.map((sujet) => (
            <option key={sujet.id} value={sujet.id}>
              {sujet.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-neutral-500">
          Sélectionner un sujet ouvre sa page ; la sélection en cours est effacée au retour.
        </p>
      </form>
    </dialog>
  )
}
