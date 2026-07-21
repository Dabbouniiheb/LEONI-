# Résumé du projet

## Contexte et problème traité

Le projet `leoni-planing` est une application web interne consacrée à la gestion du planning Home Office et au suivi de certaines activités associées. Le code centralise des opérations qui, dans l’application, sont liées aux comptes, aux groupes mensuels, à la génération des jours distants, aux demandes de congé, aux heures réalisées et à la traçabilité. Le contexte organisationnel exact, le processus antérieur et l’état du déploiement ne figurent pas dans le dépôt et doivent être confirmés : `[INFORMATION À COMPLÉTER : Contexte métier validé, environnement de déploiement et population utilisatrice réelle]`.

La solution fournit deux profils : **Team Leader** et **Data Cleansing**. Le premier dispose des permissions d’administration des utilisateurs, de lecture globale, d’export, de traitement des congés, de synthèse des sessions et de consultation des journaux. Le second dispose d’un accès centré sur son planning, sa sélection mensuelle, ses congés, ses sessions de travail et son mot de passe. Les pages et les routes sensibles sont protégées côté serveur ; la barre latérale est également filtrée dans le navigateur selon les permissions renvoyées par la session.

## Solution et architecture

L’application utilise Node.js et Express 5.2.1. Le serveur sert des pages HTML et des assets CSS/JavaScript, puis expose des API JSON sous le préfixe `/api`. L’architecture est en couches, inspirée de MVC, mais elle n’est pas uniforme : les flux les plus structurés suivent `route → contrôleur → service → modèle → MySQL`, tandis que certains contrôleurs accèdent directement au pool MySQL. Le frontend est réalisé en HTML, CSS, Bootstrap 5.3.3 et JavaScript natif. Un client API commun gère les appels `fetch`, le jeton CSRF et les erreurs.

Le démarrage configure Helmet et une Content Security Policy, Morgan, deux limiteurs de requêtes, le traitement des corps, les fichiers statiques, des sessions Express stockées dans MySQL, la protection CSRF, les routes de pages et les routes API. Les erreurs asynchrones peuvent être transmises à un gestionnaire global qui masque les détails internes pour les erreurs non opérationnelles. L’accès à MySQL passe par `mysql2/promise` et un pool de dix connexions ; les flux de sélection mensuelle, de génération et de sessions de travail utilisent des transactions et des verrous lorsqu’une cohérence concurrente est nécessaire.

## Technologies principales

- Node.js en modules CommonJS ; version de projet non imposée dans `package.json`.
- Express 5.2.1 pour le serveur, le routage et les middlewares.
- MySQL avec `mysql2` 3.22.5 pour la persistance.
- `express-session` 1.19.0 et `express-mysql-session` 3.0.3 pour les sessions.
- bcrypt 6.0.0 pour les mots de passe.
- `express-validator` 7.3.2 pour les entrées.
- Helmet 8.2.0, `csurf` 1.11.0 et `express-rate-limit` 8.5.2 pour des contrôles HTTP observables.
- ExcelJS 4.4.0 pour l’export XLSX.
- HTML5, CSS, JavaScript navigateur, Bootstrap 5.3.3 et Font Awesome 6.5.2 pour l’interface.

## Modules réalisés

L’authentification se fait par e-mail et mot de passe. Après vérification bcrypt, un objet utilisateur réduit est enregistré en session. Les drapeaux `first_login` et `must_change_password` imposent un changement du mot de passe temporaire avant l’accès aux pages protégées. La gestion des utilisateurs permet au Team Leader de lister, créer, modifier et désactiver un compte par suppression logique.

La préparation du planning commence par un groupe A ou B enregistré pour un utilisateur et un mois. Cette sélection n’est modifiable que pendant la fenêtre serveur autorisée et reste verrouillée dès qu’un planning existe. La fenêtre, calculée depuis une heure MySQL convertie dans le fuseau `Africa/Tunis`, s’ouvre du 25 au dernier jour du mois et n’autorise que le mois suivant. Le groupe A reçoit les mercredis, jeudis et premier, troisième et éventuel cinquième vendredis ; le groupe B reçoit les lundis, mardis et deuxième et quatrième vendredis. Le service insère uniquement les jours distants calculés, dans une transaction, après avoir refusé l’absence de sélection et un planning déjà créé.

Le planning peut être consulté sous forme de tableau filtrable ou de calendriers mensuels. Le tableau de bord calcule des indicateurs d’utilisateurs, de groupes et de plannings. L’interface produit aussi des bannières d’état et un tableau de suivi pour le Team Leader. Les exports CSV et XLSX peuvent être filtrés par mois, groupe et utilisateur. Les actions principales sont inscrites dans `audit_logs`, et une page affiche les cent événements les plus récents.

La gestion des congés permet de créer une demande, de consulter ses demandes et d’annuler une demande encore en attente. Le Team Leader peut consulter l’ensemble, approuver ou rejeter une demande d’un autre utilisateur. Le service refuse les plages invalides, les chevauchements avec une demande en attente ou approuvée, l’auto-approbation et le traitement d’une demande qui n’est plus en attente.

Le suivi du travail à distance s’active uniquement lorsqu’une ligne de planning distante appartient à l’utilisateur pour la date du serveur. Il crée ou reprend une session, reçoit un heartbeat, met en pause après inactivité côté interface, permet la fin explicite et expire les sessions devenues obsolètes. Les secondes actives sont cumulées et transformées en heures réelles, plafonnées à huit heures par jour, tandis que `planned_work_hour` conserve les huit heures prévues. Une contrainte de base vise à empêcher plusieurs sessions actives pour le même utilisateur, le même planning et la même date.

## Base de données et sécurité

Le schéma métier comprend `users`, `monthly_group_selections`, `planning`, `work_sessions`, `leave_requests` et `audit_logs`. Les clés étrangères relient les enregistrements aux utilisateurs et au planning ; des contraintes uniques protègent les identités, la sélection mensuelle, les dates du planning et la session active. Le serveur configure en outre un magasin de sessions MySQL géré par la bibliothèque.

Les mécanismes de sécurité observés comprennent le hashage bcrypt, les cookies de session `HttpOnly`, `SameSite=Lax` et `Secure` en production, la protection CSRF, les en-têtes Helmet, la limitation des API et des tentatives de connexion, les validations serveur, les requêtes SQL paramétrées, la vérification des permissions, le changement obligatoire du mot de passe et l’audit de nombreuses actions. Ces mécanismes sont décrits comme implémentés, sans conclure à une sécurité absolue.

## Tests, résultats et limites

La commande `node --test tests/*.test.js` a été exécutée le 15 juillet 2026 avec Node.js v24.16.0. Les **19 tests ont réussi**, sans échec ni test ignoré. Ils couvrent la fenêtre du 25, les fins de mois, février et les années bissextiles, le fuseau Tunis, le passage d’année, le mois cible, la sélection mensuelle, l’absence de sélection, le doublon de planning et la génération pour les groupes A et B.

La couverture automatisée reste concentrée sur ces règles. L’authentification, les autorisations, les utilisateurs, les congés, les sessions de travail, les exports, l’audit, la base réelle et l’interface ne disposent pas de tests automatisés identifiés. D’autres limites directement observables sont le champ `planning.horaire` conservé comme placeholder, l’absence de pagination sur les listes, des alertes de tableau de bord calculées dans le navigateur sans stockage dédié, l’emploi résiduel de `users.group_id` dans certaines synthèses alors que le planning emploie les sélections mensuelles, l’absence d’un workflow de déploiement visible et un script `npm test` qui n’appelle pas les tests pourtant présents. Ces points constituent des pistes de consolidation et non une remise en cause des fonctions déjà vérifiées.

<!-- Sources projet : leoni-planing/server.js, leoni-planing/package.json, leoni-planing/package-lock.json, leoni-planing/config/constants.js, leoni-planing/config/permissions.js, leoni-planing/services/PlanningService.js, leoni-planing/services/MonthlyGroupSelectionService.js, leoni-planing/services/LeaveRequestService.js, leoni-planing/services/WorkSessionService.js, leoni-planing/sql/schema.sql, leoni-planing/tests/ -->
