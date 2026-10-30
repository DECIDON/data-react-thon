import { PERIODE_1934 } from '@/domain/1934'
import { TYPES_FILTRE, filtresParDefaut, type FiltresSujet, type TypeFiltre } from './filtres'

/**
 * Barre de filtres secondaires de la page sujet (spec §4) : segmented « type », menus
 * déroulants à cases pour orateurs et journaux (alimentés par les listes réelles du
 * corpus), deux champs de date bornés au trimestre et bouton « réinitialiser ».
 * Tout au clavier : le segmented est un groupe de boutons `aria-pressed`, les menus
 * reposent sur `<details>/<summary>` (Ouverture natif au Tab + Entrée, fermeture par
 * Échap gérée ici), les cases à cocher sont des `input` natifs. Le composant est
 * aveugle à l'URL : il reçoit les filtres validés et signale chaque changement.
 */

const LIBELLE_TYPE: Record<TypeFiltre, string> = {
  tout: 'Tout',
  presse: 'Presse',
  parlement: 'Parlement',
}

interface BarreDeFiltresProps {
  readonly filtres: FiltresSujet
  /** Locuteurs distincts du corpus (ordre du port), pour le menu `orateur`. */
  readonly locuteurs: readonly string[]
  /** Journaux distincts du corpus (ordre du port), pour le menu `journal`. */
  readonly journaux: readonly string[]
  /** La page applique le patch et réécrit l'URL (via `appliquerFiltres`). */
  readonly onChange: (patch: Partial<FiltresSujet>) => void
}

/** Menu déroulant à cases : `<details>` natif, utilisable au clavier sans artifice. */
function MenuCases({
  titre,
  options,
  selection,
  surBasculer,
}: {
  titre: string
  options: readonly string[]
  selection: readonly string[]
  surBasculer: (nom: string) => void
}) {
  return (
    <details
      className="relative"
      onKeyDown={(evenement) => {
        if (evenement.key === 'Escape') evenement.currentTarget.open = false
      }}
    >
      <summary className="cursor-pointer rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 select-none hover:border-neutral-500">
        {titre}
        {selection.length > 0 && (
          <span className="ml-1.5 rounded-full bg-neutral-900 px-1.5 py-0.5 text-xs text-neutral-50">
            {selection.length}
          </span>
        )}
      </summary>
      <fieldset className="absolute z-10 mt-1 max-h-56 w-64 overflow-y-auto rounded-md border border-neutral-200 bg-white p-3 shadow-lg">
        <legend className="sr-only">{titre}</legend>
        <ul className="flex flex-col gap-1">
          {options.map((option) => (
            <li key={option}>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-800">
                <input
                  type="checkbox"
                  checked={selection.includes(option)}
                  onChange={() => surBasculer(option)}
                />
                {option}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
    </details>
  )
}

/** Le champ date n'est pas une promesse : on n'écrit que les dates ISO attendues. */
function lisezDate(valeur: string): string | null {
  return /^\d{4}-\d{2}-\d{2}$/.test(valeur) ? valeur : null
}

export function BarreDeFiltres({ filtres, locuteurs, journaux, onChange }: BarreDeFiltresProps) {
  function basculerNom(cle: 'orateurs' | 'journaux', nom: string): void {
    const courant = filtres[cle]
    const suivants = courant.includes(nom) ? courant.filter((n) => n !== nom) : [...courant, nom]
    onChange({ [cle]: suivants })
  }

  return (
    <section aria-labelledby="filtres-titre" className="flex flex-col gap-3">
      <h2 id="filtres-titre" className="text-2xl font-semibold tracking-tight">
        Filtrer
      </h2>
      <div className="flex flex-wrap items-center gap-3">
        <div
          role="group"
          aria-label="Type de document"
          className="flex overflow-hidden rounded-md border border-neutral-300"
        >
          {TYPES_FILTRE.map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={filtres.type === type}
              onClick={() => onChange({ type })}
              className={`px-3 py-1.5 text-sm ${
                filtres.type === type
                  ? 'bg-neutral-900 text-neutral-50'
                  : 'bg-white text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              {LIBELLE_TYPE[type]}
            </button>
          ))}
        </div>
        <MenuCases
          titre="Locuteurs" // Le glossaire fait foi (« locuteur », jamais « orateur ») ; le param d'URL `orateur` reste le contrat de la spec §4.
          options={locuteurs}
          selection={filtres.orateurs}
          surBasculer={(nom) => basculerNom('orateurs', nom)}
        />
        <MenuCases
          titre="Journaux"
          options={journaux}
          selection={filtres.journaux}
          surBasculer={(nom) => basculerNom('journaux', nom)}
        />
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          Du
          <input
            type="date"
            value={filtres.du}
            min={PERIODE_1934.du}
            max={PERIODE_1934.au}
            onChange={(evenement) => {
              const du = lisezDate(evenement.target.value)
              if (du !== null) onChange({ du })
            }}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          Au
          <input
            type="date"
            value={filtres.au}
            min={PERIODE_1934.du}
            max={PERIODE_1934.au}
            onChange={(evenement) => {
              const au = lisezDate(evenement.target.value)
              if (au !== null) onChange({ au })
            }}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1"
          />
        </label>
        <button
          type="button"
          onClick={() =>
            // Réinitialiser = revenir aux défauts **secondaires** ; `?doc=` est une ancre
            // de lecture, pas un filtre : on la préserve (décision 9.4, documentée ici).
            onChange({ ...filtresParDefaut(), doc: filtres.doc })
          }
          className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
        >
          Réinitialiser
        </button>
      </div>
    </section>
  )
}
