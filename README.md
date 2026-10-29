# data-react-thon

Squelette React 19 + TypeScript (Vite 7) amorcé depuis [`../foundation-react/`](../foundation-react/FOUNDATION.md) :
socle technique posé, **page unique « Hello World »**. Le projet démarre à l'état cible décrit par la
foundation ; les couches métier (données, orchestration, i18n) seront ajoutées au premier besoin réel,
pas avant (proportionnalité D-004 — tout report est consigné dans [`BOOTSTRAP-REPORT.md`](BOOTSTRAP-REPORT.md)).

## Prérequis

- Node **22 LTS** (`engines` + `packageManager` épinglés dans `package.json`).
- npm 11 (livré avec Node 22).

## Installation

```bash
npm ci        # installation reproductible depuis le lockfile
cp .env.example .env
```

## Commandes

| Commande                          | Rôle                                                                                                             |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                     | serveur de développement Vite                                                                                    |
| `npm run verify`                  | **commande de vérification locale = commande de CI** (generate-env → tsc → vitest → eslint → prettier → ratchet) |
| `npm run test` / `test:coverage`  | tests unitaires/composants (Vitest + RTL)                                                                        |
| `npm run e2e`                     | fumée Playwright (construit et sert l'app lui-même)                                                              |
| `npm run build` / `preview`       | build de production (`dist/`) puis prévisualisation                                                              |
| `npm run lint` / `lint:ratchet`   | ESLint ; ratchet baseline **0**                                                                                  |
| `npm run format` / `format:check` | Prettier                                                                                                         |

## Après le clonage (une seule fois)

```bash
git config core.hooksPath scripts/git-hooks   # hook anti-secrets + conventional commits
```

## Structure (extraite de STARTER.md §2)

```text
src/
  main.tsx App.tsx          # bootstrap : providers, routes (basename = VITE_BASE_PATH)
  platform/                 # technique transverse ; seul endroit où console / new Error existent
  domain/                   # cœur pur — zéro import technique (tenu par eslint-plugin-boundaries)
  data/ application/ hooks/ # posés vides : remplis à la première feature (cf. docs/roadmap.md)
  components/{ui,common,layout,features}/
  pages/                    # HomePage : la page « Hello World »
e2e/                        # fumée Playwright, réseau externe abandonné
docs/                       # architecture, DECISIONS (ADR), roadmap, securite, state, developpement
scripts/                    # generate-env, eslint-ratchet, git-hooks
```

Glossaire du projet : [`CONTEXT.md`](CONTEXT.md). Navigation développeur :
[`docs/developpement.md`](docs/developpement.md).
