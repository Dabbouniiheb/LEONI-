# Références effectivement utilisées

La description fonctionnelle du rapport repose d’abord sur les sources internes du projet. Les documentations externes servent uniquement à expliquer le rôle général des technologies réellement détectées ; elles ne prouvent pas les fonctionnalités propres à l’application.

## 1. Sources internes principales

1. **Projet `leoni-planing`, code source actuel** : `server.js`, `config/`, `routes/`, `controllers/`, `services/`, `models/`, `middlewares/`, `validations/`, `utils/` et `views/`.
2. **Manifeste et verrouillage des dépendances** : `leoni-planing/package.json` et `leoni-planing/package-lock.json`.
3. **Schéma relationnel** : `leoni-planing/sql/schema.sql`.
4. **Migrations actuelles** : `leoni-planing/sql/migrations/001_add_enterprise_columns.sql` à `007_create_monthly_group_selections.sql`.
5. **Tests automatisés actuels** : `monthlyGroupSelectionWindowGuard.test.js`, `planningGenerationWindow.test.js` et `planningServiceGenerationGuard.test.js` dans `leoni-planing/tests/`.
6. **Exemple de configuration non sensible** : `leoni-planing/.env.example`, utilisé uniquement pour identifier les noms de variables nécessaires.

## 2. Documentations officielles consultées

Les URL ci-dessous ont été consultées le **15 juillet 2026**.

1. **Express.js — 5.x API Reference.** Documentation du routage, des middlewares et des objets requête/réponse : <https://expressjs.com/en/5x/api/>.
2. **Node.js — Test runner.** Documentation du module natif `node:test` et de son exécution en ligne de commande : <https://nodejs.org/api/test.html>.
3. **MySQL — Documentation officielle.** Référence du système relationnel et du langage SQL : <https://dev.mysql.com/doc/>.
4. **MySQL2 — Quickstart.** Documentation du pilote Node.js utilisé par l’application : <https://sidorares.github.io/node-mysql2/docs>.
5. **express-session — dépôt officiel.** Documentation du middleware de session, de son stockage côté serveur et des options de cookie : <https://github.com/expressjs/session>.
6. **express-validator — Documentation.** Présentation des chaînes de validation et de nettoyage pour les requêtes Express : <https://express-validator.github.io/docs/>.
7. **Helmet.js — Documentation officielle.** Présentation des en-têtes HTTP de sécurité et de la Content Security Policy : <https://helmetjs.github.io/>.
8. **Bootstrap 5.3 — Get started.** Documentation du framework CSS chargé par les pages HTML : <https://getbootstrap.com/docs/5.3/getting-started/introduction/>.
9. **ExcelJS — dépôt officiel.** Documentation de la création de classeurs et feuilles XLSX : <https://github.com/exceljs/exceljs>.
10. **bcrypt pour Node.js — dépôt officiel.** Documentation de l’implémentation utilisée pour le hashage et la comparaison des mots de passe : <https://github.com/kelektiv/node.bcrypt.js>.
11. **csurf — dépôt officiel.** Documentation du middleware de jeton CSRF détecté dans le serveur : <https://github.com/expressjs/csurf>.
12. **PlantUML — site officiel.** Syntaxe et méthodes de rendu des diagrammes textuels : <https://plantuml.com/>.

## 3. Règles d’utilisation dans le rapport

- Les versions de dépendances proviennent du lockfile, et non des pages web.
- Les règles métier, rôles, routes, tables et résultats de tests proviennent exclusivement du projet actuel.
- Aucun fait sur l’entreprise, le stage, le déploiement ou les utilisateurs réels n’est déduit de ces documentations techniques.
- Les URL sont fournies pour la reproductibilité de la lecture technique, sans citation de contenu non utilisé.
