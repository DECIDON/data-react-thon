# BOOTSTRAP-REPORT — data-react-thon

Rapport de transposition `foundation-react/` → projet React cible (skill project-bootstrapper).

## Foundation utilisée

`../foundation-react/` (13 documents, cible React 19 + TypeScript explicitement figée par STARTER.md §1).

## Stack cible retenue (vérifiée dans le lockfile)

Node 22 · Vite 7.3 · React 19.3 · TypeScript 5.9 strict (+`noUncheckedIndexedAccess`) · react-router 7.18 ·
Tailwind 4.3 · ESLint 9.39 flat (+typescript-eslint 8, react-hooks 5, **boundaries**, no-console,
no-restricted-syntax) · Prettier 3 (+organize-imports, +tailwindcss) · Vitest 4.1 + RTL + jsdom ·
Playwright (chromium) · GitHub Actions.

## Exigences du projet

Projet vide ; **une page unique affichant « Hello World »** ; suivre les bonnes pratiques de foundation-react.
Squelette minimal + verrous installables seulement maintenant (ADR C-004).

## Architecture appliquée

- Arborescence STARTER.md §2 intégralement déclarée ; seules les feuilles utiles au squelette sont peuplées
  (`platform/`, `pages/`, `components/common/`, `domain/` documenté vide).
- Deux flux (lecture réactive/écriture commandée) : forme conservée comme engagement (docs/architecture.md),
  non câblée faute d'entité.
- Erreurs : `platform/result.ts` (FunctionResult) + `platform/errors/base.ts` (BaseError + subclasses
  ConfigError/UiError) ; liste blanche ESLint = `base.ts` seul, **baseline vide au départ**.
- Logging : `platform/logging.ts` unique, gating par niveau, prod minim ; seul fichier exempté `no-console`.
- Configuration : `platform/config.ts` (validation au démarrage via ConfigError), `VITE_BASE_PATH` comme
  basename du routeur et base Vite ; `scripts/generate-env.mjs` (version/git hash/date → `public/version.json`).
- Frontières : eslint-plugin-boundaries — `domain` pur, UI ↛ data/application ; ratchet baseline **0**.
- UI : une route index → `HomePage` (« Hello World »), ErrorBoundary global qui relaie l'erreur typée.
- Sécurité de squelette : CSP meta build-only + `public/_headers` ; `.gitignore`+`.env.example` + hook
  anti-secrets ; `npm audit --omit=dev` bloquant ; actions CI épinglées par SHA.
- CI : `.github/workflows/ci.yml` (validate = commande locale `npm run verify`, e2e PR-only, permissions `{}`,
  concurrency cancel, rapport au premier échec, rétention 7 j).

## Principes préservés (MUST_PRESERVE de FOUNDATION.md §Synthèse)

1. Discipline d'erreurs D-002 complète (modules recopiés/adaptés, verrou lint, liste blanche quasi vide).
2. Frontières tenues mécaniquement (Q4 corrigé à la conception, ADR C-003).
3. Ratchet baseline 0 (Q1/Q3) — le plafond, pas la concession.
4. Documentation 4 foyers + ADR à déclencheurs + registre sécurité à dates fixes.
5. Proportionnalité D-004 : aucune couche créée sans responsabilité → voir « non appliqués ».
6. Commande de vérification locale = commande de CI (une seule définition : `npm run verify`).
7. Métadonnées de build datables ; zéro console hors module de logging ; épinglage systématique.

## Éléments de la foundation NON appliqués (aucun n'est caché)

| Élément                           | Décision                               | Raison                                                              | Alternative retenue                                                        |
| --------------------------------- | -------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Dexie + repositories + hooks live | DIFFÉRÉ (R2/R3)                        | Aucune donnée à persister dans « Hello World »                      | —                                                                          |
| queueEngine + registry + plugins  | DIFFÉRÉ (R4)                           | Aucune commande orchestrée ; la loi précède l'orchestrateur (D-006) | ErrorBoundary + logger pour l'existant                                     |
| Zustand (workers/events)          | DIFFÉRÉ                                | Aucun état global observable requis                                 | `state.md` porte la réservation                                            |
| Zod                               | DIFFÉRÉ (R5)                           | Aucune entité persistée à valider                                   | Validation manuelle stricte de `config.ts`                                 |
| TanStack Query/Table/Virtual      | DIFFÉRÉ                                | Aucun fetch externe                                                 | —                                                                          |
| i18next                           | DIFFÉRÉ (ADR C-006, déclencheur écrit) | Une langue, aucun dictionnaire                                      | Chaînes FR littérales ; tests sur libellés réels                           |
| Radix/shadcn primitives           | DIFFÉRÉ                                | Aucune UI interactive                                               | Tailwind 4 posé (utility-first, contrat « rôles accessibles » préservable) |
| taskStatusLaw + tests 90 %        | NON APPLICABLE                         | Loi du domaine CorpuSense ; domaine du projet non tranché (R1)      | Seuil de couverture configuré, prêt à s'appliquer                          |
| PWA (`vite-plugin-pwa`)           | NON APPLICABLE                         | Offline non requis                                                  | mode `e2e` sans SW déjà conforme                                           |
| exceljs export                    | NON APPLICABLE                         | Aucun export tableur                                                | —                                                                          |
| OpenTelemetry/Sentry              | REFUSÉ (conforme OBSERVABILITY §3)     | Aucun service central                                               | logger + ErrorBoundary + version.json                                      |
| deploy.yml 2 environnements       | DIFFÉRÉ (R7)                           | Aucun hébergement visé par la demande                               | ci.yml prêt, déploiement conditionné documenté                             |

## Nouvelles dépendances et justification

Aucune dépendance hors stack figée : chaque paquet livré sert une exigence de la foundation ou de la page
unique (react/react-dom/dom-client = UI ; react-router = registre de routes + basename ; tailwind = styles
de la cible ; vitest/RTL/jsdom = TESTING ; playwright = fumée ; eslint*/boundaries + prettier* = qualité ;
typescript-eslint = analyse TS). Aucune micro-bibliothèque, aucun barrel.

## Stratégie de tests en place

- Unitaire : `platform/result.test.ts` (le contrat du pattern).
- Composant : `HomePage.test.tsx` — rôle accessible `heading`, zéro `data-testid` (contrat de test du source).
- Harnais `vitest.setup.ts` documenté stub par stub (matchMedia/ResizeObserver requis par l'écosystème visé ;
  fake-indexeddb en attente explicite de R2).
- E2E fumée : ouvre l'app, vérifie le titre, réseau externe abandonné.
- Seuil : `src/domain/**` 90 % dès que `domain/` est peuplé (coverage thresholds configurés).

## CI/CD

validate (tsc -b, vitest, prettier --check, ratchet 0, audit bloquant) ; e2e PR-only ; permissions `{}` ;
concurrency cancel ; SHA-pinning des actions. Deploy : non posé (R7) — volontaire, demandé vide.

## Observabilité

Trois canaux seulement (OBSERVABILITY.md) : erreurs structurées (BaseError.context JSON → logger),
journal d'événements (à naître avec `events`), métadonnées de build (`version.json` généré au build).
Aucune dépendance d'observabilité déclarée sans usage.

## Dette technique initiale & limitations connues

1. `ErrorBoundary.componentDidCatch` journalise `info` sans l'inclure encore dans le contexte sérialisé —
   priorité basse, corrigé au premier écran métier (D: medium/low).
2. `docs/roadmap.md` R2→R5 sont des engagements conditionnels, pas des estimations.
3. CSP `style-src 'unsafe-inline'` requis par les styles injectés de l'écosystème ; à raffiner (nonce/hash)
   si une exigence d'hébergeur l'exige. Priorité basse.
4. Le hook anti-secrets est heuristique : il n'exempte pas une revue ; gitleaks côté CI sera ajouté quand
   des secrets de service apparaîtront.

## Étapes suivantes

R1 (tranchage domaine + CONTEXT.md complet) → R2 (persistance v1 + premier entity) → R3/R4 (les deux flux
câblés) ; R7 au premier hébergement.
