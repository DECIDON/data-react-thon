import type { Document1934, Sujet, SujetId } from '@/domain/1934'
import { Document1934Schema, SujetSchema, comparerParDate, estCoupeDePresse } from '@/domain/1934'
import { DataError } from '@/platform/errors/base'
import type { FunctionResult } from '@/platform/result'
import { err, ok } from '@/platform/result'
import coupesJson from './press.json'
import prisesJson from './statements.json'
import sujetsJson from './topics.json'

/**
 * Port repository du corpus fictif « presse & palabre » (spec §2, ADR C-008) :
 * seule couche qui importe les JSON (C-003). Le corpus est **commissionné, figé, en lecture
 * seule** — il se charge une fois au premier appel (mémoïsation au module), se valide d'un
 * parse strict (une donnée invalide est une erreur remontée, jamais un document ignoré),
 * et se renvoie gelé : personne ne peut corrompre la source de vérité.
 */

/** Les trois fichiers sources, sous leur forme brute (avant parse). */
export interface CorpusBrut {
  readonly sujets: unknown
  readonly prises: unknown
  readonly coupes: unknown
}

/**
 * Corpus en mémoire tel que servi aux hooks : tableaux gelés. L'alias `Corpus1934` ancre le
 * nom métier ; la structure est celle du contrat (`Corpus` de `domain/1934`).
 */
export interface Corpus1934 {
  readonly sujets: readonly Sujet[]
  readonly documents: readonly Document1934[]
}

/**
 * Parse strict liste à liste (chaque fichier est un tableau, pas un `CorpusSchema` enveloppé) :
 * l'erreur nomme le fichier fautif. Exporté pour les tests du chemin d'échec — `chargerCorpus`
 * n'est jamais en défaut sur le corpus du dépôt, il fallait bien une porte d'entrée du « et si ? ».
 */
export function validerCorpusBrut(brut: CorpusBrut): FunctionResult<Corpus1934, DataError> {
  try {
    const sujets = SujetSchema.array().parse(brut.sujets)
    const prises = Document1934Schema.array().parse(brut.prises)
    const coupes = Document1934Schema.array().parse(brut.coupes)
    const documents = Object.freeze([...prises, ...coupes].sort(comparerParDate))
    return ok(Object.freeze({ sujets: Object.freeze(sujets), documents }))
  } catch (cause) {
    return err(
      new DataError('Corpus 1934 invalide : un des trois JSON ne respecte pas le contrat.', {
        cause,
        context: { fichiers: ['topics.json', 'statements.json', 'press.json'] },
      }),
    )
  }
}

let memoire: FunctionResult<Corpus1934, DataError> | undefined

/**
 * Charge (une seule fois) le corpus commissionné sous `src/data/1934/`. Monnaie d'échange :
 * `FunctionResult` — pas d'exception vers l'UI (D-002). Mémoïsé au module : deux appels
 * renvoient la même référence, aucun cache à ajouter au-dessus.
 */
export function chargerCorpus(): FunctionResult<Corpus1934, DataError> {
  memoire ??= validerCorpusBrut({
    sujets: sujetsJson,
    prises: prisesJson,
    coupes: coupesJson,
  })
  return memoire
}

/** Le sujet d'identifiant donné, `undefined` si inconnu (le 404 est une décision d'UI, pas de donnée). */
export function sujetParId(corpus: Corpus1934, id: string): Sujet | undefined {
  return corpus.sujets.find((sujet) => sujet.id === id)
}

/**
 * Document d'identifiant donné, `undefined` si inconnu — résolution sur le corpus **entier**,
 * pas restreinte au sujet courant (un lien profond `?doc=` doit ouvrir le détail quel que
 * soit l'écran où il atterrit, spec §4.3). Comme pour `sujetParId`, le « introuvable » est
 * une décision d'UI (message discret + nettoyage d'URL), pas une erreur de donnée.
 */
export function documentParId(corpus: Corpus1934, id: string): Document1934 | undefined {
  return corpus.documents.find((doc) => doc.id === id)
}

/** Documents rattachés au sujet (file de jointure, CONTEXT.md), dans l'ordre chronologique. */
export function documentsParSujet(corpus: Corpus1934, id: SujetId | string): Document1934[] {
  return corpus.documents
    .filter((doc) => doc.subjects.some((association) => association.topicId === id))
    .slice()
    .sort(comparerParDate)
}

/**
 * Noms distincts de journaux, triés (alimentation du filtre `journal`, spec §4).
 * Le corpus commissionne `source.title` sous la forme « nom du journal — édition du … » :
 * le journal est ce qui précède le tiret long, à défaut le titre entier (règle d'adaptateur,
 * propre aux fichiers JSON — pas une loi du domaine).
 */
export function journaux(corpus: Corpus1934): string[] {
  const noms = new Set<string>()
  for (const doc of corpus.documents) {
    if (!estCoupeDePresse(doc)) continue
    const nom = doc.source.title.split(' — ')[0]?.trim()
    noms.add(nom || doc.source.title) // titre sans tiret (ou vide avant le tiret) : titre entier.
  }
  return [...noms].sort((a, b) => a.localeCompare(b, 'fr'))
}

/** Noms distincts de locuteurs, triés (alimentation du filtre `orateur`, spec §4). */
export function locuteurs(corpus: Corpus1934): string[] {
  const noms = new Set<string>()
  for (const doc of corpus.documents) {
    if (doc.speaker !== undefined) noms.add(doc.speaker.name)
  }
  return [...noms].sort((a, b) => a.localeCompare(b, 'fr'))
}
