# `hooks/data/` — hooks de lecture

Façade de lecture au-dessus des ports repository (`data/`) : l'UI (pages, composants) ne monte
jamais jusqu'au repository, elle consomme ces hooks. Lecture seule au prototype (ADR C-008) : pas
de mutation, pas de Zustand ici (l'état UI des filtres vivra dans l'URL, cf. `docs/state.md`).

- `useCorpus1934.ts` — corpus « presse & palabre » : `useCorpus1934`, `useSujet1934(id)`,
  `useDocumentsDuSujet(id)`, `useDocument1934(id)` (ciblage `?doc=`), `useListesDeFiltres()` ;
  monnaie d'échange `{ ok, … } | { ok: false, error }`.
