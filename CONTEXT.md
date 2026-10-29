# CONTEXT — glossaire

Le domaine applicatif de data-react-thon reste à arrêter (prochaine ADR, cf. `docs/DECISIONS.md`).
Ce fichier porte déjà le vocabulaire du socle, fixé maintenant pour que les contributions suivantes
parlent le même langage. Format imposé par la foundation : terme — définition — `_Avoid_`.

## Socle (actuel)

- **Squelette** — état actuel du dépôt : socle technique + page unique. `_Avoid_ : « starter », « template »._
- **Plateforme** — couche `src/platform/` : configuration, erreurs, logging, résultats. Technique transverse,
  jamais métier. `_Avoid_ : « utils », « shared », « common » (trois niveaux d'utils = dette interdite)._
- **Frontière de couches** — règle de dépendance tenue mécaniquement par `eslint-plugin-boundaries` ; une
  violation est un échec de build, jamais une note de roadmap (ADR C-003).
- **FunctionResult** — `{ ok, value | error }` ; monnaie d'échange aux frontières de commande.
  `_Avoid_ : « throw/catch » comme API, « Result » sans discriminant._
- **Ratchet** — plafond versionné du nombre de diagnostics ESLint ; ne peut que descendre (baseline 0).

## Domaine (à venir)

- _(À définir par l'ADR de tranchage du domaine — reprendre le domaine CorpuSense de la foundation, ou
  un domaine « datathon » propre ; écrire ici chaque terme retenu avec son `_Avoid_`.)_
