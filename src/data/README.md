# `data/` — port repository (seule couche qui importe les données)

Ici vivent les adaptateurs qui transforment des sources brutes (JSON commissionnés, un jour Dexie)
en collections typées pour les hooks. Règle de frontière (ADR C-003) : `data/` peut importer
`domain/` et `platform/` ; l'UI (composants, pages) ne l'importe pas directement, elle passe par `hooks/`.

## `data/1934/` — corpus fictif « presse & palabre » (ADR C-008)

- `topics.json` — les 6 sujets du trimestre (3 en vitrine), seul lieu de définition des sujets.
- `statements.json` — les prises de parole (`pd-0xx`), locuteurs et chambres fictifs.
- `press.json` — les coupes de presse (`cp-0xx`), journaux fictifs à saveur 1934.
- `corpus.test.ts` — validation du corpus contre les schémas `domain/1934` + règles de commissionnement.
- `repository.ts` — port repository : parse strict une fois (mémoïsé), corpus gelé en `FunctionResult`,
  sélecteurs dérivés (`sujetParId`, `documentsParSujet`, `journaux`, `locuteurs`) ; les hooks de lecture
  (`hooks/data/useCorpus1934`) sont la seule porte de sortie vers l'UI.

Monde entièrement fictif : jamais de paroles fabriquées attribuées à des personnes, journaux ou
chambres réels.
