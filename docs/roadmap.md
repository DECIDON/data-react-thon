# ROADMAP — critères de sortie

Chaque ligne est un _déclencheur_ + un critère de sortie vérifiable, pas une promesse datée.

| #   | Tranche                                                              | Déclencheur                        | Critère de sortie                                                                                               |
| --- | -------------------------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| R1  | Tranchage du domaine + CONTEXT.md complet                            | Avant toute feature métier         | Glossaire avec `_Avoid_` pour chaque terme ; ADR C-007                                                          |
| R2  | Persistance v1 (Dexie 4) + premier entity de bout en bout            | Première donnée à conserver        | Schéma v1 commenté, repository avec `patch()` verrouillé par le type, `createTestDb()`, test d'intégration réel |
| R3  | Flux lecture : hook `useLive…` + page qui le consomme                | R2 mergée                          | La page se re-rend à l'écriture, preuve en test                                                                 |
| R4  | Flux écriture : queueEngine + registry unique + plugin factice testé | Première commande longue           | Horloge injectée, loi de statut dans `domain/` testée à 90 %+, faux notifier                                    |
| R5  | Validation Zod des entités + validation d'import                     | Premier entity persistée           | `.strict()`, `z.infer`, import = schéma = type                                                                  |
| R6  | i18n (C-006)                                                         | Seconde langue ou contenu localisé | i18next + mock à clés contrat complet ; tests sur clés                                                          |
| R7  | Deploy conditionné (deploy.yml, 2 environnements)                    | Premier hébergement                | Variables `VITE_*` vérifiées avant build, artefact unique, stable/test                                          |
| R8  | Seams métier (LLMClient/ports)                                       | Premier service externe            | Un port, un adaptateur, client factice en test, ADR                                                             |

Seuil de qualité constant : `npm run verify` vert + fumée E2E verte + ratchet non remonté.
