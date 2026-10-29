# components/ui — briques transversales de présentation

- `chartTheme.ts` — thème clair unique de tous les graphiques Nivo (spec §5, ADR C-009), aligné sur la
  palette Tailwind de l'app (échelle `neutral`). Un seul objet `theme`, passé en prop aux composants
  Nivo ; à réutiliser tel quel pour la frise et le bar de l'étape 9.4.
