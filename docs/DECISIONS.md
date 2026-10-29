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

## À venir (pas encore d'ADR)

- Tranchage du domaine (reprise CorpuSense vs domaine « datathon » propre) → met à jour `CONTEXT.md`.
- Choix de la persistance (Dexie v1 sans héritage, ADR C-002 du source) — au premier entity.
