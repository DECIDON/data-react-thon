# ARCHITECTURE — data-react-thon

> Spécification vérifiée contre le code le 2026-10-29 (politique documentaire de la foundation : toute note
> consolidée se supprime, ses décisions survivent dans `DECISIONS.md`).

## 1. Forme générale — les deux flux (état d'arrivée du projet source = point de départ)

```text
FLUX DE LECTURE (dominant)   Composant → hook d'abonnement → repository → base locale
FLUX D'ÉCRITURE              Composant → fonction de commande → queueEngine → plugin
                                                            ↘ persiste via repository ; la lecture suit
```

Ces deux flux ne sont **pas encore câblés** : le squelette n'a ni entité ni orchestrateur. Le diagramme est
l'engagement d'architecture ; chaque brique sera posée avec sa première utilisation réelle (proportionnalité
D-004), jamais en abstract. Le détail complet : `foundation-react/ARCHITECTURE.md`.

## 2. Carte des mécanismes d'état — ce qui existe ici

Voir `state.md` (l'inventaire fait foi). Position actuelle : **aucun état global**. Règle invariante héritée :
toute donnée métier va dans la base locale + un hook d'abonnement ; Zustand est plafonné à 2 foyers
(`workers`, `events`) et n'existe pas encore.

## 3. Règle de dépendances (rendue mécanique par le lint)

```text
pages → components/features → hooks → application → domain ← data
                    ↘ platform (config, erreurs, logging) ↙
INTERDIT : domain → tout ce qui n'est pas domain|platform   (tenu : boundaries/dependencies)
INTERDIT : components|pages → data|application              (tenu : boundaries/dependencies)
INTERDIT : `new Error` nu hors platform/errors/base.ts      (tenu : no-restricted-syntax)
INTERDIT : console hors platform/logging.ts                 (tenu : no-console + exception de fichier)
```

## 4. Présentation

- Routes : registre unique dans `App.tsx`, basename depuis `VITE_BASE_PATH` (aucune URL absolue codée).
- Erreurs d'UI : `ErrorBoundary` global (`components/common/`) qui **relaie** l'erreur typée au logger,
  ne la remplace jamais (P9).
- Les tables de présentation `Record` totales sans `default` deviennent obligatoires dès la première
  énumération de statut.

## 5. Configuration

Build-time : `VITE_BASE_PATH`, `VITE_APP_TITLE`, `VITE_LOG_LEVEL` (publiques par design, validées au
démarrage dans `platform/config.ts`). Métadonnées de build : `scripts/generate-env.mjs` écrit
`public/version.json`, copié dans `dist/` à chaque build.

## 6. Build & sécurité de squelette

`vite build` → CSP injectée en meta (`vite.config.ts`, build only) + `public/_headers` pour l'hébergeur.
Les grosses dépendances futures sortiront en `manualChunks` + routes lazy (pratique du source conservée).
