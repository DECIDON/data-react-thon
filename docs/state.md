# STATE — inventaire d'état (fait foi, ARCHITECTURE.md §2)

Règle invariante : tout état métier naît dans la base locale + hook d'abonnement ; Zustand est plafonné à
2 foyers et réservé aux statuts d'exécution et notifications. Aucun état n'est créé sans ligne ici **avant** son code.

| Foyer                 | Mécanisme | Propriétaire | Cycle de vie | Persistance |
| --------------------- | --------- | ------------ | ------------ | ----------- |
| _(aucun aujourd'hui)_ | —         | —            | —            | —           |

## Réservations connues (engagements, pas implémentations)

- `workers` (Zustand) — statuts d'exécution dérivés par la loi de statut ; créé avec la première commande orchestrée.
- `events` (Zustand) — notifications/toasts ; journal persisté quand la base locale existera (OBSERVABILITY canal 2).
- Contexte UI (session/sélection d'écran) — React Context, jamais Zustand.
- Configuration utilisateur — localStorage derrière `platform/config.ts` (extension prévue, risque S-04 acté).

## Interdits actifs

- Jamais de donnée métier dans Zustand/localStorage : c'est le rôle de la base locale (à venir, ADR au premier entity).
- Pas de store global « pour plus tard ».
