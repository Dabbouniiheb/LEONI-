# Glossaire et liste des abréviations

## Abréviations

| Abréviation | Signification | Emploi dans le projet |
| --- | --- | --- |
| API | *Application Programming Interface* | Routes HTTP JSON consommées par les scripts du navigateur. |
| BF | Besoin fonctionnel | Identifiant des capacités déduites de l’application réalisée. |
| CSP | *Content Security Policy* | Politique d’en-têtes configurée par Helmet pour limiter les sources de contenu. |
| CSRF | *Cross-Site Request Forgery* | Risque de requête forgée, traité par un jeton associé à la session. |
| CRUD | *Create, Read, Update, Delete* | Opérations de création, lecture, modification et suppression, notamment pour les utilisateurs. |
| CSV | *Comma-Separated Values* | Format texte d’export du planning. |
| CSS | *Cascading Style Sheets* | Feuille de styles de l’interface. |
| DB | *Database* | Base de données MySQL et couche d’accès associée. |
| FK | *Foreign Key* | Clé étrangère reliant deux tables. |
| HTML | *HyperText Markup Language* | Structure des pages servies par Express. |
| HTTP | *HyperText Transfer Protocol* | Protocole des requêtes entre navigateur et serveur. |
| JSON | *JavaScript Object Notation* | Format principal des réponses et corps d’API. |
| MVC | Modèle–Vue–Contrôleur | Source d’inspiration partielle de l’architecture, complétée par les routes, services et validations. |
| PK | *Primary Key* | Clé primaire d’une table. |
| RBAC | *Role-Based Access Control* | Contrôle d’accès basé sur les rôles et une matrice de permissions. |
| REST | *Representational State Transfer* | Style d’organisation des ressources et verbes HTTP ; l’API est décrite comme REST-like, sans revendiquer une conformité formelle complète. |
| RG | Règle de gestion | Identifiant d’une règle métier vérifiée dans le code. |
| SQL | *Structured Query Language* | Langage utilisé pour le schéma, les migrations et les requêtes MySQL. |
| UI | *User Interface* | Interface utilisateur affichée dans le navigateur. |
| UML | *Unified Modeling Language* | Langage de représentation utilisé pour les diagrammes PlantUML. |
| XLSX | Format Office Open XML pour tableur | Format Excel produit avec ExcelJS. |

## Termes fonctionnels et techniques

| Terme | Définition dans le contexte du projet |
| --- | --- |
| **Action d’audit** | Événement métier inséré dans `audit_logs`, par exemple une connexion, une création d’utilisateur, une génération ou un export. |
| **Active slot** | Colonne nullable de `work_sessions` valant `1` pendant l’état actif et `NULL` pour l’historique ; elle participe à la contrainte d’unicité d’une session active. |
| **Data Cleansing** | Rôle applicatif disposant principalement d’un accès à son planning, à sa sélection mensuelle, à ses congés et à son changement de mot de passe. |
| **Erreur opérationnelle** | Erreur applicative typée et sûre pour le client, dotée d’un code HTTP et éventuellement d’un code métier. |
| **Fenêtre de génération** | Période calculée côté serveur du 25 au dernier jour du mois dans le fuseau `Africa/Tunis`; elle autorise le mois immédiatement suivant. |
| **Groupe Home Office** | Choix mensuel `A` ou `B` déterminant les jours distants générés par l’algorithme. |
| **Heartbeat** | Requête périodique confirmant qu’une session de travail distante est encore active et permettant d’ajouter un intervalle borné aux secondes actives. |
| **Heures prévues** | Durée de référence d’une journée distante, stockée dans `planned_work_hour` avec une valeur par défaut de huit heures. |
| **Heures réalisées** | Durée recalculée à partir des secondes actives des sessions, stockée dans `work_hour` et plafonnée à huit heures par jour. |
| **Home Office** | Terme métier conservé par le projet pour désigner les jours planifiés à distance. |
| **Onboarding du mot de passe** | Étape obligatoire qui bloque les pages protégées tant que le mot de passe temporaire n’a pas été changé. |
| **Planning** | Ensemble des lignes de jours distants générés pour un utilisateur et un mois. |
| **Planning mensuel** | Planning associé à une clé `YYYY-MM` et à une sélection mensuelle de groupe. |
| **Requête paramétrée** | Requête SQL utilisant des marqueurs `?` et une liste de valeurs séparée, au lieu de concaténer les entrées utilisateur. |
| **Sélection mensuelle** | Enregistrement unique du groupe d’un utilisateur pour un mois dans `monthly_group_selections`. |
| **Session expirée** | Session de travail active devenue obsolète après dépassement de la grâce de heartbeat, clôturée avec le statut `expired`. |
| **Session HTTP** | État d’authentification conservé côté serveur, associé au cookie `leoni_session`. |
| **Session de travail** | Enregistrement de présence distante comportant début, heartbeat, fin, secondes actives et statut. |
| **Soft delete** | Suppression logique d’un utilisateur par `is_deleted` et `deleted_at`, sans suppression immédiate de la ligne. |
| **Team Leader** | Rôle applicatif doté de permissions d’administration, de consultation globale, d’export et d’audit. |
| **Transaction** | Groupe d’opérations MySQL validé par `commit` ou annulé par `rollback`, utilisé dans les flux sensibles. |

<!-- Sources projet : leoni-planing/config/constants.js, leoni-planing/config/permissions.js, leoni-planing/server.js, leoni-planing/services/PlanningService.js, leoni-planing/services/WorkSessionService.js, leoni-planing/sql/schema.sql -->
