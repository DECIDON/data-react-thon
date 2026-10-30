# components/features — composants d'écran

Briques branchées sur un cas d'usage métier, jamais réutilisables « au cas où » (convention features-first).

## features/1934 — « presse & palabre » (tranche R9, close)

L'écran vit du corpus reçu et remonte ses décisions (jour cliqué, filtre, document ouvert) ; l'URL est
l'affaire de `pages/` (C-003, `docs/state.md`).

- `Calendrier1934.tsx` — bandeau calendrier Q1 1934 (spec §4.1) ; reçoit l'agrégat du domaine, remonte le jour cliqué.
- `DocumentsDuJour.tsx` — panneau des documents du jour retenu (extrait tronqué, puces de polarité).
- `SujetsVitrine.tsx` — cartes des sujets `featured` + liste discrète du reste, liens vers `/sujet/:id`.
- `CarteDocument.tsx` — unité de carte (pastille de couloir, date, source, puces de polarité par sujet), pied
  de carte optionnel ; réutilisée par le panneau du jour, les phares, le miroir et la liste filtrée.
- `Miroir.tsx` — bloc miroir (spec §4.2) : phare presse vs phare parlement en regard, chacun avec sa porte
  « voir le détail » (raccord 9.6) ; message explicite si un couloir est vide.
- `DocumentDetail.tsx` — détail d'un document en `<dialog>` modal (spec §4.3) : extrait intégral, source liée,
  locuteur, puces de polarité ; l'ouverture appartient à `?doc=`, le composant n'a aucun état d'ouverture.
- `BarreDeFiltres.tsx` — filtres secondaires de la page sujet (segmented type, menus à cases locuteurs/
  journaux, bornes de dates) ; aveugle à l'URL, il reçoit les filtres validés et signale les changements.
- `Chronologie.tsx` / `BarMois.tsx` — frise en bandes `@nivo/bump` (AreaBump : une bande par couloir ×
  polarité, infobulle = comptes et parts mois par mois ; échelle commutable effectifs/parts, `?frise=`)
  et bar empilé mensuel `@nivo/bar`.
- `calendrier.ts` / `chronologie.ts` / `filtres.ts` / `presentation.ts` — adaptateurs purs (forme Nivo,
  lecture tolérante de l'URL, troncature, compteurs) : les mappages sont des décisions de présentation,
  testés sans DOM ni Nivo.

Règle : `components` n'importe jamais `data/` directement (C-003) — les données viennent des `hooks/`.
