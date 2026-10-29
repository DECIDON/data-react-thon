# ROADMAP — critères de sortie

Chaque ligne est un _déclencheur_ + un critère de sortie vérifiable, pas une promesse datée.

| #   | Tranche                                                              | Déclencheur                        | Critère de sortie                                                                                               |
| --- | -------------------------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| R1  | Tranchage du domaine + CONTEXT.md complet                            | Avant toute feature métier         | ✅ Close : ADR C-007, glossaire dans `CONTEXT.md` (2026-10-29)                                                  |
| R2  | Persistance v1 (Dexie 4) + premier entity de bout en bout            | Première donnée à conserver        | Schéma v1 commenté, repository avec `patch()` verrouillé par le type, `createTestDb()`, test d'intégration réel |
| R3  | Flux lecture : hook `useLive…` + page qui le consomme                | R2 mergée                          | La page se re-rend à l'écriture, preuve en test                                                                 |
| R4  | Flux écriture : queueEngine + registry unique + plugin factice testé | Première commande longue           | Horloge injectée, loi de statut dans `domain/` testée à 90 %+, faux notifier                                    |
| R5  | Validation Zod des entités + validation d'import                     | Premier entity persistée           | `.strict()`, `z.infer`, import = schéma = type                                                                  |
| R6  | i18n (C-006)                                                         | Seconde langue ou contenu localisé | i18next + mock à clés contrat complet ; tests sur clés                                                          |
| R7  | Deploy conditionné (deploy.yml, 2 environnements)                    | Premier hébergement                | Variables `VITE_*` vérifiées avant build, artefact unique, stable/test                                          |
| R8  | Seams métier (LLMClient/ports)                                       | Premier service externe            | Un port, un adaptateur, client factice en test, ADR                                                             |

Seuil de qualité constant : `npm run verify` vert + fumée E2E verte + ratchet non remonté.

## Tranche R9 — « Presse & palabre » (Q1 1934)

Spec contractuelle : [`spec-presse-palabre-1934.md`](spec-presse-palabre-1934.md) (autoportée : format des
données, jeu fictif, écrans, graphiques, tests). ADR C-007 (domaine), C-008 (fictif/lecture seule),
C-009 (Nivo). **Règle d'exécution : une étape = une session ; une session ne démarre que sur l'étape
précédente mergée, `npm run verify` vert et ratchet non remonté.**

| Étape | Contenu                                                                                          | Critère de sortie                                                                                     |
| ----- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| 9.1   | Contrat de données : types + schémas Zod dans `domain/`, corpus fictif dans `src/data/1934/`     | 6 sujets (3 vitrine), ~40 prises / ~60 coupes conformes ; test de validation du corpus contre le schéma ; paire en polarités opposées par sujet |
| 9.2   | Port repository (`data/`) + hooks de lecture (`hooks/data/`) + ligne dans `state.md`             | Hooks typés testés (sujets, documents par sujet, agrégats calendar/scatter/bar) ; frontières respectées |
| 9.3   | Accueil : `@nivo/calendar` Q1 1934 + cartes de sujets vitrine + bandeau « données fictives »     | Route `/` rendue, clic sur un jour → liste des documents de ce jour ; tests composants (Nivo mocké)     |
| 9.4   | Page sujet : phares, miroir, scatter (clic = sélection/filtre), bar mensuel, filtres en URL      | `/sujet/:id` ; tout filtre est codé dans l'URL et survit au rechargement ; bloc miroir par polarités opposées |
| 9.5   | Détail d'un document (volet ou route), snippet + source + polarités                              | Depuis scatter ou liste ; URL partageable                                                             |
| 9.6   | Fumée E2E du parcours juré (accueil → sujet → miroir → détail), à jour roadmap/`state.md`        | `e2e/` vert contre les libellés réels (C-006) ; R9 mergée                                             |

R2 (Dexie) et R5 (imports) restent en attente : leur déclencheur — premier besoin d'écriture — n'est pas
sonné (C-008).
