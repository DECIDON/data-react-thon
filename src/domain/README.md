# `domain/` — cœur métier pur

Règle tenue par ESLint (`boundaries/dependencies`) : **zéro import technique** ici.
Interdits : react, dexie, zustand, tout SDK. Autorisés : `domain/**` et `platform/**` (au pire).

Le domaine de ce projet reste à décider (voir `CONTEXT.md`) : ce dossier reçoit les modules purs
(lois de statut, schémas Zod, convertisseurs) **avant** toute orchestration — leçon D-006 du projet
source : la loi précède l'orchestrateur.

Seuil de couverture exigé par la CI : 90 % lignes/branches/fonctions (TESTING.md).
