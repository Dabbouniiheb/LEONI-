# Plan de présentation de soutenance

## 1. Format proposé

- **Nombre de diapositives :** 15.
- **Durée cible :** environ 13 minutes 15 secondes, dans une plage de 10 à 15 minutes.
- **Principe :** une idée principale par diapositive, très peu de texte, et priorité aux diagrammes et captures anonymisées.
- **Périmètre :** uniquement les fonctionnalités, règles et limites vérifiables dans le code source actuel.
- **Confidentialité :** masquer noms, usernames, e-mails, matricules, départements, identifiants, motifs de congé, commentaires et détails d'audit. Ne jamais afficher de mot de passe, cookie, token ou configuration sensible.

## 2. Vue d'ensemble du minutage

| Diapositive | Sujet | Durée cible |
| ---: | --- | ---: |
| 1 | Titre et objectif | 0 min 30 s |
| 2 | Périmètre fonctionnel | 0 min 45 s |
| 3 | Acteurs et autorisations | 0 min 45 s |
| 4 | Architecture applicative | 1 min 00 s |
| 5 | Modèle de données | 0 min 55 s |
| 6 | Authentification et sécurité | 0 min 50 s |
| 7 | Gestion des utilisateurs | 0 min 50 s |
| 8 | Sélection mensuelle et génération | 1 min 15 s |
| 9 | Consultation du planning et calendrier | 0 min 55 s |
| 10 | Suivi des sessions de travail distant | 1 min 10 s |
| 11 | Demandes de congé | 0 min 55 s |
| 12 | Dashboard, exports et audit | 0 min 55 s |
| 13 | Interface et responsive | 0 min 55 s |
| 14 | Tests et limites actuelles | 0 min 55 s |
| 15 | Conclusion et démonstration | 0 min 40 s |
|  | **Total** | **13 min 15 s** |

## 3. Contenu détaillé des diapositives

### Diapositive 1 — Application LEONI Planning

- **Message principal :** présenter clairement l'objet technique de la soutenance.
- **Contenu maximal à l'écran :**
  - `LEONI Planning` ;
  - `Application web de gestion du planning Home Office` ;
  - `[INFORMATION À COMPLÉTER : Nom de l'étudiant]` ;
  - `[INFORMATION À COMPLÉTER : Formation et année universitaire]`.
- **Visuel suggéré :** favicon local de l'application ou capture **CAP-04** recadrée, sans données lisibles.
- **Notes orales :** « Je présente une application web interne qui organise la sélection mensuelle des groupes Home Office, génère les jours distants et fournit des fonctions de suivi autour de ce planning. La présentation reste centrée sur ce qui est effectivement implémenté dans le code. »
- **Durée :** 30 secondes.
- **Sources code :** `leoni-planing/server.js:1-14`, `leoni-planing/views/assets/favicon.svg`, `leoni-planing/package.json:1-14`.

### Diapositive 2 — Périmètre fonctionnel actuel

- **Message principal :** montrer l'étendue réelle de l'application sans entrer encore dans les détails.
- **Contenu maximal à l'écran :** six blocs :
  - authentification et rôles ;
  - utilisateurs ;
  - sélection mensuelle et planning ;
  - suivi du travail distant ;
  - demandes de congé ;
  - dashboard, export et audit.
- **Visuel suggéré :** carte fonctionnelle simple avec six icônes reliées à « LEONI Planning ».
- **Notes orales :** « Le noyau est le planning Home Office. Autour de ce noyau, le code ajoute la gestion des comptes, les sessions de travail distant, les congés, les indicateurs, les exports CSV/XLSX et le journal d'audit. »
- **Durée :** 45 secondes.
- **Sources code :** `leoni-planing/server.js:146-174`, `leoni-planing/config/sidebar.js:11-68`.

### Diapositive 3 — Deux acteurs, des droits différents

- **Message principal :** expliquer la séparation entre Team Leader et Data Cleansing.
- **Contenu maximal à l'écran :**
  - **Team Leader :** utilisateurs, tous les plannings, suivi mensuel, congés à traiter, exports, audit ;
  - **Data Cleansing :** planning personnel, sélection de groupe, calendrier, session distante, demande de congé ;
  - **Commun :** dashboard, changement de mot de passe, déconnexion.
- **Visuel suggéré :** mini-matrice rôles × modules ou captures **CAP-04** et **CAP-05** côte à côte.
- **Notes orales :** « Les permissions atomiques sont envoyées avec la session. Elles filtrent la navigation côté client, tandis que les middlewares Express assurent le contrôle déterminant côté serveur. »
- **Durée :** 45 secondes.
- **Sources code :** `leoni-planing/config/permissions.js:12-84`, `leoni-planing/middlewares/auth.js:19-97`, `leoni-planing/views/assets/js/layout.js:16-35`.

### Diapositive 4 — Architecture de l'application

- **Message principal :** présenter le chemin d'une requête du navigateur à MySQL.
- **Contenu maximal à l'écran :**
  - pages HTML statiques et JavaScript natif ;
  - client API centralisé ;
  - Express : routes et middlewares ;
  - contrôleurs ;
  - services et modèles pour les domaines principaux ;
  - base MySQL.
- **Visuel suggéré :** diagramme horizontal : `Navigateur → Routes Express → Contrôleur → Service → Modèle → MySQL`, avec une flèche retour JSON. Préciser que certains contrôleurs accèdent directement à la base.
- **Notes orales :** « Le frontend est servi par Express et construit les écrans dynamiquement. `api.js` centralise les appels. Pour le planning, les groupes mensuels, les sessions et les congés, les contrôleurs délèguent aux services puis aux modèles. Les contrôleurs d'authentification, utilisateurs, dashboard, export et logs exécutent encore certaines requêtes SQL directement. »
- **Durée :** 1 minute.
- **Sources code :** `leoni-planing/server.js:31-174`, `leoni-planing/views/assets/js/api.js:7-218`, `leoni-planing/controllers/planningController.js:1-16`, `leoni-planing/services/PlanningService.js:1-18`, `leoni-planing/models/Planning.js:1-110`.

### Diapositive 5 — Modèle de données métier

- **Message principal :** relier les modules aux entités persistées.
- **Contenu maximal à l'écran :**
  - `users` au centre ;
  - `monthly_group_selections` par utilisateur et mois ;
  - `planning` pour les jours distants ;
  - `work_sessions` pour le temps réellement suivi ;
  - `leave_requests` pour le workflow de congé ;
  - `audit_logs` pour la traçabilité.
- **Visuel suggéré :** diagramme entité-relation simplifié, sans toutes les colonnes.
- **Notes orales :** « L'utilisateur est l'entité pivot. Une sélection mensuelle détermine le groupe utilisé pour générer le planning. Les sessions de travail se rattachent au planning du jour. Les congés et les logs conservent leur propre cycle de vie. »
- **Durée :** 55 secondes.
- **Sources code :** `leoni-planing/sql/schema.sql`, `leoni-planing/sql/migrations/002_create_leave_requests.sql`, `leoni-planing/sql/migrations/004_create_work_sessions.sql`, `leoni-planing/sql/migrations/007_create_monthly_group_selections.sql`.

### Diapositive 6 — Authentification, onboarding et sécurité

- **Message principal :** montrer que l'accès repose sur une session serveur et un changement obligatoire du mot de passe temporaire.
- **Contenu maximal à l'écran :**
  - login par e-mail ;
  - mot de passe haché avec bcrypt ;
  - session MySQL et cookie HTTP-only ;
  - changement obligatoire au premier accès ;
  - CSRF, Helmet et limitation de débit ;
  - permissions serveur.
- **Visuel suggéré :** séquence courte `Login → vérification → session → changement obligatoire ou dashboard`, accompagnée des captures **CAP-01** et **CAP-03**.
- **Notes orales :** « Le login recherche l'utilisateur par e-mail, compare le hash bcrypt puis place un profil réduit et ses permissions dans la session. Si `first_login` ou `must_change_password` est actif, toutes les pages métier redirigent vers le changement de mot de passe. »
- **Durée :** 50 secondes.
- **Sources code :** `leoni-planing/controllers/authController.js:22-122`, `leoni-planing/middlewares/auth.js:19-97`, `leoni-planing/server.js:39-76,89-140`, `leoni-planing/validations/authValidation.js:3-26`.

### Diapositive 7 — Gestion des utilisateurs

- **Message principal :** décrire le cycle de vie d'un compte administré par le Team Leader.
- **Contenu maximal à l'écran :**
  - liste des utilisateurs ;
  - création avec mot de passe temporaire ;
  - modification de l'identité, du matricule, du département et du rôle ;
  - désactivation logique ;
  - journalisation des actions.
- **Visuel suggéré :** capture **CAP-07** avec incrustations des modales **CAP-08** et **CAP-10**.
- **Notes orales :** « Le Team Leader gère les comptes depuis une seule page. La suppression ne détruit pas les données : elle positionne `is_deleted`, ce qui préserve les références historiques. Le code actuel ne fournit pas de reset administré du mot de passe ni de restauration par l'interface. »
- **Durée :** 50 secondes.
- **Sources code :** `leoni-planing/routes/userRoutes.js:16-53`, `leoni-planing/controllers/userController.js:20-133`, `leoni-planing/views/assets/js/users.js:7-347`.

### Diapositive 8 — Du groupe mensuel au planning généré

- **Message principal :** expliquer la règle métier la plus structurante et les protections contre les incohérences.
- **Contenu maximal à l'écran :**
  - fenêtre serveur : du 25 à la fin du mois ;
  - seul le mois suivant calculé est autorisé ;
  - sélection A/B obligatoire et verrouillée après génération ;
  - Groupe A : mercredi, jeudi, vendredis 1/3/5 ;
  - Groupe B : lundi, mardi, vendredis 2/4 ;
  - transaction et refus d'un planning déjà existant.
- **Visuel suggéré :** flux `Fenêtre ouverte → sélection A/B → contrôles → calcul des dates → insertion en lot`, plus capture **CAP-11** ou **CAP-12**.
- **Notes orales :** « Le navigateur ne choisit pas librement le mois. Il interroge l'API de fenêtre, puis l'utilisateur enregistre son groupe pour ce mois. Le service revalide la fenêtre dans la transaction, refuse l'absence de sélection et les doublons, calcule les jours puis les insère en lot. »
- **Durée :** 1 minute 15 secondes.
- **Sources code :** `leoni-planing/utils/planningGenerationWindow.js`, `leoni-planing/services/PlanningGenerationWindowService.js:1-16`, `leoni-planing/services/MonthlyGroupSelectionService.js:65-151`, `leoni-planing/services/PlanningService.js:20-152`, `leoni-planing/views/assets/js/planning.js:35-120,408-607,1048-1125`.

### Diapositive 9 — Consultation du planning et calendrier

- **Message principal :** montrer les deux représentations complémentaires des données générées.
- **Contenu maximal à l'écran :**
  - tableau : employé, groupe, mois, date distante, statut, heures, horaire ;
  - filtres Team Leader : mois, nom, groupe ;
  - filtre personnel : mois ;
  - calendrier mensuel par utilisateur et groupe.
- **Visuel suggéré :** captures **CAP-14** et **CAP-15** côte à côte.
- **Notes orales :** « Le service limite automatiquement Data Cleansing à ses propres lignes. Le Team Leader peut filtrer l'ensemble. La page Calendar regroupe les lignes par utilisateur et mois. La colonne `horaire` existe mais reste un placeholder lorsqu'elle n'est pas renseignée. »
- **Durée :** 55 secondes.
- **Sources code :** `leoni-planing/services/PlanningService.js:154-243`, `leoni-planing/models/Planning.js:40-108`, `leoni-planing/views/assets/js/planning.js:156-225,609-650`, `leoni-planing/views/assets/js/calendar.js:31-157`, `leoni-planing/sql/schema.sql:64`.

### Diapositive 10 — Suivi automatique du travail distant

- **Message principal :** expliquer comment le système mesure le temps actif sans collecter le contenu de l'activité.
- **Contenu maximal à l'écran :**
  - démarrage automatique si le planning du jour est distant ;
  - heartbeat toutes les 60 secondes ;
  - pause si page masquée ou 5 minutes d'inactivité ;
  - reprise automatique ;
  - fin manuelle ;
  - plafonnement quotidien à 8 heures.
- **Visuel suggéré :** diagramme d'états `Active ↔ Paused → Ended/Expired` et capture **CAP-16**.
- **Notes orales :** « Le frontend observe uniquement des événements d'activité en mémoire pour décider d'envoyer ou de suspendre le heartbeat. Le texte d'interface précise qu'il ne stocke ni captures, ni frappes, ni coordonnées, ni sites consultés. Le backend consolide ensuite les secondes actives et met à jour `work_hour`. »
- **Durée :** 1 minute 10 secondes.
- **Sources code :** `leoni-planing/config/constants.js:51-56,97-110`, `leoni-planing/routes/workSessionRoutes.js:21-79`, `leoni-planing/services/WorkSessionService.js`, `leoni-planing/views/assets/js/planning.js:122-154,652-960`.

### Diapositive 11 — Workflow des demandes de congé

- **Message principal :** présenter un cycle complet de soumission et de décision basé sur les rôles.
- **Contenu maximal à l'écran :**
  - création avec période, type et commentaire ;
  - statuts `pending`, `approved`, `rejected`, `cancelled` ;
  - annulation personnelle tant que la demande est en attente ;
  - approbation/rejet par le Team Leader ;
  - commentaire de décision et audit.
- **Visuel suggéré :** cycle d'états et captures **CAP-18** / **CAP-19**.
- **Notes orales :** « Chaque utilisateur suit ses propres demandes. Le Team Leader dispose en plus d'un tableau global et d'un modal de décision. Le service vérifie l'auteur, le statut courant et interdit le traitement de sa propre demande. »
- **Durée :** 55 secondes.
- **Sources code :** `leoni-planing/config/constants.js:30-43`, `leoni-planing/routes/leaveRequestRoutes.js:19-75`, `leoni-planing/services/LeaveRequestService.js`, `leoni-planing/views/assets/js/leave-requests.js:8-412`.

### Diapositive 12 — Pilotage, export et traçabilité

- **Message principal :** montrer comment le Team Leader obtient une vue synthétique et extrait les données.
- **Contenu maximal à l'écran :**
  - indicateurs : utilisateurs, validation, groupes A/B, plannings complétés ;
  - tableau de suivi des employés ;
  - export CSV et XLSX filtré ;
  - 100 derniers événements d'audit.
- **Visuel suggéré :** montage de **CAP-04**, **CAP-21** et **CAP-23**, avec données masquées.
- **Notes orales :** « Le dashboard agrège trois requêtes : utilisateurs, sélections mensuelles et plannings. Les exports reprennent ID, username, matricule, nom, date distante et heure de travail. Les opérations sensibles ajoutent une ligne dans l'audit consultable par le Team Leader. Les bannières du dashboard sont des alertes calculées à l'affichage, pas des notifications persistantes ni des e-mails. »
- **Durée :** 55 secondes.
- **Sources code :** `leoni-planing/controllers/dashboardController.js:17-71`, `leoni-planing/views/assets/js/dashboard.js:18-237`, `leoni-planing/controllers/exportController.js:17-106`, `leoni-planing/controllers/logController.js:4-14`.

### Diapositive 13 — Interface web responsive

- **Message principal :** présenter la cohérence visuelle et l'adaptation aux tailles d'écran.
- **Contenu maximal à l'écran :**
  - shell commun : sidebar, topbar, profil et logout ;
  - navigation filtrée par permission ;
  - tableaux à défilement horizontal ;
  - grilles et formulaires réorganisés sur mobile ;
  - toasts, chargement et confirmations.
- **Visuel suggéré :** capture bureau et **CAP-20** mobile côte à côte.
- **Notes orales :** « La feuille CSS définit un design system sobre, puis trois seuils responsive. Sous 992 pixels, la sidebar devient un tiroir. Sous 576 pixels, les formulaires et les grilles passent sur une colonne. Les pages métier dépendent toutefois de JavaScript et de ressources CDN. »
- **Durée :** 55 secondes.
- **Sources code :** `leoni-planing/views/assets/js/layout.js:12-247`, `leoni-planing/views/assets/css/leoni.css:11-61,118-430,1786-1969`, `leoni-planing/views/*.html`.

### Diapositive 14 — Validation existante et limites actuelles

- **Message principal :** distinguer clairement les règles automatisées des parcours encore non testés.
- **Contenu maximal à l'écran :**
  - tests présents : fenêtre, mois autorisé, sélection mensuelle, doublons, groupes A/B ;
  - tests absents : UI, routes HTTP, authentification, congés, sessions, export, accessibilité ;
  - `npm test` non relié aux fichiers `node:test` ;
  - listes sans pagination ;
  - login e-mail uniquement ;
  - aucune notification persistante/email/Teams ;
  - `horaire` placeholder.
- **Visuel suggéré :** tableau « Couvert / À valider » ou extrait synthétique de la matrice de traçabilité.
- **Notes orales :** « Trois fichiers de tests ciblent le cœur du planning et la fenêtre mensuelle. Ils ne couvrent pas encore les parcours complets. Je sépare donc les comportements confirmés par inspection du code, les tests présents et les validations manuelles à réaliser par captures. »
- **Durée :** 55 secondes.
- **Sources code :** `leoni-planing/tests/planningGenerationWindow.test.js`, `leoni-planing/tests/planningServiceGenerationGuard.test.js`, `leoni-planing/tests/monthlyGroupSelectionWindowGuard.test.js`, `leoni-planing/package.json:6-10`, `rapport_stage/04_matrice_tracabilite.md`.

### Diapositive 15 — Conclusion et scénario de démonstration

- **Message principal :** conclure par le parcours métier complet effectivement implémenté.
- **Contenu maximal à l'écran :**
  - `Compte → premier mot de passe → groupe mensuel → planning → calendrier → session distante` ;
  - fonctions Team Leader : comptes, suivi, congés, export, audit ;
  - message final : solution intégrée et traçable, avec limites identifiées.
- **Visuel suggéré :** frise du parcours ou cinq miniatures **CAP-03**, **CAP-11**, **CAP-14**, **CAP-16**, **CAP-21**.
- **Notes orales :** « La démonstration peut suivre le parcours d'un utilisateur depuis son premier accès jusqu'au suivi du travail distant, puis basculer sur le rôle Team Leader pour montrer le pilotage, l'export et l'audit. Je conclus en rappelant que la matrice indique précisément ce qui est confirmé, testé ou encore à valider. »
- **Durée :** 40 secondes.
- **Sources code :** `leoni-planing/routes/viewRoutes.js`, `leoni-planing/config/permissions.js`, `leoni-planing/views/assets/js/`, `rapport_stage/04_matrice_tracabilite.md`.

## 4. Ordre conseillé pour la démonstration en direct

Si une démonstration est intégrée aux 15 minutes, limiter la navigation à trois minutes et utiliser des comptes/données autorisés :

1. ouvrir `/login` et expliquer le login e-mail sans saisir de secret visible ;
2. montrer le dashboard Data Cleansing puis `/planning-page` ;
3. présenter la sélection mensuelle et un planning déjà généré, sans provoquer une nouvelle écriture ;
4. ouvrir `/calendar-page` et l'état d'une session distante existante ;
5. basculer vers une session Team Leader préparée séparément ;
6. montrer `/dashboard`, `/users-page`, `/export-page` et `/logs-page` sans exécuter de suppression, décision ou export non autorisé.

Prévoir une version de secours entièrement basée sur les captures CAP-01 à CAP-25 si l'environnement applicatif ou la base n'est pas disponible le jour de la soutenance.

## 5. Règles de conception des diapositives

- Ne pas dépasser cinq à six éléments courts par diapositive.
- Utiliser une police lisible et un contraste élevé ; éviter les paragraphes à l'écran.
- Introduire chaque diagramme ou capture oralement et lui attribuer une légende.
- Ne pas afficher de grands extraits de code ; citer plutôt le fichier et le symbole dans les notes.
- Ne pas affirmer qu'un test a réussi, qu'une fonctionnalité est déployée ou qu'une performance est mesurée sans preuve d'exécution correspondante.
- Présenter les alertes du dashboard comme des états calculés côté client, sans les qualifier de notifications persistantes.
- Présenter `horaire` comme un champ placeholder et `work_hour` comme la valeur de temps de travail mise à jour par le suivi des sessions.

<!-- Sources projet : leoni-planing/server.js, leoni-planing/package.json, leoni-planing/config/, leoni-planing/routes/, leoni-planing/controllers/, leoni-planing/services/, leoni-planing/models/, leoni-planing/validations/, leoni-planing/views/, leoni-planing/sql/, leoni-planing/tests/, rapport_stage/04_matrice_tracabilite.md -->
