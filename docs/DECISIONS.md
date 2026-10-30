# DECISIONS — ADR

Format : Contexte / Décision / Alternatives / Conséquences + statut et déclencheur de réexamen.

## C-001 — Stack figée par la foundation (2026-10-29) · statut : acceptée

**Contexte.** Le générateur `create-vite` propose aujourd'hui Vite 8 / TypeScript 7 / oxlint par défaut.
La foundation (§STARTER 1) fige Vite 7, TypeScript ~5.9 strict, ESLint 9 flat + plugin de frontières,
Prettier 3, Vitest 4, Playwright chromium.
**Décision.** Suivre la foundation : Vite 7.3, TS 5.9, ESLint 9 (+boundaries), Prettier 3, Vitest 4,
Playwright. Le rattrapage éventuel (moteur TS natif) se fera par ADR de montée de version, pas en silence.
**Alternatives.** Prendre les défauts du générateur — rejeté : la stack est un choix documenté de la foundation.
**Conséquences.** Les workflows CI et le harnais de test sont alignés sur ces outils ; toute montée de version
majeure est un ADR.

## C-002 — Pas de Redux, pas de Saga (2026-10-29) · statut : acceptée

**Contexte.** Décision D-006 du projet source : Redux Toolkit et Redux-Saga sont en retraite ; leur
destination est un queueEngine à ports + Zustand.
**Décision.** Ni RTK ni saga ne seront jamais introduits. À la première orchestration : `queueEngine` maison
(`src/application/`, loi de statut déléguée à `domain/`) + Zustand limité à 2 foyers (`workers`, `events`).
**Alternatives.** RTK « parce que c'est standard » — rejeté (destination connue du projet source).
**Conséquences.** `state.md` borne Zustand ; l'absence de store global aujourd'hui est un état voulu, pas un oubli.

## C-003 — Frontières tenues par le lint dès le commit 1 (2026-10-29) · statut : acceptée

**Contexte.** Lacune Q4 du source : les règles de couches n'étaient que documentées, violées deux fois.
**Décision.** `eslint-plugin-boundaries` + `no-restricted-syntax` + `no-console` font respecter ARCHITECTURE.md §3 ;
ratchet baseline 0 : une violation est un échec de build.
**Alternatives.** Revue humaine, dependency-cruiser — rejetés : le lint est déjà dans le pipeline.
**Conséquences.** Toute nouvelle couche crée sa règle de frontières dans le même commit.

## C-004 — Périmètre du démarrage : squelette minimal (2026-10-29) · statut : acceptée

**Contexte.** Demande : projet React vide, une page « Hello World ». La foundation décrit une application
complète (Dexie, Zod, i18n, queueEngine…).
**Décision.** Ne poser que ce qui sert la page unique + les verrous qui coûtent moins à installer maintenant
qu'à retrofitter (frontières, erreurs, logging, CSP, CI, hooks, ratchet). Dexie/Zod/i18n/Query/queueEngine
sont différés avec critères d'entrée (roadmap.md) ; divergences listées dans BOOTSTRAP-REPORT.md.
**Alternatives.** Scaffold complet « au cas où » — rejeté : couches sans responsabilité = anti-pattern §32.
**Conséquences.** Le premier besoin métier déclenche la roadmap, pas une migration silencieuse.

## C-005 — Frontière de confiance : locale, mono-utilisateur (2026-10-29) · statut : acceptée, déclencheur écrit

**Contexte.** Reprise de D-J/D-011 du source : SPA sans backend, la machine de l'utilisateur est la frontière.
**Décision.** Pages publiques, aucune authentification, aucun secret applicatif côté client.
**Déclencheur de réexamen écrit :** première exigence multi-utilisateur ou accès distant → l'authentification
devient un prérequis (hors périmètre « feature »), cf. S-01/S-04 de `securite.md`.
**Conséquences.** Les clés API tierces, le jour venu, seront saisies localement avec avertissement UI.

## C-006 — i18n différé, textes source en français (2026-10-29) · statut : acceptée, déclencheur écrit

**Contexte.** La foundation retient i18next + clés partout ; mais poser la couche i18n sans dictionnaire ni
deuxième langue est une abstraction sans besoin observé (D-004).
**Décision.** Chaînes littérales en français aujourd'hui. **Déclencheur :** l'ajout d'une seconde langue ou
d'un contenu piloté par locale → i18next + mock à clés complet en test, et reprise des chaînes.
**Conséquences.** Les tests E2E/component assertent sur les libellés réels jusqu'alors (pas de `data-testid`).

## C-007 — Domaine : actualité 1934, « presse & palabre » (2026-10-29) · statut : acceptée

**Contexte.** Première feature métier (déclencheur R1). Deux sources à croiser — presse imprimée et prises de
parole parlementaires — sans modèle commun évident ; la reprise du domaine CorpuSense de la foundation
importerait un vocabulaire et des contraintes sans besoin observé ici.
**Décision.** Domaine propre, « presse & palabre » : des _sujets_ (liste à part, file de jointure), documentés
par des _coupes de presse_ et des _prises de parole_, chacun portant une _polarité_ par sujet. Le glossaire
du domaine est celui de `CONTEXT.md` § Domaine et fait foi ; le format de données idéal (contenu, source,
date, locuteur optionnel, sujets+polyarité, phare) y est fixé et sert de contrat entre données et UI.
Période figée au premier trimestre 1934 (prototype).
**Alternatives.** Reprise CorpuSense — rejeté (abstraction sans besoin) ; jointure par entités nommées ou
par topics importés — rejetés pour v1 : la jointure par liste de sujets est la plus simple et suffit à la
vitrine ; à reconsidérer si un second mode d'association est demandé.
**Conséquences.** R1 close. Tout nouveau terme du domaine passe d'abord par `CONTEXT.md`. La feature se
déroule selon la tranche R9 de `roadmap.md`, spec dans `spec-presse-palabre-1934.md`.

## C-008 — Données fictives en lecture seule ; dérogation à Dexie (2026-10-29) · statut : acceptée, déclencheur écrit

**Contexte.** Le prototype doit prouver le format et les vues avant la moindre acquisition réelle (les
corpus réels existent mais hors périmètre). La roadmap prévoyait Dexie/IndexedDB (R2) dès la première
donnée ; cette donnée serait ici en écriture zéro.
**Décision.** Jeu de données **fictif** (monde inventé à saveur 1934, jamais de citations mises dans la
bouche de personnes réelles), commissionné dans le dépôt sous `src/data/1934/`, en JSON conforme au
contrat de `spec-presse-palabre-1934.md`, validé au chargement par **Zod** (`.strict()`). Un port de
repository (`src/data/`) expose des collections typées aux hooks ; l'absence de base locale est un choix
acté, pas un oubli. Le caractère fictif des données est affiché dans l'UI.
**Alternatives.** Dexie dès maintenant — rejeté : persistance sans écriture = couche morte ; API Impresso
au runtime — rejeté : token sur page publique (C-005) et réseau en démo.
**Conséquences.** Zod entre en dépendance. **Déclencheur de réexamen écrit :** la première exigence
d'écriture (annotation, sélection persistée) → Dexie reprend la main (roadmap R2) et les JSON de
`src/data/1934/` deviennent un format d'import, pas de runtime.

## C-009 — Nivo pour les graphiques (2026-10-29) · statut : acceptée

**Contexte.** La branche `feat-dataviz` porte de vrais graphiques (choix utilisateur explicite), hors des
trois libellés figés par C-001. Besoin : carte calorique temporelle, nuage de points en couloirs, barres
empilées ; React 19 imposé.
**Décision.** `@nivo/calendar`, `@nivo/scatter`, `@nivo/bar` en version 0.99 (peer React ^19 vérifié),
thème clair personnalisé aligné sur la palette Tailwind de l'app, conteneurs responsives, infobulles +
clic-filtre. En test (jsdom), les composants Nivo sont mockés à la frontière ; la logique testée est
l'agrégation `domain/`, pas le rendu SVG.
**Alternatives.** Recharts, Plotly (déjà rencontré ailleurs) — rejetés sur demande explicite ; géométrie
CSS maison — rejetée : la branche s'appelle dataviz.
**Conséquences.** Trois paquets Nivo + leurs pairs (`@react-spring/web`, auto-sizer) au bundle ; la politique
de mock de graphiques vaut pour toute lib de rendu futur ; montée de version majeure = ADR (C-001).

## C-010 — La frise passe du scatter à l'AreaBump (2026-10-30) · statut : acceptée

**Contexte.** La spec §4.2 décrivait une frise `@nivo/scatter` en couloirs, un point par document,
clic → `?doc=`. Demande utilisateur : lire des **volumes** sur le trimestre — une bande pour les
prises de parole positives, une pour les négatives, idem côté presse.
**Décision.** `Chronologie` peint un **AreaBump** (`@nivo/bump` 0.99, ajouté en dépendance ; la doc
confirmait N colonnes possibles, `compute.ts` construit sa propre `scalePoint`). Six bandes au plus,
couloir × polarité, une colonne par mois complet du trimestre (zéros padding : toute bande traverse
toute colonne), couleur relue depuis l'id de série comme avant. Le clic `?doc=` **disparaît de la
frise** : une bande agrège N documents, aucun document sous le curseur ; l'infobulle rend les comptes
mois par mois et la liste chronologique reste le chemin vers le détail.
**Alternatives.** Garder le scatter et ajouter un second graphique — rejeté : deux frises redondantes ;
LineBump — rejeté : des traits, pas les quantités demandées ; agrégat `domain/` nouveau — rejeté :
`pointsChronologie` suffit, le comptage mensuel est une décision de présentation (`chronologie.ts`).
**Conséquences.** `@nivo/scatterplot` sort des dépendances, `@nivo/bump` y entre ; la spec §4.2 n'est
pas réécrite (document d'époque) — cette ADR en est la lecture à jour ; le mock de `SujetPage.test.tsx`
peint des bandes, plus de boutons de frise.

## À venir (pas encore d'ADR)

- Choix de la persistance (Dexie v1 sans héritage) — au premier besoin d'écriture (déclencheur écrit en C-008).
