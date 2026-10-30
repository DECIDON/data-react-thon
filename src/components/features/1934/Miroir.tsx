import type { Document1934, Miroir, Sujet } from '@/domain/1934'
import { CarteDocument } from './CarteDocument'

/**
 * Bloc miroir d'une page de sujet (spec §4.2, CONTEXT.md) : le phare presse et le phare
 * parlement du même sujet, **en regard** — presse à gauche, parlement à droite, empilés
 * sur mobile. Le composant est aveugle : il reçoit le `Miroir` déjà sélectionné par
 * `selectionMiroir` (domaine) et se contente de rendre chaque moitié, ou le message
 * explicite quand un couloir est vide. Le glossaire interdit « face-à-face ».
 *
 * Raccord 9.6 : chaque moitié offre un bouton « voir le détail » (même porte d'entrée que
 * la liste filtrée) qui remonte l'id du document — c'est la page qui pose `?doc=`, jamais
 * le composant. Sans callback, le bloc reste purement display : aucune porte d'entrée.
 */

interface MiroirProps {
  readonly miroir: Miroir
  readonly sujets: readonly Sujet[]
  /** Clic sur « voir le détail » d'une moitié : la page pose `?doc=` (spéc. §4.3). */
  readonly surVoirDetail?: (docId: string) => void
}

/** Une moitié du miroir : titre de couloir, carte (ou message si le couloir est vide). */
function Moitie({
  titre,
  document,
  sujets,
  surVoirDetail,
}: {
  titre: string
  document?: Document1934
  sujets: readonly Sujet[]
  surVoirDetail?: (docId: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold tracking-wide text-neutral-500 uppercase">{titre}</h3>
      {document === undefined ? (
        <p className="rounded-lg border border-dashed border-neutral-300 bg-white p-4 text-sm text-neutral-600">
          Aucun document de ce côté — le miroir reste unilatéral pour ce sujet.
        </p>
      ) : (
        <CarteDocument doc={document} sujets={sujets}>
          {surVoirDetail !== undefined && (
            <div className="mt-3 flex justify-end">
              {/* Même pied de carte que la liste filtrée : le juré a la même porte partout. */}
              <button
                type="button"
                onClick={() => surVoirDetail(document.id)}
                className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs text-neutral-700 hover:bg-neutral-100"
              >
                voir le détail
              </button>
            </div>
          )}
        </CarteDocument>
      )}
    </div>
  )
}

export function Miroir({ miroir, sujets, surVoirDetail }: MiroirProps) {
  return (
    <section aria-labelledby="miroir-titre" className="flex flex-col gap-3">
      <h2 id="miroir-titre" className="text-2xl font-semibold tracking-tight">
        Miroir du sujet
      </h2>
      {/* Presse à gauche, parlement à droite ; une colonne empilée sur mobile (spec §4.2). */}
      <div className="grid gap-6 md:grid-cols-2">
        <Moitie
          titre="Dans la presse"
          document={miroir.presse}
          sujets={sujets}
          surVoirDetail={surVoirDetail}
        />
        <Moitie
          titre="Au parlement"
          document={miroir.parlement}
          sujets={sujets}
          surVoirDetail={surVoirDetail}
        />
      </div>
    </section>
  )
}
