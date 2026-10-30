import type { Corpus1934 } from '@/data/1934/repository'
import {
  chargerCorpus,
  documentParId,
  documentsParSujet,
  journaux,
  locuteurs,
  sujetParId,
} from '@/data/1934/repository'
import type { Document1934, Sujet } from '@/domain/1934'
import type { DataError } from '@/platform/errors/base'
import { useMemo } from 'react'

/**
 * Hooks de lecture du corpus 1934 (spec §6) : façade au-dessus du port repository,
 * lecture seule et sans état. Pas de Zustand (l'état UI vivra dans l'URL, cf. `state.md`),
 * pas de cache maison : la mémoïsation est dans `chargerCorpus()` et `useMemo` fige la
 * référence par montage. La monnaie d'échange reste `ok / error` — jamais de throw vers l'UI.
 */

/** Branche d'échec commune : l'appelant affiche l'erreur, il ne l'interprète pas. */
export interface Corpus1934EnErreur {
  readonly ok: false
  readonly error: DataError
}

/** État du corpus pour l'UI : corpus chargé (gelé), ou erreur typée à afficher. */
export type EtatCorpus1934 = { readonly ok: true; readonly corpus: Corpus1934 } | Corpus1934EnErreur

/** Corpus + sujet demandé (`sujet` absent si inconnu : le rendu 404 est une décision d'UI). */
export type EtatSujet1934 =
  { readonly ok: true; readonly corpus: Corpus1934; readonly sujet?: Sujet } | Corpus1934EnErreur

/** Corpus + documents du sujet, dans l'ordre chronologique (liste et agrégats de la page sujet). */
export type EtatDocuments1934 =
  { readonly ok: true; readonly corpus: Corpus1934; readonly documents: Document1934[] } | Corpus1934EnErreur

/** Corpus + listes distinctes triées des filtres secondaires `journal` / `orateur` (spec §4). */
export type EtatFiltres1934 =
  | {
      readonly ok: true
      readonly corpus: Corpus1934
      readonly journaux: readonly string[]
      readonly locuteurs: readonly string[]
    }
  | Corpus1934EnErreur

/** Corpus + document ciblé par `?doc=` (`document` absent si inconnu : le message « introuvable » est une décision d'UI). */
export type EtatDocument1934 =
  { readonly ok: true; readonly corpus: Corpus1934; readonly document?: Document1934 } | Corpus1934EnErreur

/** Corpus complet (sujets + documents triés par date), chargé une fois au premier appel. */
export function useCorpus1934(): EtatCorpus1934 {
  return useMemo(() => {
    const resultat = chargerCorpus()
    return resultat.ok
      ? { ok: true as const, corpus: resultat.value }
      : { ok: false as const, error: resultat.error }
  }, [])
}

/** Le sujet d'identifiant donné, dérivé du corpus (sélecteur pur du port, encapsulé ici). */
export function useSujet1934(id: string): EtatSujet1934 {
  const etat = useCorpus1934()
  return useMemo(() => (etat.ok ? { ...etat, sujet: sujetParId(etat.corpus, id) } : etat), [etat, id])
}

/** Le document d'identifiant donné (`?doc=` de la page sujet), dérivé du corpus entier. */
export function useDocument1934(id: string | null): EtatDocument1934 {
  const etat = useCorpus1934()
  return useMemo(
    () => (etat.ok ? { ...etat, document: id === null ? undefined : documentParId(etat.corpus, id) } : etat),
    [etat, id],
  )
}

/** Documents rattachés à un sujet (jointure par `topicId`), triés par date puis id. */
export function useDocumentsDuSujet(id: string): EtatDocuments1934 {
  const etat = useCorpus1934()
  return useMemo(
    () => (etat.ok ? { ...etat, documents: documentsParSujet(etat.corpus, id) } : etat),
    [etat, id],
  )
}

/** Listes distinctes triées pour alimenter les filtres secondaires de la page sujet. */
export function useListesDeFiltres(): EtatFiltres1934 {
  const etat = useCorpus1934()
  return useMemo(
    () => (etat.ok ? { ...etat, journaux: journaux(etat.corpus), locuteurs: locuteurs(etat.corpus) } : etat),
    [etat],
  )
}
