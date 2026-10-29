import { z } from 'zod'

/**
 * Contrat de données « presse & palabre » (spec §2, ADR C-007/C-008).
 * Source de vérité du format : les JSON de `src/data/1934/` sont validés contre ces
 * schémas `.strict()` — une donnée invalide est une erreur, jamais un document ignoré.
 * Module pur : Zod seul est autorisé ici (aucun framework, ARCHITECTURE.md §3).
 */

/** Identifiant de sujet, kebab-case (ex. `desarmement`). */
export const SujetIdSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'SujetId attendu en kebab-case (ex. « desarmement »).')
export type SujetId = z.infer<typeof SujetIdSchema>

/** Attitude d'un document vis-à-vis d'UN sujet (CONTEXT.md § Domaine). */
export const PolariteSchema = z.enum(['positif', 'neutre', 'negatif'])
export type Polarite = z.infer<typeof PolariteSchema>

/** Chambre fictive où s'exprime le locuteur. */
export const ChambreSchema = z.enum(['chambre', 'senat'])
export type Chambre = z.infer<typeof ChambreSchema>

/** Locuteur d'une prise de parole (jamais de personne réelle, ADR C-008). */
export const LocuteurSchema = z
  .object({
    name: z.string().min(1),
    chamber: ChambreSchema,
  })
  .strict()
export type Locuteur = z.infer<typeof LocuteurSchema>

/** Sujet d'actualité du trimestre (vitrine = carte sur l'accueil). */
export const SujetSchema = z
  .object({
    id: SujetIdSchema,
    label: z.string().min(1),
    featured: z.boolean(),
    teaser: z.string().min(1),
    description: z.string().min(1),
  })
  .strict()
export type Sujet = z.infer<typeof SujetSchema>

/** Rattachement d'un document à un sujet, avec la polarité portée par ce couple. */
export const SujetPolariteSchema = z
  .object({
    topicId: SujetIdSchema,
    polarity: PolariteSchema,
  })
  .strict()
export type SujetPolarite = z.infer<typeof SujetPolariteSchema>

/**
 * Document unique du corpus : avec `speaker`, une **prise de parole** ; sans, une
 * **coupe de presse**. `source.url` est l'URL de l'archive fictive (null pour un
 * compte rendu de séance, qui n'a pas d'adresse publique au prototype).
 */
export const Document1934Schema = z
  .object({
    id: z
      .string()
      .regex(/^(?:pd|cp)-\d{3}$/, 'Id de document attendu sous la forme « pd-001 » / « cp-001 ».'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format ISO « YYYY-MM-DD ».'),
    source: z
      .object({
        title: z.string().min(1),
        url: z.string().nullable(),
      })
      .strict(),
    content: z.string().min(1),
    speaker: LocuteurSchema.optional(),
    subjects: z.array(SujetPolariteSchema).min(1),
    highlight: z.boolean().optional(),
  })
  .strict()
export type Document1934 = z.infer<typeof Document1934Schema>

/** Le corpus complet, tel que chargé par le port repository. */
export const CorpusSchema = z
  .object({
    sujets: z.array(SujetSchema),
    documents: z.array(Document1934Schema),
  })
  .strict()
export type Corpus = z.infer<typeof CorpusSchema>
