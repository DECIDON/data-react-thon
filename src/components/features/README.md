# components/features — composants d'écran

Briques branchées sur un cas d'usage métier, jamais réutilisables « au cas où » (convention features-first).

## features/1934 — « presse & palabre » (tranche R9)

- `Calendrier1934.tsx` — bandeau calendrier Q1 1934 (spec §4.1) ; reçoit l'agrégat du domaine, remonte le jour cliqué.
- `DocumentsDuJour.tsx` — panneau des documents du jour retenu (extrait tronqué, puces de polarité).
- `SujetsVitrine.tsx` — cartes des sujets `featured` + liste discrète du reste, liens vers `/sujet/:id`.
- `calendrier.ts` / `presentation.ts` — adaptateurs purs (forme Nivo, lecture de `?jour=`, troncature,
  compteurs) : les mappages sont des décisions de présentation, testés sans DOM ni Nivo.

Règle : `components` n'importe jamais `data/` directement (C-003) — les données viennent des `hooks/`.
