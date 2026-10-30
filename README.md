# data-react-thon

Squelette React 19 + TypeScript (Vite 7) amorcé depuis [`../foundation-react/`](../foundation-react/FOUNDATION.md) :
socle technique posé, et la première feature est là — **« Presse & palabre » (Q1 1934)**, prototype lecture
seule pour le parcours du juré (accueil `/`, page sujet `/sujet/:id`, détail en modale via `?doc=`), rendu
depuis un corpus fictif commissionné ; spec contractuelle dans
[`docs/spec-presse-palabre-1934.md`](docs/spec-presse-palabre-1934.md). Les autres couches métiers
(persistance d'écriture, i18n) seront ajoutées au premier besoin réel, pas avant (proportionnalité D-004 —
tout report est consigné dans [`BOOTSTRAP-REPORT.md`](BOOTSTRAP-REPORT.md) et [`docs/roadmap.md`](docs/roadmap.md)).

En ligne : <https://decidon.github.io/data-react-thon/> — déployé automatiquement sur GitHub Pages à chaque
push sur `main` (`.github/workflows/deploy-pages.yml`).

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
| `npm run e2e`                     | Playwright sur build de prod : fumée + parcours juré (construit et sert l'app lui-même)                          |
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
  data/ hooks/              # feature 1934 : port repository du corpus + hooks de lecture
  application/              # encore vide : rempli à la première commande (cf. docs/roadmap.md)
  components/{ui,common,layout,features}/
  pages/                    # HomePage (accueil 1934), SujetPage (page sujet + détail en modale)
e2e/                        # fumée + parcours juré Playwright, réseau externe abandonné
docs/                       # architecture, DECISIONS (ADR), roadmap, securite, state, developpement
scripts/                    # generate-env, eslint-ratchet, git-hooks
```

Glossaire du projet : [`CONTEXT.md`](CONTEXT.md). Navigation développeur :
[`docs/developpement.md`](docs/developpement.md).
