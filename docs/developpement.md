# DÉVELOPPEMENT — carte de navigation & rituels

## Où mettre quoi (règle d'atterrissage, héritée du source : destination = départ)

| Je veux…                          | Ça va dans…                             | Parce que                                                               |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| Lire/écrire la config (`VITE_*`)  | `src/platform/config.ts`                | Un seul point de vérité, validé au démarrage                            |
| Lever une erreur                  | `subclass de BaseError`                 | Jamais `new Error` nu (D-002) ; lint bloquant                           |
| Logger                            | `logger` de `src/platform/logging.ts`   | Seule porte d'entrée console ; format imposé                            |
| Une loi/un calcul sans dépendance | `src/domain/`                           | Pur : testable à 90 %+ sans DOM ni framework                            |
| Un composant métier               | `src/components/features/<domaine>/`    | Par défaut d'atterrissage (D-H)                                         |
| Une primitive sans logique        | `src/components/ui/`                    | shadcn-like, kebab-case admis ici seulement                             |
| Une page                          | `src/pages/` + une route dans `App.tsx` | Registre de routes unique                                               |
| Un helper « fourre-tout »         | **Nulle part**                          | Trois niveaux d'utils = interdiction formelle ; un module nommé ou rien |

## rituels

1. **Vérifier avant de pousser** : `npm run verify` (identique à la CI, mêmes étapes même ordre).
2. **E2E** : `npm run e2e` — Playwright construit et sert l'app ; réseau externe abandonné par le spec.
   Règle du source : 10 runs verts avant commit d'un parcours critique.
3. **Hooks** : `git config core.hooksPath scripts/git-hooks` (anti-secrets + conventional commits).
4. **Ratchet** : ne jamais remonter `.eslint-ratchet.json` ; l'abaisser est un bon réflexe de revue.

## Pièges connus (documentés ici, pas dans les tickets)

- `npm install` incrementiel peut craquer (`arborist … children null`) après un désaccord de peer deps :
  solution = verrouiller le manifeste puis `rm -rf node_modules package-lock.json && npm install`.
- La **CSP est build-only** : en dev, le HMR fonctionne sans elle ; ne pas « corriger » ce désaccord.
- Les imports **sans extension** (`@/platform/config`) : bundler resolution ; ne pas ajouter `.ts` aux imports
  source (le tsconfig ne l'autorise pas).
- Le ratchet appelle l'exécutable local (`node_modules/.bin/eslint`) : pas d'ESLint global fantôme.
- Coverage : seul `src/domain/**` est sous seuil (90 %) ; pas de pourcentage global punitif (Q2 du source corrigé).

## Commandes rares

| Commande                          | Quand                                           |
| --------------------------------- | ----------------------------------------------- |
| `node scripts/generate-env.mjs`   | pour régénérer `public/version.json` hors build |
| `npx playwright install chromium` | première exécution locale des E2E               |
| `npm run test:coverage`           | revue de couverture du domaine                  |
