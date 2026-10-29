# SÉCURITÉ — registre

Format du source conservé : ID, criticité, constat re-vérifié **contre le code à date fixe**, action,
points fermés gardés « pour mémoire ». Registre relu à tout changement d'architecture significatif.
Le squelette ferme d'office les ouvertures du source qui étaient des mesures de conception.

## Ouvertes

| ID   | Crit.   | Constat (vérifié 2026-10-29)                                                  | Action                                                                                                                       | Statut                                        |
| ---- | ------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| S-01 | basse   | Aucune garde de routes : pages publiques.                                     | Décision C-005 assumée (mono-utilisateur local) ; réactiver au déclencheur écrit.                                            | fermée « pour mémoire », réexamen conditionné |
| S-04 | moyenne | Clés API tierces : aucune aujourd'hui ; localStorage retenu comme mode futur. | Avertissement UI + portées minimales (PAT) le jour venu ; aucun secret applicatif en dur.                                    | ouverte (conditionnelle)                      |
| S-06 | basse   | Aucun paramètre de route entrant dans un fetch (aucun fetch).                 | Règle rappelée au premier fetch : filtrer/valider par liste blanche de schéma.                                               | ouverte (conditionnelle)                      |
| S-07 | haute   | Aucun rendu de contenu externe (aucun contenu externe).                       | Verrou mécanique posé : `dangerouslySetInnerHTML` interdit au lint ; `rehype-sanitize` requis au premier rendu non contrôlé. | fermée par verrou                             |
| S-08 | haute   | Aucun import de données (pas d'import).                                       | Validation Zod obligatoire au premier import (roadmap R5) + backup préalable.                                                | ouverte (conditionnelle)                      |

## Fermées « pour mémoire »

| ID   | Crit.   | Ouverture du source                      | Mesure de conception appliquée ici                                                                                                                              |
| ---- | ------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S-02 | —       | `Dexie.debug = true` inconditionnel      | Pas de Dexie encore ; logging gate par `VITE_LOG_LEVEL`, prod = `error` (config.ts).                                                                            |
| S-03 | haute   | Aucune CSP                               | Meta CSP injectée au build (`vite.config.ts`) + `public/_headers` ; `connect-src 'self'`. À compléter selon services branchés.                                  |
| S-05 | haute   | `xlsx` vulnérable, git deps non épinglés | Dépendance exclue d'office ; CI : `npm audit --omit=dev` **bloquant** (baseline 0, exceptions = PR commentée ici) ; deps git en tag/SHA si un jour nécessaires. |
| S-09 | moyenne | ~59 `console.log` en prod                | Un seul module de logging ; `no-console` compile-proof (exception unique `platform/logging.ts`).                                                                |
| S-11 | haute   | `.env` commité avant gitignore           | `.gitignore` + `.env.example` dès le commit 1 + hook `pre-commit` anti-secrets (`core.hooksPath`).                                                              |

## Hygiène continue

- Actions GitHub **épinglées par SHA** (ci.yml) ; runtime Node 22 épinglé ; `packageManager` épinglé.
- Preuves négatives mécanisées : `no-eval`, `no-new-func`, CSP `object-src 'none'`, `frame` pas d'embedding
  (`X-Frame-Options` à ajouter via _headers selon politique d'intégration).
- Relecture du registre : à chaque ADR structurante ou ajout de dépendance/service externe.
