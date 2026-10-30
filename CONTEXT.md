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

## Domaine — « presse & palabre » (actuel, ADR C-007)

- **Sujet** — thème d'actualité du trimestre, unique file de jointure entre presse et prises de parole ;
  désigné par un `id`, décrit dans `topics.json` (jamais en dur dans le code). `_Avoid_ : « thème », « tag », « topic » (angl. réservé aux imports LDA éventuels)._
- **Vitrine** — statut d'un sujet mis en avant sur l'accueil (`featured`). `_Avoid_ : « à la une », « premium »._
- **Prise de parole** — extrait d'intervention d'un _locuteur_ devant une _chambre_, à une date donnée.
  `_Avoid_ : « discours » (implique le texte intégral, que nous n'avons pas), « citation » (générique)._
- **Coupe de presse** — extrait d'article paru dans un _journal_, à une date donnée. `_Avoid_ : « article »
  (le contenu intégral n'existe pas au prototype), « coupure »._
- **Locuteur** — personne identifiée qui prend parole (champ `speaker` ; présent pour une prise de parole,
  absent pour une coupe). `_Avoid_ : « orateur », « député » (la chambre peut être le Sénat)._
- **Source** — titre et URL rattachant un document à son support (journal, compte rendu de séance).
  `_Avoid_ : « média », « provenance »._
- **Polarité** — attitude d'un document **vis-à-vis d'un sujet** : `positif | neutre | negatif`. Toujours
  rattachée au couple document×sujet, jamais au document seul. `_Avoid_ : « sentiment » (NLP), « ton »._
- **Phare** — document désigné par `highlight` comme extrait à montrer en tête de la page de son sujet.
  `_Avoid_ : « vedette », « mis en avant » (décris l'intention, pas le champ)._
- **Miroir** — bloc d'une page de sujet qui met en regard le phare presse et le phare parlement du même
  sujet. `_Avoid_ : « face-à-face », « comparatif »._
- **Couloir** — l'un des deux courants éditoriaux que suit un document : presse ou parlement (type
  `Couloir` dans `domain/1934`, couloirs de la frise). À l'écran, on rend les mots du glossaire
  (« Coupe de presse » / « Prise de parole »), pas le mot technique. `_Avoid_ : « colonne », « flux », « catégorie »._
- **Registre** — l'ensemble des documents du trimestre tel qu'exposé au juré (« au registre du trimestre »).
  `_Avoid_ : « base », « stock », « dataset » (le registre est fictif — cf. corpus fictif)._
- **Corpus fictif** — jeu de données commissionné sous `src/data/1934/` : journaux, locuteurs et contenus
  inventés à saveur 1934, jamais de paroles fabriquées attribuées à des personnes réelles (ADR C-008).
  `_Avoid_ : « démo », « fake data », « mock » (le mock est en test, le corpus fictif est en prod du prototype)._
