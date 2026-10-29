# SPEC — « Presse & palabre » (Q1 1934)

Spec contractuelle de la tranche R9 (voir `roadmap.md` : une étape = une session, la précédente mergée et
`npm run verify` vert). Issue d'une session de design validée point par point ; les décisions sont actées en
ADR C-007 (domaine), C-008 (corpus fictif, lecture seule, Zod), C-009 (Nivo). Le vocabulaire fait foi dans
`CONTEXT.md` § Domaine.

## 1. Cadre

- Prototype **lecture seule**, aucun réseau en production (Pages statique, C-005/C-008).
- Période **figée** : 1934-01-01 → 1934-03-31. Corpus **fictif** affiché comme tel (bandeau discret
  « Prototype — données fictives » pied de page de tous les écrans).
- Audience : jurés grand public. Parcours : accueil éditorialisé → page sujet → détail. Recherche plein
  texte en second plan (une barre, optionnelle, sans indice).
- Point d'entrée : **le sujet**. Acteur (locuteur/journal) et temps : filtres secondaires.

## 2. Contrat de données

Fichiers JSON commissionnés, chargés au build (import direct), validés Zod (`.strict()`) une fois au
démarrage derrière le port repository — une donnée invalide est une erreur affichée, jamais un document
silencieusement ignoré.

Fichiers : `src/data/1934/topics.json`, `src/data/1934/statements.json`, `src/data/1934/press.json`.

```ts
// domain/1934/ — types + schémas Zod (source de vérité du contrat)
type SujetId = string // kebab-case, ex. 'desarmement'
type Polarite = 'positif' | 'neutre' | 'negatif'

type Sujet = {
  id: SujetId
  label: string // ex. 'Le désarmement'
  featured: boolean // vitrine : carte sur l'accueil
  teaser: string // une phrase, accroche de la carte
  description: string // 2 paragraphes, contexte pour le juré
}

type Document1934 = {
  id: string // unique, ex. 'pd-014' (prise de parole) / 'cp-071' (coupe)
  date: string // ISO 'YYYY-MM-DD', dans Q1 1934
  source: { title: string; url: string | null } // journal ou compte rendu de séance
  content: string // extrait, 1 à 3 phrases
  speaker?: { name: string; chamber: 'chambre' | 'senat' } // présent ⇒ prise de parole
  subjects: Array<{ topicId: SujetId; polarity: Polarite }> // 1..n, polarité PAR sujet
  highlight?: boolean // phare du sujet
}
```

Un `Document1934` avec `speaker` est une **prise de parole** ; sans, une **coupe de presse**. Un même
document peut porter plusieurs sujets avec des polarités différentes ; il est compté une fois par sujet.

## 3. Corpus fictif (règles de commissionnement)

- Monde inventé à saveur 1934 : **jamais** de paroles fabriquées attribuées à des personnes, journaux ou
  chambres réels. Noms à franciser plausible (« M. Aurélien Duscher », « Le Torchon lorrain »).
- **6 sujets**, dont **3 `featured`** — sujets « d'actualité » plausibles du trimestre (désarmement,
  foire aux valeurs, répression des ligues… transposés fictifs).
- **~40 prises de parole**, **~60 coupes** ; **5–6 journaux** et **~8 locuteurs** (répartis chambre/sénat)
  pour que les filtres aient de la matière.
- Dates réparties sur tout le trimestre (pas de trou > 2 semaines).
- Pour **chaque** sujet : au moins une paire presse/prise de parole en **polarités opposées** et un phare
  presse + un phare parlement (`highlight: true`).
- Contenus : extraits de 1–3 phrases, style compte rendu / entrefilet selon le type.

## 4. Écrans

Routes (ajoutées au registre d'`App.tsx`, basename déjà géré) :

1. **`/` — Accueil.** Bandeau calendrier `@nivo/calendar` 1934-01-01→1934-03-31 (intensité = nb de
   documents du jour ; légende presse/parlement si le calendrier le permet, sinon couleur unique +
   précision ailleurs) ; clic sur un jour → liste des documents de ce jour (panneau sous le calendrier).
   Sous le calendrier : cartes des sujets `featured` (label, teaser, compteurs coupes/prises) → `/sujet/:id`.
   Cartes non-featured en liste discrète.
2. **`/sujet/:id` — Page sujet.** Dans cet ordre : en-tête (label, description, compteurs) ; extraits
   **phares** en tête ; **bloc miroir** (phare presse vs phare parlement du même sujet, polarités en
   regard, badges rouge/gris/vert) ; filtres secondaires ; frise `@nivo/scatter` (X = date, Y = deux
   couloirs « Presse » / « Parlement », couleur = polarité) ; bandeau `@nivo/bar` empilé
   mois × polarité ; liste chronologique des documents filtrés.
3. **`/sujet/:id?doc=<id>` — Détail.** Volet (dialog ou panneau) : extrait complet, source (title, url si
   présente), date, locuteur le cas échéant, puces de polarité par sujet. URL partageable.

### Filtres (état dans l'URL, `useSearchParams`)

| Param      | Valeurs                             | Défaut              | Effet                       |
| ---------- | ----------------------------------- | ------------------- | --------------------------- |
| `sujet`    | (via chemin `/sujet/:id`)           | —                   | —                           |
| `type`     | `tout\|presse\|parlement`           | `tout`              | couloirs scatter + liste    |
| `orateur`  | nom de locuteur, multi (`=` répété) | —                   | liste + scatter             |
| `journal`  | nom de journal, multi               | —                   | liste + scatter             |
| `du`, `au` | date ISO                            | bornes du trimestre | fenêtrage scatter/bar/liste |
| `doc`      | id de document                      | —                   | ouvre le détail             |

Tous les filtres survivent au rechargement et sont partageables ; les graphiques réagissent aux filtres.

## 5. Graphiques (Nivo 0.99, ADR C-009)

- Paquets : `@nivo/calendar`, `@nivo/scatter`, `@nivo/bar` (+ pairs transitifs). Thème clair commun défini
  une fois (`platform` ou `components/ui/chartTheme.ts`), aligné sur la palette Tailwind de l'app.
- Conteneurs responsives (`ResponsiveContainer`/`useResponsiveCanvas` selon paquets), infobulles
  date + source + polarité + extrait tronqué ; **clic** : scatter → pose `?doc=` ; calendar → filtre liste
  du jour ; pas de survol-mort.
- Les agrégats (jours du calendrier, points du scatter, series du bar) sont calculés dans `domain/1934/`
  en fonctions pures testées ; les composants Nivo ne voient que leurs données, en `components/features/`.

## 6. Architecture & tests

- Frontières (C-003) : `domain/1934` pur (schémas, agrégats, lois de sélection des phares/miroirs) →
  `data/1934` port repository (seule couche qui importe les JSON) → `hooks/data` (lecture seule, pas de
  Zustand : état UI = URL, cf. `state.md` à compléter en 9.2) → `pages`/`components/features`.
- Nouvelle dépendance Zod : `.strict()`, `z.infer`, type importé des schémas (R5 en pratique même si R2
  est différée).
- Tests : Vitest sur `domain/` (agrégats, sélection miroir) et sur le port (corpus réel validé) ;
  composants avec **Nivo mocké** (`vi.mock`) ; Playwright sur le parcours juré en libellés réels (C-006).
- Ratchet : baseline 0 maintenue ; `npm run verify` + fumée E2E à chaque étape.
