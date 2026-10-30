# `domain/` — cœur métier pur

Règle tenue par ESLint (`boundaries/dependencies`) : **zéro import technique** ici.
Interdits : react, dexie, zustand, tout SDK. Autorisés : `domain/**` et `platform/**` (au pire).

Le domaine de ce projet est « presse & palabre » (ADR C-007, glossaire dans `CONTEXT.md`) ; il reçoit ses
modules purs sous `domain/1934/` : le **contrat** du corpus (types + schémas Zod `.strict()`, source de
vérité), les **agrégats** du trimestre (jours du calendrier, points de la frise, séries mensuelles) et les
**lois de sélection** (miroir, phares) — zéro import technique, loi précède l'orchestration (leçon D-006).

Seuil de couverture exigé par la CI : 90 % lignes/branches/fonctions (TESTING.md).
